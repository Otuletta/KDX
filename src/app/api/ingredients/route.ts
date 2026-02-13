import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIsDemo } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";
        const status = searchParams.get("status") || "";
        const isDemo = await getIsDemo();

        const ingredients = await prisma.ingredient.findMany({
            where: {
                isActive: true,
                isDemo: isDemo,
                ...(search && {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                }),
                ...(category && { category }),
            },
            include: {
                supplier: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        // Filter by stock status if requested
        const filteredIngredients = status
            ? ingredients.filter((ing) => {
                const current = Number(ing.currentStock);
                const min = Number(ing.minStock);
                if (status === "critical") return current <= 0;
                if (status === "low") return current > 0 && current <= min;
                if (status === "ok") return current > min;
                return true;
            })
            : ingredients;

        return NextResponse.json(filteredIngredients);
    } catch (error) {
        console.error("Error fetching ingredients:", error);
        return NextResponse.json(
            { error: "Error al obtener ingredientes" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        if (await getIsDemo()) {
            return NextResponse.json(
                { error: "Modo Demo: Acceso de solo lectura" },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validation
        if (!body.name || body.name.trim() === '') {
            return NextResponse.json(
                { error: "El nombre del ingrediente es requerido" },
                { status: 400 }
            );
        }

        if (!body.unit || body.unit.trim() === '') {
            return NextResponse.json(
                { error: "La unidad de medida es requerida" },
                { status: 400 }
            );
        }

        const currentStock = parseFloat(body.currentStock || 0);
        if (isNaN(currentStock) || currentStock < 0) {
            return NextResponse.json(
                { error: "El stock actual debe ser un número mayor o igual a 0" },
                { status: 400 }
            );
        }

        const minStock = parseFloat(body.minStock || 0);
        if (isNaN(minStock) || minStock < 0) {
            return NextResponse.json(
                { error: "El stock mínimo debe ser un número mayor o igual a 0" },
                { status: 400 }
            );
        }

        const avgCost = parseFloat(body.avgCost || 0);
        if (isNaN(avgCost) || avgCost < 0) {
            return NextResponse.json(
                { error: "El costo promedio debe ser un número mayor o igual a 0" },
                { status: 400 }
            );
        }

        const ingredient = await prisma.ingredient.create({
            data: {
                name: body.name.trim(),
                unit: body.unit.trim(),
                currentStock: currentStock,
                minStock: minStock,
                avgCost: avgCost,
                category: body.category?.trim() || null,
                supplierId: body.supplierId || null,
            },
        });

        return NextResponse.json(ingredient, { status: 201 });
    } catch (error) {
        console.error("Error creating ingredient:", error);
        return NextResponse.json(
            { error: "Error al crear ingrediente" },
            { status: 500 }
        );
    }
}
