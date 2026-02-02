import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const supplierId = searchParams.get("supplierId");

        const where: Record<string, unknown> = {};
        if (supplierId) {
            where.supplierId = supplierId;
        }

        const orders = await prisma.purchaseOrder.findMany({
            where,
            include: {
                items: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Error fetching purchase orders:", error);
        return NextResponse.json(
            { error: "Error al obtener órdenes de compra" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { supplierId, autoGenerate } = body;

        let itemsToCreate = body.items || [];

        // Auto-generate logic
        if (autoGenerate && supplierId) {
            const lowStockIngredients = await prisma.ingredient.findMany({
                where: {
                    supplierId,
                    isActive: true,
                },
            });

            // Filter logic in JS because we need to compare decimal fields which Prisma filter limitation sometimes makes tricky depending on version/schema types for comparison of field vs field (current < min)
            // Actually standard filtering is better done in JS for complex "stock status" logic we reused

            const suggestedItems = lowStockIngredients
                .filter((ing) => Number(ing.currentStock) <= Number(ing.minStock))
                .map((ing) => {
                    const current = Number(ing.currentStock);
                    const min = Number(ing.minStock);
                    // Suggest restocking to 2x min stock or at least min + 1
                    const suggestion = Math.max(min * 1.5 - current, 0);

                    return {
                        ingredientId: ing.id,
                        quantity: suggestion > 0 ? suggestion : 1, // Default at least 1 unit if logic fails
                        estimatedCost: Number(ing.avgCost),
                    };
                });

            if (suggestedItems.length === 0 && autoGenerate) {
                return NextResponse.json(
                    { error: "No hay ingredientes con stock bajo para este proveedor" },
                    { status: 400 }
                );
            }

            itemsToCreate = suggestedItems;
        }

        // Calculate total
        const totalAmount = itemsToCreate.reduce(
            (sum: number, item: { quantity: number; estimatedCost: number }) =>
                sum + (item.quantity * item.estimatedCost), 0
        );

        const order = await prisma.purchaseOrder.create({
            data: {
                supplierId,
                status: "DRAFT",
                totalAmount,
                items: {
                    create: itemsToCreate.map((item: any) => ({
                        ingredientId: item.ingredientId,
                        quantity: item.quantity,
                        estimatedCost: item.estimatedCost,
                    }))
                }
            },
            include: {
                items: true,
            },
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("Error creating purchase order:", error);
        return NextResponse.json(
            { error: "Error al crear orden de compra" },
            { status: 500 }
        );
    }
}
