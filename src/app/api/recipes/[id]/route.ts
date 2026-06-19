import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const recipe = await prisma.recipe.findUnique({
            where: { id },
            include: {
                ingredients: {
                    include: {
                        ingredient: true,
                    },
                },
                products: true,
                productionBatches: {
                    orderBy: { producedAt: "desc" },
                    take: 10,
                },
            },
        });

        if (!recipe) {
            return NextResponse.json(
                { error: "Receta no encontrada" },
                { status: 404 }
            );
        }

        return NextResponse.json(recipe);
    } catch (error) {
        console.error("Error fetching recipe:", error);
        return NextResponse.json(
            { error: "Error al obtener receta" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // If updating ingredients, recalculate cost
        const updateData: Record<string, unknown> = {
            name: body.name,
            description: body.description,
            yield: body.yield,
            yieldUnit: body.yieldUnit,
            targetMargin: body.targetMargin,
            category: body.category,
            prepTime: body.prepTime,
            instructions: body.instructions,
        };

        // Recalculate prices if margin changed
        if (body.targetMargin !== undefined) {
            const recipe = await prisma.recipe.findUnique({ where: { id } });
            if (recipe) {
                const costPerUnit = Number(recipe.calculatedCost);
                const targetMargin = body.targetMargin;
                const suggestedPrice =
                    targetMargin >= 100
                        ? costPerUnit * 10
                        : costPerUnit / (1 - targetMargin / 100);
                updateData.suggestedPrice = suggestedPrice;
            }
        }

        const recipe = await prisma.recipe.update({
            where: { id },
            data: updateData,
            include: {
                ingredients: {
                    include: {
                        ingredient: true,
                    },
                },
            },
        });

        return NextResponse.json(recipe);
    } catch (error) {
        console.error("Error updating recipe:", error);
        return NextResponse.json(
            { error: "Error al actualizar receta" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await prisma.recipe.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting recipe:", error);
        return NextResponse.json(
            { error: "Error al eliminar receta" },
            { status: 500 }
        );
    }
}
