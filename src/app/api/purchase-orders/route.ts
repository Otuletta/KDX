import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const supplierId = searchParams.get("supplierId");
        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const where: Record<string, unknown> = { tenantId };
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
        const { supplierId, autoGenerate, repeatLast, notes } = body;

        let itemsToCreate = body.items || [];

        // Repeat last order logic
        if (repeatLast && supplierId) {
            const lastOrder = await prisma.purchaseOrder.findFirst({
                where: { supplierId },
                orderBy: { createdAt: "desc" },
                include: { items: true }
            });

            if (!lastOrder || lastOrder.items.length === 0) {
                return NextResponse.json(
                    { error: "No hay órdenes previas para repetir con este proveedor. Debe crear una orden manual." },
                    { status: 400 }
                );
            }

            itemsToCreate = lastOrder.items.map((item: any) => ({
                ingredientId: item.ingredientId,
                quantity: Number(item.quantity),
                estimatedCost: Number(item.estimatedCost),
            }));
        }
        // Auto-generate logic
        else if (autoGenerate && supplierId) {
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

        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        const branchId = session?.user?.branchId;
        if (!tenantId || !branchId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const order = await prisma.purchaseOrder.create({
            data: {
                tenant: { connect: { id: tenantId } },
                branch: { connect: { id: branchId } },
                ...(supplierId ? { supplierId } : {}),
                status: "DRAFT",
                totalAmount,
                notes,
                items: {
                    create: itemsToCreate.map((item: { ingredientId: string; quantity: number; estimatedCost: number }) => ({
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
