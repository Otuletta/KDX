import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                ingredients: {
                    select: {
                        id: true,
                        name: true,
                        unit: true,
                        currentStock: true,
                        avgCost: true,
                    },
                },
            },
        });

        if (!supplier) {
            return NextResponse.json(
                { error: "Proveedor no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error fetching supplier:", error);
        return NextResponse.json(
            { error: "Error al obtener proveedor" },
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

        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name: body.name,
                phone: body.phone,
                email: body.email,
                address: body.address,
                notes: body.notes,
            },
        });

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Error updating supplier:", error);
        return NextResponse.json(
            { error: "Error al actualizar proveedor" },
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

        await prisma.supplier.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting supplier:", error);
        return NextResponse.json(
            { error: "Error al eliminar proveedor" },
            { status: 500 }
        );
    }
}
