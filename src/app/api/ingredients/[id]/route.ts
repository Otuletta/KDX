import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const ingredient = await prisma.ingredient.findUnique({
            where: { id },
            include: {
                supplier: true,
                priceHistory: {
                    orderBy: { recordedAt: "desc" },
                    take: 10,
                },
                stockMovements: {
                    orderBy: { createdAt: "desc" },
                    take: 20,
                },
            },
        });

        if (!ingredient) {
            return NextResponse.json(
                { error: "Ingrediente no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(ingredient);
    } catch (error) {
        console.error("Error fetching ingredient:", error);
        return NextResponse.json(
            { error: "Error al obtener ingrediente" },
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
                { error: "El nombre del ingrediente no puede estar vacío" },
                { status: 400 }
            );
        }

        if (body.unit !== undefined && (!body.unit || body.unit.trim() === '')) {
            return NextResponse.json(
                { error: "La unidad de medida no puede estar vacía" },
                { status: 400 }
            );
        }

        if (body.currentStock !== undefined) {
            const currentStock = parseFloat(body.currentStock);
            if (isNaN(currentStock) || currentStock < 0) {
                return NextResponse.json(
                    { error: "El stock actual debe ser un número mayor o igual a 0" },
                    { status: 400 }
                );
            }
        }

        if (body.minStock !== undefined) {
            const minStock = parseFloat(body.minStock);
            if (isNaN(minStock) || minStock < 0) {
                return NextResponse.json(
                    { error: "El stock mínimo debe ser un número mayor o igual a 0" },
                    { status: 400 }
                );
            }
        }

        if (body.avgCost !== undefined) {
            const avgCost = parseFloat(body.avgCost);
            if (isNaN(avgCost) || avgCost < 0) {
                return NextResponse.json(
                    { error: "El costo promedio debe ser un número mayor o igual a 0" },
                    { status: 400 }
                );
            }
        }

        const ingredient = await prisma.ingredient.update({
            where: { id },
            data: {
                ...(body.name !== undefined && { name: body.name.trim() }),
                ...(body.unit !== undefined && { unit: body.unit.trim() }),
                ...(body.currentStock !== undefined && { currentStock: parseFloat(body.currentStock) }),
                ...(body.minStock !== undefined && { minStock: parseFloat(body.minStock) }),
                ...(body.avgCost !== undefined && { avgCost: parseFloat(body.avgCost) }),
                ...(body.category !== undefined && { category: body.category?.trim() || null }),
                ...(body.supplierId !== undefined && { supplierId: body.supplierId || null }),
            },
        });

        return NextResponse.json(ingredient);
    } catch (error) {
        console.error("Error updating ingredient:", error);
        return NextResponse.json(
            { error: "Error al actualizar ingrediente" },
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

        // Soft delete
        await prisma.ingredient.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting ingredient:", error);
        return NextResponse.json(
            { error: "Error al eliminar ingrediente" },
            { status: 500 }
        );
    }
}
