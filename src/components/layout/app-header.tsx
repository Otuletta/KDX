"use client";

import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
    isSuperAdminView?: boolean;
}

export function AppHeader({ isSuperAdminView }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-8 shadow-sm">
            <div className="flex items-center gap-4">
                {isSuperAdminView && (
                    <div className="hidden md:flex flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Entorno
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                            Administración Global
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-100 py-1.5 px-3 rounded-full">
                    <User className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Super Admin</span>
                </div>

                <form action={async () => {
                    const { logout } = await import("@/app/actions/auth");
                    await logout();
                }}>
                    <Button variant="ghost" size="sm" type="submit" className="text-slate-600 hover:text-red-600 hover:bg-red-50">
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir
                    </Button>
                </form>
            </div>
        </header>
    );
}
