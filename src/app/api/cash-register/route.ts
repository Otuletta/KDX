import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Get open cash register
        const openRegister = await prisma.cashRegister.findFirst({
            where: {
                tenantId,
                closedAt: null,
            },
            orderBy: { openedAt: "desc" },
        });

        // Get all registers for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const registers = await prisma.cashRegister.findMany({
            where: {
                tenantId,
                openedAt: { gte: startOfDay },
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

        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        const branchId = session?.user?.branchId;
        if (!tenantId || !branchId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const register = await prisma.cashRegister.create({
            data: {
                tenantId: tenantId,
                branchId: branchId,
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
