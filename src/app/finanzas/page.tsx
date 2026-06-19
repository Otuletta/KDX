"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/calculations";
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Printer,
    Search,
    Calendar,
    Wallet,
    Download,
    Plus,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import { useSales, Sale } from "@/hooks/use-sales";
import { ReceiptPrinter, ReceiptData } from "@/components/finanzas/receipt-printer";
import { InvoicePrinter, InvoiceData } from "@/components/finanzas/invoice-printer";

// Tooltip Component
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
            <div className="rounded-xl border border-border bg-white p-3 shadow-lg text-sm">
                <p className="mb-1.5 font-medium text-muted-foreground text-xs">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="font-semibold text-sm" style={{ color: entry.name.includes("Ganancia") ? "#16A34A" : (entry.name.includes("Ventas") || entry.name.includes("Ingresos") ? "#E8453C" : "#DC2626") }}>
                        {entry.name}: {formatCurrency(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// Expense categories
const EXPENSE_CATEGORIES = [
    { value: "RENT", label: "Alquiler", color: "#6366F1" },
    { value: "PAYROLL", label: "Nómina", color: "#3B82F6" },
    { value: "UTILITIES", label: "Servicios", color: "#06B6D4" },
    { value: "SUPPLIES", label: "Suministros", color: "#10B981" },
    { value: "MARKETING", label: "Marketing", color: "#F59E0B" },
    { value: "OTHER", label: "Otros", color: "#94A3B8" },
];

interface Expense {
    id: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    recurring: boolean;
    notes?: string;
}

export default function FinanzasPage() {
    // Financial summary data
    const [salesData, setSalesData] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loadingResumen, setLoadingResumen] = useState(true);
    const [loadingExpenses, setLoadingExpenses] = useState(true);
    const [activeTab, setActiveTab] = useState("resumen");

    // Sales history
    const { data: allSales, isLoading: loadingSales } = useSales();
    const [searchQuery, setSearchQuery] = useState("");

    // Printing
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

    // Date filter
    const [days, setDays] = useState(14);

    // New expense form
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [newExpense, setNewExpense] = useState({ category: "OTHER", description: "", amount: "", recurring: false });

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const res = await fetch(`/api/reports/dashboard?days=${days}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.salesData?.length) setSalesData(data.salesData);
                }
            } catch (err) {
                console.error("Error cargando dashboard financiero:", err);
            } finally {
                setLoadingResumen(false);
            }
        }
        fetchDashboard();
    }, [days]);

    useEffect(() => {
        async function fetchExpenses() {
            try {
                const res = await fetch("/api/expenses");
                if (res.ok) {
                    const data = await res.json();
                    setExpenses(data);
                }
            } catch (err) {
                console.error("Error cargando gastos:", err);
            } finally {
                setLoadingExpenses(false);
            }
        }
        fetchExpenses();
    }, []);

    // KPIs
    const totalVentas = allSales?.reduce((sum, s) => sum + Number(s.total), 0) || 0;
    const totalCostos = salesData.reduce((sum, d) => sum + d.costos, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const gananciaBruta = totalVentas - totalCostos;
    const gananciaOperativa = gananciaBruta - totalExpenses;
    const margenBruto = totalVentas > 0 ? (gananciaBruta / totalVentas) * 100 : 0;

    // Payment method breakdown
    const paymentBreakdown = useMemo(() => {
        if (!allSales) return [];
        const map: Record<string, number> = {};
        allSales.forEach((s) => {
            map[s.paymentMethod] = (map[s.paymentMethod] || 0) + Number(s.total);
        });
        const colors: Record<string, string> = {
            EFECTIVO: "#10B981",
            TARJETA: "#3B82F6",
            TRANSFERENCIA: "#6366F1",
        };
        return Object.entries(map).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
            color: colors[name] || "#94A3B8",
        }));
    }, [allSales]);

    // Expense breakdown by category
    const expenseBreakdown = useMemo(() => {
        const map: Record<string, number> = {};
        expenses.forEach((e) => {
            map[e.category] = (map[e.category] || 0) + Number(e.amount);
        });
        return EXPENSE_CATEGORIES.map((cat) => ({
            name: cat.label,
            value: Math.round((map[cat.value] || 0) * 100) / 100,
            color: cat.color,
        })).filter((c) => c.value > 0);
    }, [expenses]);

    // Sales filtering
    const filteredSales = (allSales || []).filter(sale =>
        sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePrintReceipt = (sale: Sale) => {
        const data: ReceiptData = {
            saleId: sale.id,
            date: sale.createdAt,
            cashRegister: sale.cashRegisterId ? "Caja Principal" : "N/A",
            customerName: sale.customerName || "Consumidor Final",
            items: sale.items.map(i => ({
                quantity: i.quantity,
                name: i.product?.name || "Producto",
                unitPrice: i.unitPrice,
                subtotal: i.subtotal,
            })),
            subtotal: sale.subtotal,
            discount: sale.discount,
            total: sale.total,
            paymentMethod: sale.paymentMethod,
        };
        setReceiptData(data);
    };

    const handlePrintInvoice = (sale: Sale) => {
        const data: InvoiceData = {
            invoiceNumber: `INV-${sale.id.slice(-8).toUpperCase()}`,
            date: sale.createdAt,
            businessName: "KDX Core Restaurant",
            businessAddress: "Calle Principal #123, Santo Domingo",
            businessPhone: "(809) 555-0100",
            businessRNC: "000-000000-0",
            customerName: sale.customerName || "Consumidor Final",
            items: sale.items.map(i => ({
                quantity: i.quantity,
                description: i.product?.name || "Producto",
                unitPrice: i.unitPrice,
                subtotal: i.subtotal,
            })),
            subtotal: sale.subtotal,
            tax: 0,
            discount: sale.discount,
            total: sale.total,
            paymentMethod: sale.paymentMethod,
            notes: "Gracias por su preferencia",
        };
        setInvoiceData(data);
    };

    const handleAddExpense = async () => {
        if (!newExpense.description || !newExpense.amount) return;
        try {
            const res = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newExpense),
            });
            if (res.ok) {
                const created = await res.json();
                setExpenses((prev) => [created, ...prev]);
                setNewExpense({ category: "OTHER", description: "", amount: "", recurring: false });
                setShowExpenseForm(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // CSV Export
    const handleExportCSV = () => {
        const rows = [["Día", "Ventas", "Costos", "Ganancia"]];
        salesData.forEach((d) => {
            rows.push([d.day, d.ventas.toFixed(2), d.costos.toFixed(2), (d.ventas - d.costos).toFixed(2)]);
        });
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `finanzas_${days}d_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-8 max-w-[1400px] animate-fade-in relative z-10 antialiased p-6">
            {/* Hidden print components */}
            <ReceiptPrinter data={receiptData} onPrintComplete={() => setReceiptData(null)} />
            <InvoicePrinter data={invoiceData} onPrintComplete={() => setInvoiceData(null)} />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative z-10">
                {/* Header & Tabs Card */}
                <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400" />
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
                        <div>
                            <h1 className="text-[32px] font-black tracking-tight text-[#1e3a5f] uppercase mb-1">Gestión Financiera</h1>
                            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Control operativo y flujo de caja</p>
                            
                            <div className="flex items-center gap-4 mt-6">
                                <div className="flex bg-[#f4f6f8] p-1.5 rounded-2xl border border-slate-200">
                                    {[7, 14, 30, 60].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => { setDays(d); setLoadingResumen(true); }}
                                            className={cn(
                                                "h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                days === d ? "bg-white text-[#1e3a5f] shadow-sm border border-slate-200" : "text-slate-400 hover:text-[#1e3a5f]"
                                            )}
                                        >
                                            {d}D
                                        </button>
                                    ))}
                                </div>
                                <Button variant="outline" onClick={handleExportCSV} className="rounded-2xl h-12 px-6 border-slate-200 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest text-[#1e3a5f]">
                                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                                </Button>
                                <Button 
                                    onClick={() => setShowExpenseForm(!showExpenseForm)}
                                    className="rounded-2xl h-12 px-6 bg-[#f4f6f8] hover:bg-slate-100 text-[#1e3a5f] border-none font-black text-[10px] uppercase tracking-widest transition-all"
                                >
                                    <Plus className="mr-2 h-4 w-4 text-slate-400" /> Nuevo Gasto
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <TabsList className="flex bg-[#f4f6f8] p-1.5 rounded-3xl h-14 border border-slate-200 max-w-full overflow-x-auto no-scrollbar justify-start">
                            <TabsTrigger value="resumen" className="rounded-2xl px-6 h-full data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest transition-all text-slate-500 whitespace-nowrap border border-transparent data-[state=active]:border-slate-200">Resumen P&L</TabsTrigger>
                            <TabsTrigger value="gastos" className="rounded-2xl px-6 h-full data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest transition-all text-slate-500 whitespace-nowrap border border-transparent data-[state=active]:border-slate-200">Gastos Fijos</TabsTrigger>
                            <TabsTrigger value="flujo" className="rounded-2xl px-6 h-full data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest transition-all text-slate-500 whitespace-nowrap border border-transparent data-[state=active]:border-slate-200">Flujo de Caja</TabsTrigger>
                            <TabsTrigger value="historial" className="rounded-2xl px-6 h-full data-[state=active]:bg-white data-[state=active]:text-[#1e3a5f] data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-widest transition-all text-slate-500 whitespace-nowrap border border-transparent data-[state=active]:border-slate-200">Historial de Ventas</TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-3 bg-[#f4f6f8] px-5 h-14 rounded-3xl border border-slate-200 w-max shrink-0">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#1e3a5f]">Abril 2026</span>
                        </div>
                    </div>
                </div>

                {/* TAB: RESUMEN */}
                <TabsContent value="resumen" className="space-y-8 mt-0 animate-fade-in">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Ingresos Totales */}
                        <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[6px] bg-indigo-500 transition-transform group-hover:scale-105" />
                            <div className="flex items-center justify-between mt-2 mb-6">
                                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <DollarSign className="h-5 w-5 text-indigo-500" />
                                </div>
                                <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 transition-transform group-hover:scale-105")}>
                                    <ArrowUpRight className="h-3 w-3" /> +12%
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Ingresos Totales</p>
                                <p className="text-[32px] font-black text-[#1e3a5f] leading-none tracking-tighter">
                                    {formatCurrency(totalVentas)}
                                </p>
                            </div>
                        </div>

                        {/* COGS */}
                        <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[6px] bg-amber-500 transition-transform group-hover:scale-105" />
                            <div className="flex items-center justify-between mt-2 mb-6">
                                <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ShoppingCart className="h-5 w-5 text-amber-500" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">COGS (Costo Venta)</p>
                                <p className="text-[32px] font-black text-[#1e3a5f] leading-none tracking-tighter">
                                    {formatCurrency(totalCostos)}
                                </p>
                            </div>
                        </div>

                        {/* Ganancia Bruta */}
                        <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[6px] bg-emerald-500 transition-transform group-hover:scale-105" />
                            <div className="flex items-center justify-between mt-2 mb-6">
                                <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                                </div>
                                <span className={cn("inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 transition-transform group-hover:scale-105")}>
                                    Eficiencia 92%
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Ganancia Bruta</p>
                                <p className="text-[32px] font-black text-emerald-600 leading-none tracking-tighter">
                                    {formatCurrency(gananciaBruta)}
                                </p>
                            </div>
                        </div>

                        {/* Margen Operativo */}
                        <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[6px] bg-rose-500 transition-transform group-hover:scale-105" />
                            <div className="flex items-center justify-between mt-2 mb-6">
                                <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <BarChart3 className="h-5 w-5 text-rose-500" />
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Margen Operativo</p>
                                <p className="text-[32px] font-black text-[#1e3a5f] leading-none tracking-tighter">
                                    {margenBruto.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="surface-card p-8">
                            <h3 className="text-[13px] font-black uppercase tracking-widest text-muted-foreground mb-8">Tendencia de Ganancias</h3>
                            <div className="h-[300px]">
                                {loadingResumen ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Cargando datos...</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={salesData.map(d => ({ ...d, ganancia: d.ventas - d.costos }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                            <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} dx={-10} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line type="monotone" dataKey="ganancia" name="Ganancia" stroke="#10B981" strokeWidth={4} dot={false} activeDot={{ r: 6, stroke: '#FFF', strokeWidth: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                        <div className="surface-card p-8">
                            <h3 className="text-[13px] font-black uppercase tracking-widest text-muted-foreground mb-8">Ingresos vs Costos</h3>
                            <div className="h-[300px]">
                                {loadingResumen ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Cargando datos...</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={salesData} barGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                            <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} dx={-10} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="ventas" name="Ingresos" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                                            <Bar dataKey="costos" name="Costos" fill="#E11D48" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment breakdown */}
                    {paymentBreakdown.length > 0 && (
                        <div className="surface-card p-8">
                            <h3 className="text-[13px] font-black uppercase tracking-widest text-muted-foreground mb-8">Métodos de Pago</h3>
                            <div className="flex flex-col md:flex-row items-center gap-12">
                                <div className="w-[240px] h-[240px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={paymentBreakdown} innerRadius={60} outerRadius={100} cornerRadius={8} paddingAngle={5} dataKey="value" stroke="none">
                                                {paymentBreakdown.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                                    {paymentBreakdown.map((item) => (
                                        <div key={item.name} className="p-4 bg-white/50 rounded-2xl border border-border/40">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{item.name}</span>
                                            </div>
                                            <p className="text-xl font-black text-foreground">{formatCurrency(item.value)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* TAB: GASTOS */}
                <TabsContent value="gastos" className="space-y-8 mt-0 animate-fade-in">
                    {/* Add expense form */}
                    {showExpenseForm && (
                        <div className="surface-card p-8 space-y-6 animate-fade-in border-2 border-primary/20 bg-primary/5">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Categoría</label>
                                    <select
                                        value={newExpense.category}
                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                        className="w-full h-12 bg-white border border-border/60 rounded-xl px-4 text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        {EXPENSE_CATEGORIES.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Descripción</label>
                                    <Input
                                        placeholder="Concepto del gasto..."
                                        value={newExpense.description}
                                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                        className="h-12 bg-white border-border/60 rounded-xl font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Monto RD$</label>
                                    <Input
                                        placeholder="0.00"
                                        type="number"
                                        value={newExpense.amount}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        className="h-12 bg-white border-border/60 rounded-xl font-bold"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="recurring"
                                        checked={newExpense.recurring}
                                        onChange={(e) => setNewExpense({ ...newExpense, recurring: e.target.checked })}
                                        className="h-5 w-5 rounded border-border transition-all"
                                    />
                                    <label htmlFor="recurring" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gasto Recurrente</label>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={() => setShowExpenseForm(false)} className="rounded-xl px-6 h-12 font-bold uppercase tracking-widest">Cancelar</Button>
                                    <Button onClick={handleAddExpense} className="rounded-xl px-8 h-12 bg-primary text-white font-bold uppercase tracking-widest shadow-lg shadow-primary/20">Registrar Pago</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="surface-card p-8">
                            <h3 className="text-[13px] font-black uppercase tracking-widest text-muted-foreground mb-8">Por Categoría</h3>
                            {expenseBreakdown.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={expenseBreakdown} innerRadius={50} outerRadius={80} cornerRadius={6} paddingAngle={4} dataKey="value" stroke="none">
                                                    {expenseBreakdown.map((entry, i) => (
                                                        <Cell key={i} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3">
                                        {expenseBreakdown.map(item => (
                                            <div key={item.name} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="font-bold text-muted-foreground uppercase tracking-tight text-[11px]">{item.name}</span>
                                                </div>
                                                <span className="font-black text-foreground">{formatCurrency(item.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Wallet className="h-8 w-8 opacity-20" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest opacity-40">Sin gastos este mes</p>
                                </div>
                            )}
                        </div>

                        <div className="surface-card p-8 lg:col-span-2">
                            <h3 className="text-[13px] font-black uppercase tracking-widest text-muted-foreground mb-8">Historial de Gastos</h3>
                            <div className="overflow-hidden rounded-2xl border border-border/40">
                                <table className="w-full text-left">
                                    <thead className="bg-muted/50 border-b border-border/40">
                                        <tr>
                                            <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Fecha</th>
                                            <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Categoría</th>
                                            <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Concepto</th>
                                            <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {expenses.length > 0 ? (
                                            expenses.slice(0, 20).map(exp => (
                                                <tr key={exp.id} className="hover:bg-primary/[0.02] transition-colors">
                                                    <td className="p-4 text-[11px] font-bold text-muted-foreground uppercase">{new Date(exp.date).toLocaleDateString("es-DO")}</td>
                                                    <td className="p-4">
                                                        <span className="text-[10px] font-black px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-widest">
                                                            {EXPENSE_CATEGORIES.find(c => c.value === exp.category)?.label || exp.category}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-[12px] font-black text-foreground uppercase tracking-tight">{exp.description}</td>
                                                    <td className="p-4 text-right font-black text-red-600 text-[13px]">{formatCurrency(Number(exp.amount))}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="py-20 text-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground opacity-30">Caja cerrada / Sin movimientos</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB: FLUJO */}
                <TabsContent value="flujo" className="space-y-8 mt-0 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="stat-card">
                            <div className="flex items-center gap-3 mb-3">
                                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Entradas Totales</span>
                            </div>
                            <h2 className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(totalVentas)}</h2>
                        </div>
                        <div className="stat-card">
                            <div className="flex items-center gap-3 mb-3">
                                <ArrowDownLeft className="h-4 w-4 text-red-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Salidas Totales</span>
                            </div>
                            <h2 className="text-3xl font-black text-red-600 tracking-tighter">{formatCurrency(totalCostos + totalExpenses)}</h2>
                        </div>
                        <div className="stat-card highlight">
                            <div className="flex items-center gap-3 mb-3">
                                <Wallet className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Flujo Neto</span>
                            </div>
                            <h2 className={cn("text-3xl font-black tracking-tighter", gananciaOperativa >= 0 ? "text-emerald-600" : "text-red-600")}>
                                {formatCurrency(gananciaOperativa)}
                            </h2>
                        </div>
                    </div>

                    <div className="surface-card p-8">
                        <h3 className="text-[13px] font-black uppercase tracking-widest text-muted-foreground mb-8">Flujo de Caja Mensual</h3>
                        <div className="h-[340px]">
                            {loadingResumen ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">Analizando transacciones...</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesData.map(d => ({ ...d, flujo: d.ventas - d.costos }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                        <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} dx={-10} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="flujo" name="Saldo" fill="#0071E3" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB: HISTORIAL */}
                <TabsContent value="historial" className="space-y-8 mt-0 animate-fade-in">
                    <div className="surface-card p-8">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6 mb-10">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Registro de Transacciones</h2>
                                <p className="text-[11px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{filteredSales.length} Ventas Confirmadas</p>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="FILTRAR POR ORDEN O CLIENTE..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 h-12 bg-white border-border/60 text-foreground rounded-2xl text-[11px] font-black uppercase tracking-widest"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/40 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 border-b border-border/40">
                                    <tr>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">O-ID</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Fecha/Hora</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Cliente</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Pago</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Total</th>
                                        <th className="p-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">Ticket</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                    {loadingSales ? (
                                        <tr><td colSpan={6} className="py-20 text-center text-muted-foreground animate-pulse uppercase text-[11px] font-black tracking-widest">Sincronizando caja...</td></tr>
                                    ) : filteredSales.length > 0 ? (
                                        filteredSales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-primary/[0.02] transition-colors group">
                                                <td className="p-4 font-black text-[11px] text-muted-foreground">ID-{sale.id.slice(-6).toUpperCase()}</td>
                                                <td className="p-4 text-[11px] font-bold text-foreground">
                                                    {new Date(sale.createdAt).toLocaleDateString("es-DO")} <span className="text-muted-foreground ml-1 opacity-50">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </td>
                                                <td className="p-4 text-[12px] font-black text-muted-foreground uppercase line-clamp-1">{sale.customerName || "—"}</td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest border-none px-3 py-1",
                                                        sale.paymentMethod === 'EFECTIVO' ? 'bg-emerald-100 text-emerald-700' :
                                                        sale.paymentMethod === 'TARJETA' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-indigo-100 text-indigo-700'
                                                    )}>
                                                        {sale.paymentMethod}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 font-black text-foreground text-right text-[13px] tracking-tight">{formatCurrency(sale.total)}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handlePrintReceipt(sale)}
                                                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm text-muted-foreground hover:text-primary transition-all"
                                                            title="Copia Ticket"
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePrintInvoice(sale)}
                                                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white hover:shadow-sm text-muted-foreground hover:text-primary transition-all"
                                                            title="Factura Fiscal"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={6} className="py-20 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground opacity-30">No se encontraron registros financieros</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
