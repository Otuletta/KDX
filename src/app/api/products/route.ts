import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const inStock = searchParams.get("inStock") === "true";

        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                ...(search && {
                    name: { contains: search, mode: "insensitive" },
                }),
                ...(inStock && {
                    currentStock: { gt: 0 },
                }),
            },
            include: {
                recipe: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        const mappedProducts = products.map((p) => ({
            ...p,
            sellingPrice: p.price,
        }));

        return NextResponse.json(mappedProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Error al obtener productos" },
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
                { error: "El nombre del producto es requerido" },
                { status: 400 }
            );
        }

        const sellingPrice = parseFloat(body.sellingPrice);
        if (isNaN(sellingPrice) || sellingPrice < 0) {
            return NextResponse.json(
                { error: "El precio debe ser un número válido mayor o igual a 0" },
                { status: 400 }
            );
        }

        const currentStock = parseFloat(body.currentStock || 0);
        if (isNaN(currentStock) || currentStock < 0) {
            return NextResponse.json(
                { error: "El stock debe ser un número válido mayor o igual a 0" },
                { status: 400 }
            );
        }

        const product = await prisma.product.create({
            data: {
                name: body.name.trim(),
                description: body.description?.trim() || null,
                recipeId: body.recipeId || null,
                price: sellingPrice,
                currentStock: currentStock,
                category: body.category || null,
                sku: body.sku?.trim() || null,
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Error al crear producto" },
            { status: 500 }
        );
    }
}
