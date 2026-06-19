import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "20");
        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Validate limit
        const validLimit = isNaN(limit) || limit <= 0 ? 20 : Math.min(limit, 100);

        const batches = await prisma.productionBatch.findMany({
            where: { tenantId },
            take: validLimit,
            orderBy: { producedAt: "desc" },
            include: {
                recipe: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json(batches);
    } catch (error) {
        console.error("Error fetching production batches:", error);
        return NextResponse.json(
            { error: "Error al obtener historial" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {

        const body = await request.json();
        const { recipeId, quantity } = body;

        // Validation
        if (!recipeId) {
            return NextResponse.json(
                { error: "El ID de la receta es requerido" },
                { status: 400 }
            );
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            return NextResponse.json(
                { error: "La cantidad debe ser un número mayor a 0" },
                { status: 400 }
            );
        }

        // Get recipe with ingredients
        const recipe = await prisma.recipe.findUnique({
            where: { id: recipeId },
            include: {
                ingredients: {
                    include: {
                        ingredient: true,
                    },
                },
            },
        });

        if (!recipe) {
            return NextResponse.json(
                { error: "Receta no encontrada" },
                { status: 404 }
            );
        }

        // Calculate multiplier based on recipe yield (protected against division by zero)
        const recipeYield = Number(recipe.yield);
        if (recipeYield <= 0) {
            return NextResponse.json(
                { error: "La receta tiene un rendimiento inválido" },
                { status: 400 }
            );
        }

        const multiplier = qty / recipeYield;

        // Check if we have enough stock for all ingredients
        const insufficientStock: string[] = [];

        for (const item of recipe.ingredients) {
            const requiredQty = Number(item.quantity) * multiplier;
            const currentStock = Number(item.ingredient.currentStock);

            if (currentStock < requiredQty) {
                insufficientStock.push(
                    `${item.ingredient.name}: necesitas ${requiredQty.toFixed(2)} ${item.unit}, tienes ${currentStock.toFixed(2)}`
                );
            }
        }

        if (insufficientStock.length > 0) {
            return NextResponse.json(
                {
                    error: "Stock insuficiente",
                    details: insufficientStock
                },
                { status: 400 }
            );
        }

        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        const branchId = session?.user?.branchId;
        if (!tenantId || !branchId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Execute "Material Explosion" - deduct ingredients and create stock movements
        const stockUpdates = recipe.ingredients.map((item) => {
            const deductQty = Number(item.quantity) * multiplier;

            return prisma.$transaction([
                // Create stock movement
                prisma.stockMovement.create({
                    data: {
                        branchId: branchId,
                        ingredientId: item.ingredientId,
                        type: "OUT",
                        quantity: deductQty,
                        reason: `Producción: ${recipe.name} x${qty}`,
                    },
                }),
                // Update ingredient stock
                prisma.ingredient.update({
                    where: { id: item.ingredientId },
                    data: {
                        currentStock: {
                            decrement: deductQty,
                        },
                    },
                }),
            ]);
        });

        // Execute all stock updates
        await Promise.all(stockUpdates);

        // Create production batch record
        const batch = await prisma.productionBatch.create({
            data: {
                tenantId: tenantId,
                branchId: branchId,
                recipeId: recipeId,
                quantity: qty,
                status: "COMPLETED",
                notes: body.notes?.trim() || null,
            },
        });

        // Update or create product stock if product exists
        const product = await prisma.product.findFirst({
            where: { recipeId: recipeId },
        });

        if (product) {
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    currentStock: {
                        increment: qty,
                    },
                },
            });
        }

        return NextResponse.json({
            batch,
            materialsDeducted: recipe.ingredients.map((item) => ({
                ingredient: item.ingredient.name,
                quantity: Number(item.quantity) * multiplier,
                unit: item.unit,
            })),
            producedQuantity: qty,
        }, { status: 201 });
    } catch (error) {
        console.error("Error executing production:", error);
        return NextResponse.json(
            { error: "Error al ejecutar producción" },
            { status: 500 }
        );
    }
}
