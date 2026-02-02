import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Get current register
        const register = await prisma.cashRegister.findUnique({
            where: { id },
        });

        if (!register) {
            return NextResponse.json(
                { error: "Caja no encontrada" },
                { status: 404 }
            );
        }

        if (register.closedAt) {
            return NextResponse.json(
                { error: "Esta caja ya está cerrada" },
                { status: 400 }
            );
        }

        // Validate actualCash
        const actualCash = parseFloat(body.actualCash);
        if (isNaN(actualCash) || actualCash < 0) {
            return NextResponse.json(
                { error: "El efectivo real debe ser un número mayor o igual a 0" },
                { status: 400 }
            );
        }

        // Calculate expected cash from sales
        const startOfDay = new Date(register.openedAt);
        const sales = await prisma.sale.findMany({
            where: {
                registerId: id,
                createdAt: { gte: startOfDay },
                status: "COMPLETED",
            },
        });

        const cashSales = sales
            .filter((s) => s.paymentMethod === "EFECTIVO")
            .reduce((sum, s) => sum + Number(s.total), 0);

        const expectedCash = Number(register.openingBalance) + cashSales;
        const difference = actualCash - expectedCash;

        // Close the register
        const closedRegister = await prisma.cashRegister.update({
            where: { id },
            data: {
                closingBalance: actualCash,
                expectedBalance: expectedCash,
                difference: difference,
                closedAt: new Date(),
                status: "CLOSED",
                notes: body.notes?.trim() || null,
            },
        });

        return NextResponse.json({
            register: closedRegister,
            summary: {
                openingBalance: Number(register.openingBalance),
                cashSales,
                expectedCash,
                actualCash,
                difference,
                totalSales: sales.length,
                totalRevenue: sales.reduce((sum, s) => sum + Number(s.total), 0),
            },
        });
    } catch (error) {
        console.error("Error closing cash register:", error);
        return NextResponse.json(
            { error: "Error al cerrar caja" },
            { status: 500 }
        );
    }
}
