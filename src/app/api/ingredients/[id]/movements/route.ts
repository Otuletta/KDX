import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        const tenantId = session?.user?.tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const id = (await params).id;

        // Verify the ingredient belongs to the tenant
        const ingredient = await prisma.ingredient.findFirst({
            where: { id, tenantId },
        });

        if (!ingredient) {
            return NextResponse.json({ error: "Ingrediente no encontrado" }, { status: 404 });
        }

        const movements = await prisma.stockMovement.findMany({
            where: {
                ingredientId: id,
            },
            include: {
                branch: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(movements);
    } catch (error) {
        console.error("Error fetching stock movements:", error);
        return NextResponse.json(
            { error: "Error al obtener historial de movimientos" },
            { status: 500 }
        );
    }
}
