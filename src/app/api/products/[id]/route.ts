import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                recipe: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Producto no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ...product,
            sellingPrice: product.price,
        });
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Error al obtener producto" },
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

        // Validation
        if (body.name !== undefined && (!body.name || body.name.trim() === '')) {
            return NextResponse.json(
                { error: "El nombre del producto no puede estar vacío" },
                { status: 400 }
            );
        }

        if (body.sellingPrice !== undefined) {
            const sellingPrice = parseFloat(body.sellingPrice);
            if (isNaN(sellingPrice) || sellingPrice < 0) {
                return NextResponse.json(
                    { error: "El precio debe ser un número válido mayor o igual a 0" },
                    { status: 400 }
                );
            }
        }

        if (body.currentStock !== undefined) {
            const currentStock = parseFloat(body.currentStock);
            if (isNaN(currentStock) || currentStock < 0) {
                return NextResponse.json(
                    { error: "El stock debe ser un número válido mayor o igual a 0" },
                    { status: 400 }
                );
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(body.name !== undefined && { name: body.name.trim() }),
                ...(body.description !== undefined && { description: body.description?.trim() || null }),
                ...(body.recipeId !== undefined && { recipeId: body.recipeId || null }),
                ...(body.sellingPrice !== undefined && { price: parseFloat(body.sellingPrice) }),
                ...(body.currentStock !== undefined && { currentStock: parseFloat(body.currentStock) }),
                ...(body.category !== undefined && { category: body.category || null }),
                ...(body.sku !== undefined && { sku: body.sku?.trim() || null }),
                ...(body.isActive !== undefined && { isActive: body.isActive }),
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Error al actualizar producto" },
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

        await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Error al eliminar producto" },
            { status: 500 }
        );
    }
}
