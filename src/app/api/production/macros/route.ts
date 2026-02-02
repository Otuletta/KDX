import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const macros = await prisma.productionMacro.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json(macros);
    } catch (error) {
        console.error("Error fetching macros:", error);
        return NextResponse.json(
            { error: "Error al obtener macros" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const macro = await prisma.productionMacro.create({
            data: {
                name: body.name,
                recipeId: body.recipeId,
                quantity: body.quantity,
                icon: body.icon,
                color: body.color,
                sortOrder: body.sortOrder || 0,
            },
        });

        return NextResponse.json(macro, { status: 201 });
    } catch (error) {
        console.error("Error creating macro:", error);
        return NextResponse.json(
            { error: "Error al crear macro" },
            { status: 500 }
        );
    }
}
