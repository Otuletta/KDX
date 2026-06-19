import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getSession();
        const tenantId = session?.user?.tenantId;

        if (!tenantId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const url = new URL(req.url);
        const days = parseInt(url.searchParams.get("days") || "7", 10);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Fetch sales within the period
        const sales = await prisma.sale.findMany({
            where: {
                tenantId,
                status: "COMPLETED",
                createdAt: {
                    gte: startDate,
                },
            },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                recipe: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Calculate salesData (daily group)
        const dailyData: Record<string, { ventas: number; costos: number }> = {};

        // Initialize daily data with 0s for the past `days`
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toLocaleDateString("es-DO", { weekday: 'short', day: 'numeric' });
            dailyData[dayStr] = { ventas: 0, costos: 0 };
        }

        // Calculate products aggregations
        const productsMap: Record<string, { name: string, sales: number, revenue: number, category: string }> = {};

        sales.forEach(sale => {
            const dayStr = new Date(sale.createdAt).toLocaleDateString("es-DO", { weekday: 'short', day: 'numeric' });

            let saleCost = 0;
            const saleRevenue = Number(sale.total);

            sale.items.forEach(item => {
                const qty = Number(item.quantity);
                const subTotal = Number(item.subtotal);

                // Approximate cost: if it has a recipe, use its calculated cost. If not, use product price * some margin, or just 0 if unknown.
                // In a perfect system, sale item would snapshot the exact cost at time of sale.
                let itemCost = 0;
                if (item.product.recipe) {
                    itemCost = Number(item.product.recipe.calculatedCost) * qty;
                } else {
                    itemCost = Number(item.product.price) * 0.4 * qty; // fallback approximation 40% cost
                }
                saleCost += itemCost;

                const catName = item.product.category || "Otros";

                if (!productsMap[item.productId]) {
                    productsMap[item.productId] = {
                        name: item.product.name,
                        sales: 0,
                        revenue: 0,
                        category: catName
                    };
                }
                productsMap[item.productId].sales += qty;
                productsMap[item.productId].revenue += subTotal;
            });

            if (dailyData[dayStr]) {
                dailyData[dayStr].ventas += saleRevenue;
                dailyData[dayStr].costos += saleCost;
            } else {
                dailyData[dayStr] = { ventas: saleRevenue, costos: saleCost };
            }
        });

        const salesData = Object.entries(dailyData).map(([day, data]) => ({
            day,
            ventas: data.ventas,
            costos: data.costos
        }));

        const productsArray = Object.values(productsMap);

        const topProducts = [...productsArray]
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        // Category breakdown
        const categoryMap: Record<string, number> = {};
        productsArray.forEach(p => {
            categoryMap[p.category] = (categoryMap[p.category] || 0) + p.revenue;
        });

        const totalRev = productsArray.reduce((acc, p) => acc + p.revenue, 0);

        const categoryDataColorMap: Record<string, string> = {
            "Proteínas": "var(--chart-1)",
            "Vegetales": "var(--chart-2)",
            "Lácteos": "var(--chart-3)",
            "Salsas": "var(--chart-4)",
            "Otros": "var(--chart-5)"
        };

        const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-1)"];
        let colorIndex = 0;

        const categoryData = Object.entries(categoryMap).map(([name, value]) => {
            const percentage = totalRev > 0 ? (value / totalRev) * 100 : 0;
            const color = categoryDataColorMap[name] || chartColors[colorIndex++ % chartColors.length];
            return {
                name,
                value: Math.round(percentage),
                revenue: value,
                color
            };
        }).sort((a, b) => b.value - a.value);

        return NextResponse.json({
            salesData,
            topProducts,
            categoryData
        });

    } catch (error) {
        console.error("Error generating dashboard report:", error);
        return NextResponse.json(
            { error: "Error interno al generar reporte" },
            { status: 500 }
        );
    }
}
