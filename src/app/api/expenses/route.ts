import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category") || "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: Record<string, unknown> = { tenantId };
        if (category) where.category = category;
        if (startDate || endDate) {
            const dateFilter: Record<string, Date> = {};
            if (startDate) dateFilter.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                dateFilter.lte = end;
            }
            where.date = dateFilter;
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: "desc" },
            take: 200,
        });

        return NextResponse.json(expenses);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json({ error: "Error al obtener gastos" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();

        if (!body.category || !body.description || !body.amount) {
            return NextResponse.json({ error: "Categoría, descripción y monto son requeridos" }, { status: 400 });
        }

        const amount = parseFloat(body.amount);
        if (isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: "El monto debe ser un número mayor a 0" }, { status: 400 });
        }

        const expense = await prisma.expense.create({
            data: {
                tenantId,
                category: body.category,
                description: body.description.trim(),
                amount,
                date: body.date ? new Date(body.date) : new Date(),
                recurring: body.recurring || false,
                notes: body.notes?.trim() || null,
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error("Error creating expense:", error);
        return NextResponse.json({ error: "Error al crear gasto" }, { status: 500 });
    }
}
