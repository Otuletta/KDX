import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getSession();
        const tenantId = session?.user?.tenantId;
        if (!tenantId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // 1. Weekly Trend (Last 7 Days)
        const weeklySales = await prisma.sale.findMany({
            where: {
                tenantId,
                createdAt: {
                    gte: sevenDaysAgo,
                },
                status: 'COMPLETED',
            },
            select: {
                createdAt: true,
                total: true,
            },
        });

        // Group by day name
        const daysMap = new Map();
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dayName = days[d.getDay()];
            if (!daysMap.has(dayName)) {
                daysMap.set(dayName, 0);
            }
        }

        let weeklyTotal = 0;
        weeklySales.forEach(sale => {
            const dayName = days[sale.createdAt.getDay()];
            const current = daysMap.get(dayName) || 0;
            daysMap.set(dayName, current + Number(sale.total));
            weeklyTotal += Number(sale.total);
        });

        const trendData = Array.from(daysMap.entries()).map(([name, val]) => ({
            name,
            val
        }));

        // 2. Best Sellers (Top Products) — filtered by tenant
        const topProducts = await prisma.saleItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc',
                },
            },
            take: 5,
            where: {
                sale: {
                    tenantId,
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                    status: 'COMPLETED',
                }
            }
        });

        // Fetch product names
        const colors = ['#6366F1', '#3B82F6', '#06B6D4', '#10B981', '#F59E0B'];
        const pieData = await Promise.all(topProducts.map(async (item, index) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true }
            });

            return {
                name: product?.name || 'Unknown',
                value: Number(item._sum.quantity),
                color: colors[index % colors.length]
            };
        }));

        return NextResponse.json({
            trend: trendData,
            bestSellers: pieData,
            weeklyTotal
        });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json(
            { error: "Error al obtener estadísticas" },
            { status: 500 }
        );
    }
}
