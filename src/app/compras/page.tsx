"use client";

import { useMemo, useState } from "react";
import { usePurchaseOrders, useUpdatePurchaseOrderStatus } from "@/hooks/use-purchase-orders";
import { useDemo } from "@/hooks/use-demo";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { 
    Loader2, 
    ShoppingCart, 
    Search, 
    ChevronDown, 
    Calendar, 
    Package, 
    XCircle,
    CheckCircle2,
    Truck,
    Clock,
    Plus,
    Filter,
    ArrowUpRight,
    TrendingUp,
    MoreHorizontal,
    FileText,
    Download,
    Ban,
    PackageSearch,
    Activity,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ComprasDialog } from "@/components/compras-dialog";

export default function ComprasPage() {
    const { isDemo } = useDemo();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const { data: orders, isLoading } = usePurchaseOrders();
    const updateStatusMutation = useUpdatePurchaseOrderStatus();

    const filteredOrders = useMemo(() => {
        if (!orders) return [];
        return orders.filter(order => {
            if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
            if (search && !order.id.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [orders, search, statusFilter]);

    const stats = useMemo(() => {
        if (!orders) return { draft: 0, sent: 0, received: 0, total: 0 };
        return {
            draft: orders.filter(o => o.status === "DRAFT").length,
            sent: orders.filter(o => o.status === "SENT").length,
            received: orders.filter(o => o.status === "RECEIVED").length,
            total: orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0)
        };
    }, [orders]);

    return (
        <div className="space-y-12 font-sans bg-[#f4f6f8] min-h-screen px-4 md:px-8 py-8 animate-enter">
            {/* Page Header Card */}
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400" />
                <div className="relative z-10">
                     <div className="flex items-center gap-2 text-indigo-500 font-bold text-[10px] tracking-widest uppercase mb-4 bg-indigo-50 w-fit px-3 py-1.5 rounded-full">
                          <ShoppingCart className="w-4 h-4 text-indigo-500" />
                          <span>Cadena de Suministro</span>
                     </div>
                    <h1 className="text-[32px] font-black tracking-tight text-[#1e3a5f] uppercase mb-2">Gestión de Abastecimiento</h1>
                    <p className="text-[13px] font-bold text-slate-400">Control maestro de compras, órdenes logísticas y flujo de suministros.</p>
                </div>
                <div className="relative z-10">
                    <Button className="bg-white text-[#1e3a5f] hover:bg-slate-50 border border-slate-200 shadow-sm rounded-full h-12 px-8 font-black text-xs uppercase tracking-widest transition-all hover:scale-105">
                        <Plus className="mr-2 h-4 w-4 text-indigo-500" /> Registrar Compra
                    </Button>
                </div>
            </div>

            {/* Big KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
                {/* Borradores */}
                <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-indigo-500 transition-transform group-hover:scale-105" />
                    <div className="flex items-center justify-between mt-2 mb-6">
                         <span className="text-[12px] font-black text-[#1e3a5f]">Borradores</span>
                         <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Clock className="w-5 h-5 text-indigo-500" />
                         </div>
                    </div>
                    <div>
                        <p className="text-[32px] font-black text-[#1e3a5f] leading-none mb-3">{stats.draft}</p>
                        <div className="flex items-center gap-2">
                            <div className="h-[3px] w-8 bg-indigo-500 rounded-full" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pendientes de envío</span>
                        </div>
                    </div>
                </div>

                {/* En Tránsito */}
                <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-violet-500 transition-transform group-hover:scale-105" />
                    <div className="flex items-center justify-between mt-2 mb-6">
                         <span className="text-[12px] font-black text-[#1e3a5f]">En Tránsito</span>
                         <div className="h-10 w-10 bg-violet-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Truck className="w-5 h-5 text-violet-500" />
                         </div>
                    </div>
                    <div>
                        <p className="text-[32px] font-black text-violet-500 leading-none mb-3">{stats.sent}</p>
                        <div className="flex items-center gap-2">
                            <div className="h-[3px] w-8 bg-violet-500 rounded-full" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Órdenes Activas</span>
                        </div>
                    </div>
                </div>

                {/* Recibidas */}
                <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-emerald-500 transition-transform group-hover:scale-105" />
                    <div className="flex items-center justify-between mt-2 mb-6">
                         <span className="text-[12px] font-black text-[#1e3a5f]">Recibidas</span>
                         <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                         </div>
                    </div>
                    <div>
                        <p className="text-[32px] font-black text-emerald-500 leading-none mb-3">{stats.received}</p>
                        <div className="flex items-center gap-2">
                            <div className="h-[3px] w-8 bg-emerald-500 rounded-full" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Productos ingresados</span>
                        </div>
                    </div>
                </div>

                {/* Inversión */}
                <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-amber-500 transition-transform group-hover:scale-105" />
                    <div className="flex items-center justify-between mt-2 mb-6">
                         <span className="text-[12px] font-black text-[#1e3a5f]">Inversión Total</span>
                         <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <TrendingUp className="w-5 h-5 text-amber-500" />
                         </div>
                    </div>
                    <div>
                        <p className="text-[28px] font-black text-amber-500 leading-none mb-3 tracking-tighter">{formatCurrency(stats.total)}</p>
                        <div className="flex items-center gap-2">
                            <div className="h-[3px] w-8 bg-amber-500 rounded-full" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capital comprometido</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4">
                <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 border border-slate-200/50 rounded-[20px] overflow-x-auto no-scrollbar">
                    {[
                        { value: "ALL", label: "Todas" },
                        { value: "DRAFT", label: "Borradores" },
                        { value: "SENT", label: "En Tránsito" },
                        { value: "RECEIVED", label: "Recibidas" },
                        { value: "CANCELLED", label: "Canceladas" },
                    ].map((status) => (
                        <button
                            key={status.value}
                            onClick={() => setStatusFilter(status.value)}
                            className={cn(
                                "h-10 px-6 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                statusFilter === status.value 
                                    ? "bg-white text-slate-900 border border-slate-200/50 shadow-md scale-105" 
                                    : "text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                        placeholder="Buscar por ID de orden..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 pl-12 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-indigo-400 focus:ring-0 transition-all font-medium text-sm placeholder:text-slate-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                    />
                </div>
            </div>

            {/* Orders List */}
            <div className="space-y-4 pb-32">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white border border-slate-100/50 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] animate-pulse">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] animate-pulse">Sincronizando Órdenes...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200/60 text-center animate-enter">
                        <div className="h-24 w-24 rounded-[40px] bg-white flex items-center justify-center shadow-2xl shadow-slate-200 mb-8">
                            <PackageSearch className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">Sin Registros</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto px-10 leading-relaxed">No se encontraron órdenes de compra que coincidan con los filtros actuales.</p>
                    </div>
                ) : (
                    filteredOrders.map((order, idx) => {
                        const totalItems = order.items.reduce((acc, i) => acc + Number(i.quantity), 0);
                        
                        let statusConfig = {
                            bg: "bg-slate-50",
                            text: "text-slate-600",
                            border: "border-slate-100",
                            label: "BORRADOR",
                            dot: false,
                            dotColor: "",
                        };
                        
                        if (order.status === "SENT") {
                            statusConfig = { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", label: "EN TRÁNSITO", dot: true, dotColor: "bg-violet-500" };
                        } else if (order.status === "RECEIVED") {
                            statusConfig = { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", label: "RECIBIDA", dot: false, dotColor: "" };
                        } else if (order.status === "CANCELLED") {
                            statusConfig = { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", label: "CANCELADA", dot: false, dotColor: "" };
                        }

                        return (
                            <div 
                                key={order.id} 
                                className={cn(
                                    "group surface-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-200 transition-all animate-enter",
                                    idx < 10 ? `animate-stagger-${(idx % 4) + 1}` : ""
                                )}
                            >
                                {/* Order ID & Date */}
                                <div className="flex items-center gap-4 md:w-[25%] min-w-0">
                                    <div className="h-11 w-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 group-hover:border-indigo-200 transition-all">
                                        <FileText className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm text-slate-900 tracking-tight uppercase">#{order.id.slice(-6).toUpperCase()}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{formatDate(order.createdAt)}</p>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="md:w-[20%]">
                                    <Badge variant="outline" className={cn(
                                        "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 w-fit border",
                                        statusConfig.bg,
                                        statusConfig.text,
                                        statusConfig.border
                                    )}>
                                        {statusConfig.dot && <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", statusConfig.dotColor)} />}
                                        {statusConfig.label}
                                    </Badge>
                                </div>

                                {/* Items count */}
                                <div className="md:w-[15%] flex items-center gap-2">
                                    <Package className="h-4 w-4 text-slate-300" />
                                    <span className="text-sm font-bold text-slate-900">{totalItems.toFixed(1)} <span className="text-[10px] font-bold text-slate-400 uppercase">unds</span></span>
                                </div>

                                {/* Amount */}
                                <div className="md:w-[20%] md:text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block leading-none">Inversión</span>
                                    <span className="font-bold text-lg text-slate-900 tracking-tighter text-technical">{formatCurrency(Number(order.totalAmount || 0))}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2 md:w-[10%]">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 rounded-md border border-transparent hover:bg-slate-100 transition-all" 
                                                disabled={isDemo || updateStatusMutation.isPending || order.status === "RECEIVED" || order.status === "CANCELLED"}
                                            >
                                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 shadow-2xl">
                                            <DropdownMenuLabel className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em] px-3 py-2">Operaciones</DropdownMenuLabel>
                                            {order.status === "DRAFT" && (
                                                <DropdownMenuItem 
                                                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: "SENT" })} 
                                                    className="rounded-xl cursor-pointer py-2.5 px-3 text-xs font-bold text-slate-600 focus:bg-slate-50 focus:text-slate-900 transition-colors"
                                                >
                                                    <Truck className="w-4 h-4 mr-2" /> Lanzar Orden
                                                </DropdownMenuItem>
                                            )}
                                            {order.status === "SENT" && (
                                                <DropdownMenuItem 
                                                    onClick={() => {
                                                        if (confirm("¿CONFIRMAR RECEPCIÓN? EL STOCK SE ACTUALIZARÁ AUTOMÁTICAMENTE.")) {
                                                            updateStatusMutation.mutate({ id: order.id, status: "RECEIVED" });
                                                        }
                                                    }} 
                                                    className="text-emerald-600 rounded-xl cursor-pointer py-2.5 px-3 text-xs font-bold focus:bg-emerald-50 focus:text-emerald-700 transition-colors"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Reportar Recepción
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator className="bg-slate-50 mx-1 my-1" />
                                            <DropdownMenuItem className="rounded-xl cursor-pointer py-2.5 px-3 text-xs font-bold text-slate-600 focus:bg-slate-50 focus:text-slate-900 transition-colors">
                                                <Download className="w-4 h-4 mr-2" /> Exportar PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => updateStatusMutation.mutate({ id: order.id, status: "CANCELLED" })}
                                                className="text-rose-600 rounded-xl cursor-pointer py-2.5 px-3 text-xs font-bold focus:bg-rose-50 focus:text-rose-700 transition-colors"
                                            >
                                                <Ban className="w-4 h-4 mr-2" /> Anular Orden
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
