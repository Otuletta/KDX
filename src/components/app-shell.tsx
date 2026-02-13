"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Package,
    FlaskConical,
    ChefHat,
    Wallet,
    BarChart3,
    Settings,
    Menu,
    Users,
    FileText,
    LogOut,
    Search
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentSession } from "@/app/actions/auth";

// ... existing imports ...

const navigation = [
    { name: "Panel", href: "/", icon: BarChart3 },
    { name: "Caja", href: "/caja", icon: Wallet },
    { name: "Menú", href: "/productos", icon: FileText },
    { name: "Inventario", href: "/inventario", icon: Package },
    { name: "Cocina", href: "/cocina", icon: ChefHat },
    { name: "Laboratorio", href: "/laboratorio", icon: FlaskConical },
    { name: "Personal", href: "/staff", icon: Users },
    { name: "Configuración", href: "/settings", icon: Settings },
];

// ... imports ...

// ... navigation const ...

function NavItem({
    item,
    isActive,
    onClick,
}: {
    item: (typeof navigation)[0];
    isActive: boolean;
    onClick?: () => void;
}) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all duration-300",
                isActive
                    ? "gradient-fire text-white shadow-xl scale-105"
                    : "text-gray-700 hover:text-gray-900 hover:bg-orange-100/80 hover:scale-105"
            )}
        >
            <Icon className={cn(
                "h-6 w-6 transition-all duration-300",
                isActive ? "text-white drop-shadow-lg" : "text-fire group-hover:scale-110 group-hover:rotate-3"
            )} />
            <span className="font-bold tracking-wide">{item.name}</span>
            {isActive && (
                <>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white animate-pulse"></div>
                </>
            )}
        </Link>
    );
}

function UserProfile({ user }: { user: any }) {
    const initials = user?.name
        ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
        : "SM";

    return (
        <div className="mt-auto pt-6 border-t border-fire/20">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:bg-white/80 transition-all duration-300 group shadow-md">
                <Avatar className="h-11 w-11 border-2 border-fire shadow-lg group-hover:scale-110 transition-transform">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}`} />
                    <AvatarFallback className="gradient-fire text-white font-bold text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden flex-1">
                    <span className="truncate text-sm font-bold text-gray-900 max-w-[140px]">{user?.name || "Invitado"}</span>
                    <span className="truncate text-xs text-fire uppercase tracking-wider font-semibold">{user?.role || "Staff"}</span>
                </div>
            </div>
            {/* Logout Button */}
            <form action={async () => {
                const { logout } = await import("@/app/actions/auth");
                await logout();
            }}>
                <button type="submit" className="w-full mt-3 flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-fire hover:bg-orange-100/60 transition-all py-2.5 rounded-xl font-medium">
                    <LogOut className="h-3.5 w-3.5" /> Cerrar Sesión
                </button>
            </form>
        </div>
    );
}

function SidebarContent({ closeSidebar }: { closeSidebar?: () => void }) {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        getCurrentSession().then((session) => {
            if (session?.user) {
                setUser(session.user);
            }
        });
    }, []);

    const filteredNavigation = navigation.filter(item => {
        if (item.name === "Personal" || item.name === "Configuración") {
            return user?.role === "ADMIN";
        }
        return true;
    });

    return (
        <div className="flex h-full flex-col p-4">
            {/* Logo - EXTRA LARGE */}
            <div className="flex flex-col items-center gap-4 py-8 mb-8 animate-bounce-in">
                <div className="relative flex h-44 w-44 items-center justify-center">
                    <Image
                        src="/logo-transparent.png"
                        alt="Salsealo Logo"
                        width={180}
                        height={180}
                        className="h-full w-full object-contain drop-shadow-2xl"
                        priority
                    />
                </div>
                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-fire to-transparent opacity-80"></div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2 overflow-y-auto px-2">
                {filteredNavigation.map((item) => {
                    const pathname = usePathname();
                    const isActive = item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                        <NavItem
                            key={item.href}
                            item={item}
                            isActive={isActive}
                            onClick={closeSidebar}
                        />
                    );
                })}
            </nav>

            {/* User Profile */}
            <UserProfile user={user} />
        </div>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();

    useEffect(() => {
        getCurrentSession().then((session) => {
            if (session?.user) {
                setUser(session.user);
            }
        });
    }, []);

    // If on login page, don't render the shell layout
    if (pathname === "/login") {
        return <>{children}</>;
    }

    const isDemo = user?.role === 'DEMO';

    return (
        <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground relative">
            {/* Background Pattern - Subtle Food Theme */}
            <div className="fixed inset-0 z-0 pointer-events-none pattern-dots opacity-30"></div>

            {/* Demo Banner */}
            {isDemo && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-orange-600 text-white text-center py-1.5 px-4 text-xs font-bold shadow-lg flex items-center justify-center gap-2 animate-slide-down">
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Modo Demo</span>
                    <span>Estás viendo una versión de demostración. Los cambios no se guardarán.</span>
                </div>
            )}

            {/* Desktop Sidebar: Light Cream Theme */}
            <aside className={cn(
                "hidden w-[280px] shrink-0 p-4 lg:block z-20 animate-slide-in-left transition-all duration-300",
                isDemo ? "pt-12" : ""
            )}>
                <div className="h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-2xl relative border-2 border-fire/20">
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-fire/5 via-transparent to-salsa/5 pointer-events-none"></div>
                    <SidebarContent />
                </div>
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="w-[85%] max-w-[300px] p-0 border-r-0 bg-orange-50">
                    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 h-full relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-fire/5 via-transparent to-salsa/5 pointer-events-none"></div>
                        <SidebarContent closeSidebar={() => setMobileOpen(false)} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Main Content Area */}
            <div className={cn(
                "flex flex-1 flex-col overflow-hidden relative z-10 transition-all duration-300",
                isDemo ? "pt-8" : ""
            )}>

                {/* Header - Mobile Only since Search is gone */}
                <header className="flex h-20 items-center justify-between px-6 lg:hidden pt-4">
                    <div className="flex items-center gap-4 lg:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-white text-foreground shadow-sm border border-border"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Search Bar - Removed as per user request */}
                    <div className="hidden lg:flex w-full max-w-lg items-center gap-3 px-4 py-3">
                        {/* Placeholder for layout balance if needed, or simply empty */}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Placeholder for future actions */}
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20">
                    <div className="mx-auto max-w-7xl animate-fade-in space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
