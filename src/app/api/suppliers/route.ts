import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIsDemo } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const isDemo = await getIsDemo();

        const suppliers = await prisma.supplier.findMany({
            where: {
                isActive: true,
                isDemo: isDemo,
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { email: { contains: search, mode: "insensitive" } },
                    ],
                }),
            },
            include: {
                _count: {
                    select: {
                        ingredients: true,
                    },
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(suppliers);
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        return NextResponse.json(
            { error: "Error al obtener proveedores" },
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
                { error: "El nombre del proveedor es requerido" },
                { status: 400 }
            );
        }

        // Validate email format if provided
        if (body.email && body.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(body.email)) {
                return NextResponse.json(
                    { error: "El formato del email no es válido" },
                    { status: 400 }
                );
            }
        }

        const supplier = await prisma.supplier.create({
            data: {
                name: body.name.trim(),
                phone: body.phone?.trim() || null,
                email: body.email?.trim() || null,
                address: body.address?.trim() || null,
                notes: body.notes?.trim() || null,
            },
        });

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        console.error("Error creating supplier:", error);
        return NextResponse.json(
            { error: "Error al crear proveedor" },
            { status: 500 }
        );
    }
}
