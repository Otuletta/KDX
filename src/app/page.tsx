"use client";

import { AppShell } from "@/components/app-shell";
import Link from "next/link";
import {
  Package,
  Wallet,
  ArrowUpRight,
  Utensils,
  AlertTriangle,
  Plus,
  MoreHorizontal,
  Bell,
  ChefHat
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useSales } from "@/hooks/use-sales";
import { useProducts } from "@/hooks/use-products";
import { useState, useEffect } from "react";

// ... imports

// Palette for charts - Vibrant Salsa Theme
const CHART_COLORS = [
  '#E63946', // Salsa Red
  '#F77F00', // Fire Orange
  '#FCBF49', // Spicy Yellow
  '#06D6A0', // Fresh Green
  '#7209B7', // Purple
];

export default function HomePage() {
  const router = useRouter();
  const { data: sales, isLoading: loadingSales } = useSales({ today: true });
  const { data: products } = useProducts();
  const [stats, setStats] = useState<{
    trend: { name: string; val: number }[];
    bestSellers: { name: string; value: number; color: string }[];
    weeklyTotal: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  // Calculate totals
  const todayTotal = sales?.reduce((acc, sale) => acc + Number(sale.total), 0) || 0;
  const lowStockCount = products?.filter((p) => p.currentStock <= 5).length || 0;

  // Get recent sales for activity feed (sorted by newest first)
  const recentSales = sales
    ? [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3)
    : [];

  // Use real data or defaults for skeletons if loading
  const chartData = stats?.trend || [];
  // Override API colors with our custom palette
  const pieChartData = stats?.bestSellers?.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length]
  })) || [];
  const weeklyTotal = stats?.weeklyTotal || 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Top Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

        {/* Card 1: Sales - Fire Gradient 🔥 */}
        <div className="gradient-fire p-6 rounded-3xl shadow-xl relative overflow-hidden group hover:scale-105 transition-all duration-300 interactive-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white/80 font-semibold mb-2 text-sm tracking-wide">Ventas de Hoy</p>
                <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
                  {todayTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </h2>
                <p className="text-xs text-white/70 mt-2 font-medium">
                  vs. ayer
                </p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                <Wallet className="h-8 w-8 drop-shadow-lg" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-white font-bold text-sm bg-white/20 backdrop-blur-md w-fit px-3 py-1.5 rounded-xl">
              <ArrowUpRight className="h-4 w-4" />
              <span>+12.5%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Orders - Sunset Gradient 🌅 */}
        <div className="gradient-sunset p-6 rounded-3xl shadow-xl relative overflow-hidden group hover:scale-105 transition-all duration-300 interactive-card">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-white/80 font-semibold mb-2 text-sm tracking-wide">Pedidos Activos</p>
                <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">34</h2>
                <p className="text-xs text-white/70 mt-2 font-medium">En Preparación</p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                <Utensils className="h-8 w-8 drop-shadow-lg" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-white font-bold text-sm bg-white/20 backdrop-blur-md w-fit px-3 py-1.5 rounded-xl">
              <ArrowUpRight className="h-4 w-4" />
              <span>+4%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Alerts - Dark with Red Accents ⚠️ */}
        <div className="gradient-dark p-6 rounded-3xl shadow-xl relative overflow-hidden group hover:scale-105 transition-all duration-300 interactive-card border-2 border-spice/30">
          <div className="absolute top-0 right-0 w-40 h-40 bg-spice/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-cream/80 font-semibold mb-2 text-sm tracking-wide">Alertas de Stock</p>
                <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">{lowStockCount}</h2>
                <p className="text-xs text-cream/70 mt-2 font-medium">Reordenar</p>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-spice/20 backdrop-blur-sm flex items-center justify-center text-spice shadow-lg">
                <Package className="h-8 w-8 drop-shadow-lg" />
              </div>
            </div>
            {lowStockCount > 0 && (
              <div className="flex items-center gap-2 text-spice font-bold text-sm bg-spice/20 backdrop-blur-md w-fit px-3 py-1.5 rounded-xl animate-pulse">
                <AlertTriangle className="h-4 w-4" />
                <span>-2 Items críticos</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Middle Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4">

        {/* Main Chart - Enhanced Aesthetics */}
        <div className="glass-card p-6 lg:col-span-2 flex flex-col interactive-card">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Tendencia Semanal</h3>
              <p className="text-sm text-muted-foreground">Ingresos de los últimos 7 días</p>
            </div>
            <div className="gradient-fire px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-lg animate-pulse-glow">
              En vivo
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSalesMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#F77F00" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                    padding: '12px'
                  }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                  formatter={(value: number | undefined) => [`$${value || 0}`, 'Ventas']}
                  cursor={{ stroke: '#f97316', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#E63946"
                  strokeWidth={4}
                  fill="url(#colorSalesMain)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* Pie Chart - Enhanced Aesthetics */}
        <div className="glass-card p-6 flex flex-col interactive-card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-bold text-foreground">Más Vendidos</h3>
              <p className="text-sm text-muted-foreground">Productos estrella</p>
            </div>
          </div>

          <div className="flex-1 min-h-[250px] relative flex justify-center items-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  innerRadius={70}
                  outerRadius={95}
                  cornerRadius={8}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="none"
                      style={{ filter: `drop-shadow(0px 4px 6px ${entry.color}40)` }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.15)',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-2 mt-4">
            {pieChartData.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 p-2.5 rounded-xl transition-all hover:scale-105">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row Activity */}
      <div className="mt-4 glass-card p-6 interactive-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-foreground">Actividad Reciente</h3>

        </div>

        <div className="space-y-4">
          {recentSales.map((sale, i) => (
            <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-xl transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {sale.customerName ? sale.customerName.substring(0, 2).toUpperCase() : 'CL'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Orden #{sale.id.slice(-4)} por {sale.customerName || 'Cliente'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-salsa">
                  ${Number(sale.total).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          {recentSales.length === 0 && (
            <div className="text-center text-muted-foreground py-4">Sin ventas recientes hoy</div>
          )}
        </div>
      </div>


    </div>
  );
}
