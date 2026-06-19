import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const recipes = await prisma.recipe.findMany({
            where: {
                tenantId,
                isActive: true,
                ...(search && {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                }),
            },
            include: {
                ingredients: {
                    include: {
                        ingredient: {
                            select: {
                                id: true,
                                name: true,
                                unit: true,
                                avgCost: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        productionBatches: true,
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return NextResponse.json(recipes);
    } catch (error) {
        console.error("Error fetching recipes:", error);
        return NextResponse.json(
            { error: "Error al obtener recetas" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {

        const body = await request.json();

        // Validation
        if (!body.name || body.name.trim() === '') {
            return NextResponse.json(
                { error: "El nombre de la receta es requerido" },
                { status: 400 }
            );
        }

        const yieldValue = parseFloat(body.yield);
        if (isNaN(yieldValue) || yieldValue <= 0) {
            return NextResponse.json(
                { error: "El rendimiento debe ser un número mayor a 0" },
                { status: 400 }
            );
        }

        if (!body.yieldUnit || body.yieldUnit.trim() === '') {
            return NextResponse.json(
                { error: "La unidad de rendimiento es requerida" },
                { status: 400 }
            );
        }

        if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
            return NextResponse.json(
                { error: "La receta debe tener al menos un ingrediente" },
                { status: 400 }
            );
        }

        // Validate each ingredient
        for (const item of body.ingredients) {
            if (!item.ingredientId) {
                return NextResponse.json(
                    { error: "Todos los ingredientes deben tener un ID válido" },
                    { status: 400 }
                );
            }
            const quantity = parseFloat(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                return NextResponse.json(
                    { error: "Las cantidades de ingredientes deben ser números mayores a 0" },
                    { status: 400 }
                );
            }
        }

        // Calculate cost from ingredients
        let totalCost = 0;
        for (const item of body.ingredients) {
            const ingredient = await prisma.ingredient.findUnique({
                where: { id: item.ingredientId },
            });
            if (ingredient) {
                totalCost += Number(ingredient.avgCost) * parseFloat(item.quantity);
            }
        }

        // Calculate cost per unit (protected against division by zero)
        const costPerUnit = yieldValue > 0 ? totalCost / yieldValue : 0;

        // Calculate suggested price based on target markup
        const targetMargin = parseFloat(body.targetMargin) || 40;
        const suggestedPrice = costPerUnit * (1 + targetMargin / 100);

        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const recipe = await prisma.recipe.create({
            data: {
                tenantId: tenantId,
                name: body.name.trim(),
                description: body.description?.trim() || null,
                yield: yieldValue,
                yieldUnit: body.yieldUnit.trim(),
                targetMargin: targetMargin,
                calculatedCost: costPerUnit,
                suggestedPrice: suggestedPrice,
                category: body.category?.trim() || null,
                prepTime: body.prepTime ? parseInt(body.prepTime) : null,
                instructions: body.instructions?.trim() || null,
                ingredients: {
                    create: body.ingredients.map(
                        (item: { ingredientId: string; quantity: number; unit: string; notes?: string }) => ({
                            ingredientId: item.ingredientId,
                            quantity: parseFloat(item.quantity.toString()),
                            unit: item.unit || 'unidad',
                            notes: item.notes?.trim() || null,
                        })
                    ),
                },
            },
            include: {
                ingredients: {
                    include: {
                        ingredient: true,
                    },
                },
            },
        });

        return NextResponse.json(recipe, { status: 201 });
    } catch (error) {
        console.error("Error creating recipe:", error);
        return NextResponse.json(
            { error: "Error al crear receta" },
            { status: 500 }
        );
    }
}
