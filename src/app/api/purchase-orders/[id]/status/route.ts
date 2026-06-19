import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {

        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        const branchId = session?.user?.branchId; // needed to add stock movements

        if (!tenantId || !branchId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const id = (await params).id;
        const body = await request.json();
        const { status } = body;

        if (!status || !["SENT", "RECEIVED", "CANCELLED"].includes(status)) {
            return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
        }

        const order = await prisma.purchaseOrder.findFirst({
            where: { id, tenantId },
            include: { items: true },
        });

        if (!order) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        // Apply status update
        const updatedOrder = await prisma.purchaseOrder.update({
            where: { id },
            data: {
                status,
                sentAt: status === "SENT" ? new Date() : undefined,
                receivedAt: status === "RECEIVED" ? new Date() : undefined,
            },
        });

        // If order is marked as RECEIVED, increment inventory stocks
        if (status === "RECEIVED" && order.status !== "RECEIVED") {
            // Process all items in a transaction
            await prisma.$transaction(
                order.items.map((item) => {
                    return prisma.stockMovement.create({
                        data: {
                            branchId,
                            ingredientId: item.ingredientId,
                            type: "IN",
                            quantity: item.quantity,
                            reason: `Recepción de OC #${id.slice(-6).toUpperCase()}`,
                            referenceId: id,
                        }
                    });
                })
            );

            // Update underlying ingredient current stock
            await prisma.$transaction(
                order.items.map((item) => {
                    return prisma.ingredient.update({
                        where: { id: item.ingredientId },
                        data: {
                            currentStock: {
                                increment: item.quantity,
                            },
                            // Optional: Calculate and apply moving average cost based on actual cost if we had it
                        },
                    });
                })
            );
        }

        return NextResponse.json(updatedOrder);
    } catch (error) {
        console.error("Error updating purchase order status:", error);
        return NextResponse.json(
            { error: "Error interno al actualizar estado" },
            { status: 500 }
        );
    }
}
