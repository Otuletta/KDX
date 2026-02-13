import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIsDemo } from "@/lib/auth";

export async function GET() {
    try {
        const isDemo = await getIsDemo();

        // Get open cash register
        const openRegister = await prisma.cashRegister.findFirst({
            where: {
                closedAt: null,
                isDemo: isDemo
            },
            orderBy: { openedAt: "desc" },
        });

        // Get all registers for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const registers = await prisma.cashRegister.findMany({
            where: {
                openedAt: { gte: startOfDay },
                isDemo: isDemo
            },
            orderBy: { openedAt: "desc" },
        });

        return NextResponse.json({
            current: openRegister,
            today: registers,
        });
    } catch (error) {
        console.error("Error fetching cash registers:", error);
        return NextResponse.json(
            { error: "Error al obtener cajas" },
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
        const openingBalance = parseFloat(body.openingBalance || 0);
        if (isNaN(openingBalance) || openingBalance < 0) {
            return NextResponse.json(
                { error: "El balance inicial debe ser un número mayor o igual a 0" },
                { status: 400 }
            );
        }

        // Check if there's already an open register
        const existingOpen = await prisma.cashRegister.findFirst({
            where: { closedAt: null },
        });

        if (existingOpen) {
            return NextResponse.json(
                { error: "Ya hay una caja abierta" },
                { status: 400 }
            );
        }

        const register = await prisma.cashRegister.create({
            data: {
                openingBalance: openingBalance,
            },
        });

        return NextResponse.json(register, { status: 201 });
    } catch (error) {
        console.error("Error opening cash register:", error);
        return NextResponse.json(
            { error: "Error al abrir caja" },
            { status: 500 }
        );
    }
}
