"use client";

import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/calculations";
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";

// Mock data for charts
const salesData = [
    { day: "Lun", ventas: 4200, costos: 1800 },
    { day: "Mar", ventas: 3800, costos: 1600 },
    { day: "Mié", ventas: 5100, costos: 2100 },
    { day: "Jue", ventas: 4600, costos: 1900 },
    { day: "Vie", ventas: 6200, costos: 2500 },
    { day: "Sáb", ventas: 7800, costos: 3100 },
    { day: "Dom", ventas: 5400, costos: 2200 },
];

const categoryData = [
    { name: "Lasañas", value: 35, color: "var(--chart-1)" },
    { name: "Empanadas", value: 28, color: "var(--chart-2)" },
    { name: "Salsas", value: 20, color: "var(--chart-3)" },
    { name: "Otros", value: 17, color: "var(--chart-4)" },
];

const topProducts = [
    { name: "Lasaña Familiar", sales: 45, revenue: 19125 },
    { name: "Empanadas (docena)", sales: 38, revenue: 12160 },
    { name: "Salsa Marinara 500ml", sales: 32, revenue: 4800 },
    { name: "Lasaña Individual", sales: 28, revenue: 7000 },
    { name: "Empanadas de Pollo (6)", sales: 24, revenue: 4320 },
];

const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: { value: number; name: string }[];
    label?: string;
}) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-3 shadow-lg">
                <p className="mb-1 font-medium">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                        {entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function ReportesPage() {
    // Calculate period stats
    const totalSales = salesData.reduce((sum, d) => sum + d.ventas, 0);
    const totalCosts = salesData.reduce((sum, d) => sum + d.costos, 0);
    const grossProfit = totalSales - totalCosts;
    const margin = (grossProfit / totalSales) * 100;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Reportes
                    </h1>
                    <p className="text-muted-foreground">
                        Análisis de rendimiento y métricas financieras
                    </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                    Últimos 7 días
                </Badge>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <DollarSign className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold font-mono">
                                {formatCurrency(totalSales)}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-green-500">
                                <ArrowUpRight className="h-3 w-3" />
                                +12% vs semana anterior
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
                            <ShoppingCart className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold font-mono">
                                {formatCurrency(totalCosts)}
                            </p>
                            <p className="text-xs text-muted-foreground">Costos Totales</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                            <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold font-mono">
                                {formatCurrency(grossProfit)}
                            </p>
                            <p className="text-xs text-muted-foreground">Ganancia Bruta</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                            <BarChart3 className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{margin.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Margen Bruto</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Sales vs Costs Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Ventas vs Costos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={salesData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        className="stroke-muted"
                                    />
                                    <XAxis
                                        dataKey="day"
                                        className="text-xs fill-muted-foreground"
                                    />
                                    <YAxis className="text-xs fill-muted-foreground" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="ventas"
                                        name="Ventas"
                                        fill="var(--primary)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="costos"
                                        name="Costos"
                                        fill="var(--muted-foreground)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Pie Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Ventas por Categoría</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center gap-4">
                            {categoryData.map((item) => (
                                <div key={item.name} className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {item.name} ({item.value}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Products */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Productos Más Vendidos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topProducts.map((product, index) => (
                            <div
                                key={product.name}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {product.sales} unidades vendidas
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-semibold">
                                        {formatCurrency(product.revenue)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Profit Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Tendencia de Ganancia</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={salesData.map((d) => ({
                                    ...d,
                                    ganancia: d.ventas - d.costos,
                                }))}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    className="stroke-muted"
                                />
                                <XAxis
                                    dataKey="day"
                                    className="text-xs fill-muted-foreground"
                                />
                                <YAxis className="text-xs fill-muted-foreground" />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="ganancia"
                                    name="Ganancia"
                                    stroke="var(--chart-2)"
                                    strokeWidth={3}
                                    dot={{ fill: "var(--chart-2)", strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
