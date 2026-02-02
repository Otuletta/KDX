"use client";

import { AppShell } from "@/components/app-shell";
import { Users, UserPlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function StaffPage() {
    return (

        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestión de Personal</h1>
                    <p className="text-muted-foreground">Administra tu equipo y permisos.</p>
                </div>
                <Button className="gap-2 bg-salsa hover:bg-salsa-dark text-white border-0 shadow-lg shadow-salsa/20">
                    <UserPlus className="h-4 w-4" />
                    Agregar Empleado
                </Button>
            </div>

            {/* Glass Card List */}
            <div className="glass-card p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            className="w-full bg-background border border-input rounded-lg py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-salsa/50 transition-colors"
                            placeholder="Buscar empleados..."
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarImage src={`/placeholder-user.jpg`} />
                                    <AvatarFallback className="bg-gradient-to-br from-salsa to-purple-600 text-white">EM</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-foreground font-medium">Nombre Empleado {i}</h3>
                                    <p className="text-xs text-muted-foreground">Personal Cocina • Tiempo Completo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-lime/10 text-lime border border-lime/20">
                                    Activo
                                </span>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-salsa hover:bg-muted/50">
                                    Editar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
