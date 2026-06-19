import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate type
        if (!["IN", "OUT", "ADJUST"].includes(body.type)) {
            return NextResponse.json(
                { error: "Tipo de movimiento inválido" },
                { status: 400 }
            );
        }

        // Get current ingredient
        const ingredient = await prisma.ingredient.findUnique({
            where: { id },
        });

        if (!ingredient) {
            return NextResponse.json(
                { error: "Ingrediente no encontrado" },
                { status: 404 }
            );
        }

        // Calculate new stock
        const currentStock = Number(ingredient.currentStock);
        const quantity = Number(body.quantity);
        let newStock: number;

        if (body.type === "IN") {
            newStock = currentStock + quantity;
        } else if (body.type === "OUT") {
            newStock = currentStock - quantity;
            if (newStock < 0) {
                return NextResponse.json(
                    { error: "Stock insuficiente" },
                    { status: 400 }
                );
            }
        } else {
            // ADJUST - set absolute value
            newStock = quantity;
        }

        const session = await getSession();
        const branchId = session?.user?.branchId;
        if (!branchId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Create movement and update stock in transaction
        const [movement] = await prisma.$transaction([
            prisma.stockMovement.create({
                data: {
                    branchId: branchId,
                    ingredientId: id,
                    type: body.type,
                    quantity: body.type === "ADJUST" ? quantity - currentStock : quantity,
                    reason: body.reason,
                    referenceId: body.referenceId,
                },
            }),
            prisma.ingredient.update({
                where: { id },
                data: { currentStock: newStock },
            }),
        ]);

        // If it's a purchase (IN), optionally update price history
        if (body.type === "IN" && body.unitCost) {
            await prisma.priceHistory.create({
                data: {
                    ingredientId: id,
                    price: body.unitCost,
                    quantity: quantity,
                    supplierId: body.supplierId,
                    invoiceRef: body.invoiceRef,
                    notes: body.reason,
                },
            });

            // Update average cost (weighted average)
            const avgCost = Number(ingredient.avgCost);
            const totalOldValue = avgCost * currentStock;
            const newValue = Number(body.unitCost) * quantity;
            const newAvgCost =
                newStock > 0 ? (totalOldValue + newValue) / newStock : body.unitCost;

            await prisma.ingredient.update({
                where: { id },
                data: { avgCost: newAvgCost },
            });
        }

        return NextResponse.json(movement, { status: 201 });
    } catch (error) {
        console.error("Error creating stock movement:", error);
        return NextResponse.json(
            { error: "Error al registrar movimiento" },
            { status: 500 }
        );
    }
}
