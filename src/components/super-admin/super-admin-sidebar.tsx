"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Users, ShieldAlert, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
    { name: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { name: "Tenants (Empresas)", href: "/super-admin/tenants", icon: Building2 },
    { name: "Usuarios Globales", href: "/super-admin/users", icon: Users },
];

export function SuperAdminSidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full flex-col bg-slate-900 text-white">
            <div className="flex h-16 items-center px-6 border-b border-slate-800">
                <ShieldAlert className="h-6 w-6 text-red-500 mr-3" />
                <span className="text-lg font-bold tracking-tight">Super Admin</span>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="rounded-lg bg-slate-800 p-4">
                    <p className="text-xs font-semibold text-red-400 mb-1">ZONA RESTRINGIDA</p>
                    <p className="text-[11px] text-slate-400 leading-tight">
                        Las acciones aquí afectan globalmente la plataforma.
                    </p>
                </div>
            </div>
        </div>
    );
}
