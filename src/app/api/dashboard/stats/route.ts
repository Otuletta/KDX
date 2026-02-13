import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getIsDemo } from "@/lib/auth";

export async function GET() {
    try {
        const isDemo = await getIsDemo();
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // 1. Weekly Trend (Last 7 Days)
        const weeklySales = await prisma.sale.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo,
                },
                status: 'COMPLETED',
                isDemo: isDemo
            },
            select: {
                createdAt: true,
                total: true,
            },
        });

        // Group by day name (Mon, Tue, etc.)
        const daysMap = new Map();
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        // Initialize last 7 days with 0
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

        // 2. Best Sellers (Top Products)
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
                    createdAt: {
                        gte: sevenDaysAgo, // Best sellers of the week? Or all time? Let's do all time or month. Let's do week for consistency with chart.
                    },
                    status: 'COMPLETED',
                    isDemo: isDemo
                }
            }
        });

        // Fetch product names
        const pieData = await Promise.all(topProducts.map(async (item, index) => {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: { name: true }
            });

            const colors = ['var(--salsa)', '#eab308', 'var(--lime)', 'var(--salsa-dark)', '#a3e635'];

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
