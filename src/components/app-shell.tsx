"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    ChefHat,
    FlaskConical,
    Menu,
    LogOut,
    Store,
    Truck,
    BarChart3,
    FileText,
    Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FlameLogo } from "@/components/ui/flame-logo";

const navGroups = [
    {
        title: "Operaciones",
        items: [
            { name: "Panel", href: "/", icon: LayoutDashboard },
            { name: "Terminal POS", href: "/caja", icon: ShoppingCart },
            { name: "Produccion", href: "/cocina", icon: ChefHat },
        ]
    },
    {
        title: "Gestion",
        items: [
            { name: "Catalogo", href: "/productos", icon: FileText },
            { name: "Inventario", href: "/inventario", icon: Package },
            { name: "Compras", href: "/compras", icon: Wallet },
            { name: "Proveedores", href: "/proveedores", icon: Truck },
            { name: "Recetas", href: "/laboratorio", icon: FlaskConical },
        ]
    },
    {
        title: "Analitica",
        items: [
            { name: "Finanzas", href: "/finanzas", icon: BarChart3 },
        ]
    }
];

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    if (pathname === "/login") return <>{children}</>;

    return (
        <div className="flex min-h-screen bg-[var(--background)] font-sans relative">
            
            {/* AURA CLASSIC FLOATING SIDEBAR */}
            <aside className="hidden md:flex aura-sidebar">
                {/* Top Logo / Red Pill */}
                <Link href="/" className={cn("aura-nav-item mt-2", pathname === "/" ? "aura-nav-item-red" : "")}>
                    <FlameLogo className="w-8 h-8" />
                </Link>

                {/* Separator */}
                <div className="w-8 h-px bg-white/10 my-1" />

                {/* Nav Items */}
                <TooltipProvider delayDuration={0}>
                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar w-full items-center">
                        {navGroups.flatMap(g => g.items).filter(i => i.href !== "/").map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            const Icon = item.icon;
                            
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        <Link 
                                            href={item.href}
                                            className={cn(
                                                "aura-nav-item",
                                                isActive ? "aura-nav-item-active" : ""
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="bg-[#1e293b] text-white border-none rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-xl ml-4">
                                        {item.name}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </TooltipProvider>

                {/* Bottom Actions */}
                <div className="flex flex-col gap-3 mt-auto mb-2 items-center w-full">
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <form action={async () => { const { logout } = await import("@/app/actions/auth"); await logout(); }} className="w-full flex justify-center">
                                    <button type="submit" className="aura-nav-item hover:text-red-400">
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </form>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-red-500 text-white border-none rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-xl ml-4">
                                Cerrar Sesion
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </aside>

            {/* Mobile Header (Simplified for Classic) */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-40">
                <Link href="/" className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#ef4444] flex items-center justify-center">
                        <Store className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-black text-[#1e3a5f] italic tracking-tighter uppercase">KDX</span>
                </Link>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsMobileMenuOpen(true)}>
                    <Menu className="w-5 h-5 text-slate-600" />
                </Button>
            </header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 w-full md:pl-[120px] pt-20 md:pt-6 pb-6 px-4 md:pr-6 overflow-x-hidden min-h-screen">
                <div className="max-w-[1600px] w-full mx-auto pb-24">
                    {children}
                </div>
            </main>

            {/* Mobile Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[60]">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                    <div className="absolute top-0 left-0 bottom-0 w-[280px] bg-white flex flex-col animate-in slide-in-from-left duration-300">
                        <div className="h-20 flex items-center px-6 border-b border-slate-100">
                             <div className="h-10 w-10 rounded-full bg-[#ef4444] flex items-center justify-center mr-3 shadow-lg shadow-red-500/30">
                                <Store className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-black italic text-[#1e3a5f] tracking-tighter">KDX</span>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                            {navGroups.flatMap(g => g.items).map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3.5 rounded-[16px] text-xs font-bold uppercase tracking-widest transition-colors",
                                            isActive 
                                                ? "bg-[#14b8a6] text-white shadow-md shadow-teal-500/20" 
                                                : "text-[#1e3a5f]/60 hover:text-[#1e3a5f] hover:bg-slate-50"
                                        )}
                                    >
                                        <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
}
