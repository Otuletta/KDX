import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIsDemo } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const registerId = searchParams.get("registerId");
        const today = searchParams.get("today") === "true";
        const isDemo = await getIsDemo();

        const where: Record<string, unknown> = {
            isDemo: isDemo
        };

        if (registerId) {
            where.registerId = registerId;
        }

        if (today) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            where.createdAt = { gte: startOfDay };
        }

        const sales = await prisma.sale.findMany({
            where,
            take: limit,
            orderBy: { createdAt: "desc" },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json(sales);
    } catch (error) {
        console.error("Error fetching sales:", error);
        return NextResponse.json(
            { error: "Error al obtener ventas" },
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
        if (!Array.isArray(body.items) || body.items.length === 0) {
            return NextResponse.json(
                { error: "La venta debe tener al menos un producto" },
                { status: 400 }
            );
        }

        // Validate each item
        for (const item of body.items) {
            if (!item.productId) {
                return NextResponse.json(
                    { error: "Todos los productos deben tener un ID válido" },
                    { status: 400 }
                );
            }
            const quantity = parseFloat(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                return NextResponse.json(
                    { error: "Las cantidades deben ser números mayores a 0" },
                    { status: 400 }
                );
            }
            const unitPrice = parseFloat(item.unitPrice);
            if (isNaN(unitPrice) || unitPrice < 0) {
                return NextResponse.json(
                    { error: "Los precios deben ser números válidos mayores o iguales a 0" },
                    { status: 400 }
                );
            }
        }

        // Check stock availability for all products
        for (const item of body.items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { currentStock: true, name: true },
            });

            if (!product) {
                return NextResponse.json(
                    { error: `Producto no encontrado` },
                    { status: 404 }
                );
            }

            const currentStock = Number(product.currentStock);
            const requestedQty = parseFloat(item.quantity);

            if (currentStock < requestedQty) {
                return NextResponse.json(
                    { error: `Stock insuficiente para ${product.name}. Disponible: ${currentStock}, Solicitado: ${requestedQty}` },
                    { status: 400 }
                );
            }
        }

        // Calculate total
        let subtotal = 0;
        for (const item of body.items) {
            subtotal += parseFloat(item.quantity) * parseFloat(item.unitPrice);
        }
        const discount = parseFloat(body.discount) || 0;
        const total = subtotal - discount;

        // Use transaction to ensure data consistency
        const sale = await prisma.$transaction(async (tx) => {
            // Create sale with items
            const newSale = await tx.sale.create({
                data: {
                    subtotal,
                    discount,
                    total,
                    paymentMethod: body.paymentMethod || "EFECTIVO",
                    customerName: body.customerName?.trim() || null,
                    registerId: body.cashRegisterId || null,
                    items: {
                        create: body.items.map(
                            (item: {
                                productId: string;
                                quantity: number;
                                unitPrice: number;
                            }) => ({
                                product: { connect: { id: item.productId } },
                                quantity: parseFloat(item.quantity.toString()),
                                unitPrice: parseFloat(item.unitPrice.toString()),
                                subtotal: parseFloat(item.quantity.toString()) * parseFloat(item.unitPrice.toString()),
                            })
                        ),
                    },
                },
            });

            // Update product stock
            for (const item of body.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        currentStock: {
                            decrement: parseFloat(item.quantity),
                        },
                    },
                });
            }

            return newSale;
        });

        return NextResponse.json(sale, { status: 201 });
    } catch (error) {
        console.error("Error creating sale:", error);
        return NextResponse.json(
            { error: "Error al crear venta" },
            { status: 500 }
        );
    }
}
