"use client";

import {
  Package,
  TrendingUp,
  DollarSign, ShoppingBag, ChefHat, MousePointer2
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { useRouter } from "next/navigation";
import { useSales } from "@/hooks/use-sales";
import { useProducts } from "@/hooks/use-products";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/calculations";
import { cn } from "@/lib/utils";

const PIE_COLORS = ["#1e3a5f", "#ef4444", "#14b8a6", "#f59e0b", "#a855f7"];

interface DashboardTrendPoint {
  name: string;
  val: number;
}

interface DashboardBestSeller {
  name: string;
  value: number;
}

interface DashboardStats {
  trend?: DashboardTrendPoint[];
  bestSellers?: DashboardBestSeller[];
  weeklyTotal?: number;
}

interface ColoredBestSeller extends DashboardBestSeller {
  color: string;
}

export default function HomePage() {
  const router = useRouter();
  const { data: sales } = useSales({ today: true });
  const { data: products } = useProducts();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r => r.json()).then(setStats).catch(console.error);
  }, []);

  const todayTotal = sales?.reduce((a, s) => a + Number(s.total), 0) || 0;
  const lowStock = products?.filter(p => p.currentStock <= 5).length || 0;
  const totalOrders = sales?.length || 0;
  const chartData = stats?.trend || [];
  const pieData: ColoredBestSeller[] = stats?.bestSellers?.map((item, i) => ({ ...item, color: PIE_COLORS[i % PIE_COLORS.length] })) || [];
  const weeklyTotal = stats?.weeklyTotal || 0;

  const yesterday = sales?.filter(s => {
    const d = new Date(s.createdAt); const y = new Date(); y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  });
  const yesterdayTotal = yesterday?.reduce((a, s) => a + Number(s.total), 0) || 0;
  const trend = yesterdayTotal > 0 ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100) : todayTotal > 0 ? 100 : 0;

  return (
    <div className="space-y-6 animate-enter">
      {/* Huge Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between items-start gap-4 mb-4">
        <div>
          <h1 className="aura-page-title text-[var(--primary)] -ml-1">PANEL</h1>
          <p className="aura-page-subtitle text-blue-400">Resumen de operaciones del día</p>
        </div>
        <div className="bg-white rounded-full px-5 py-2.5 shadow-sm text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-100">
          {new Date().toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="aura-stat-card border-t-4 border-t-[#14b8a6]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Hoy</span>
            <div className="h-8 w-8 rounded-xl bg-teal-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-teal-500" />
            </div>
          </div>
          <p className="aura-stat-card-value">{formatCurrency(todayTotal)}</p>
          <div className="flex items-center gap-2 mt-4">
            <span className={cn(
               "px-2 py-1 rounded-md text-[9px] font-black tracking-wider uppercase",
               trend >= 0 ? "bg-teal-50 text-teal-600" : "bg-rose-50 text-rose-600"
            )}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">VS. AYER</span>
          </div>
        </div>

        {/* Orders */}
        <div className="aura-stat-card border-t-4 border-t-[#1e3a5f]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedidos Hoy</span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <p className="aura-stat-card-value">{totalOrders}</p>
          <div className="mt-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transacciones Exitosas</span>
          </div>
        </div>

        {/* Weekly */}
        <div className="aura-stat-card border-t-4 border-t-[#ef4444]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas Semanal</span>
            <div className="h-8 w-8 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="aura-stat-card-value">{formatCurrency(weeklyTotal)}</p>
          <div className="mt-4">
             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Últimos 7 días</span>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="aura-stat-card border-t-4 border-t-[#f59e0b]">
           <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Crítico</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="aura-stat-card-value">{lowStock}</p>
          <div className="mt-4">
            {lowStock > 0 ? (
               <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-[9px] font-black tracking-wider uppercase inline-flex items-center gap-1">
                  ⚠ Atención Requerida
               </span>
            ) : (
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Nivel Óptimo</span>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area Chart */}
        <div className="aura-card p-6 lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Tendencia de Ventas</h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#cbd5e1" fontSize={9} tickLine={false} axisLine={false} dy={10} fontWeight={700} />
                <YAxis stroke="#cbd5e1" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} dx={-10} fontWeight={700} />
                <Tooltip 
                  contentStyle={{ background: '#1e3a5f', border: 'none', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '14px', fontWeight: '900', color: '#fff' }}
                  labelStyle={{ fontSize: '10px', fontWeight: '700', color: '#8ba3c7', textTransform: 'uppercase', marginBottom: '4px' }}
                  cursor={{ stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="val" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" 
                  activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="aura-card p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Top Productos</h3>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="relative mb-6">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} innerRadius={55} outerRadius={75} paddingAngle={6} dataKey="value" stroke="none" cornerRadius={10}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-3xl font-black text-[var(--foreground)]">{pieData.reduce((a, c) => a + c.value, 0)}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Vendidos</span>
              </div>
            </div>
            <div className="space-y-2">
              {pieData.slice(0, 4).map((item) => (
                <div key={item.name} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Title */}
      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest pt-4">Acciones Rápidas</h3>
      
      {/* Quick Actions Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Terminal POS", href: "/caja", icon: ShoppingBag },
          { label: "Catálogo", href: "/productos", icon: MousePointer2 },
          { label: "Inventario", href: "/inventario", icon: Package },
          { label: "Cocina", href: "/cocina", icon: ChefHat },
        ].map((a) => (
          <button 
            key={a.href} 
            onClick={() => router.push(a.href)}
            className="aura-card p-5 text-left hover:-translate-y-1 transition-transform cursor-pointer"
          >
            <div className="flex items-center justify-between">
                <div>
                     <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">{a.label}</h4>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <a.icon className="h-4 w-4" />
                </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
