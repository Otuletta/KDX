"use client";

import { UserPlus, Search, Users, Shield, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export default function StaffPage() {
    return (
        <div className="space-y-8 animate-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Personal</h1>
                    <p className="text-sm font-medium text-slate-400">Gestión de equipo, roles y accesos del sistema.</p>
                </div>
                <Button className="h-10 px-5 gap-2 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer transition-all">
                    <UserPlus className="w-4 h-4" /> Nuevo Empleado
                </Button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-xl border border-slate-200/60 p-5 relative overflow-hidden hover:border-indigo-200 transition-all animate-enter animate-stagger-1">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-violet-500" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black tracking-tighter text-slate-900 text-technical">4</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">Empleados Activos</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-5 relative overflow-hidden hover:border-emerald-200 transition-all animate-enter animate-stagger-2">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">En Turno</span>
                    </div>
                    <p className="text-2xl font-black tracking-tighter text-emerald-600 text-technical">4</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">Disponibles Hoy</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-5 relative overflow-hidden hover:border-violet-200 transition-all animate-enter animate-stagger-3">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-violet-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black tracking-tighter text-violet-600 text-technical">3</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">Departamentos</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/60 p-5 relative overflow-hidden hover:border-amber-200 transition-all animate-enter animate-stagger-4">
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-orange-500" />
                    <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-black tracking-tighter text-amber-600 text-technical">100%</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-1">Eficiencia</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                        placeholder="Buscar empleados..."
                        className="h-10 pl-10 rounded-xl border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* Staff List */}
            <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
                {[
                    { name: "María García", role: "Jefe de Cocina", dept: "Producción", initials: "MG" },
                    { name: "Carlos Reyes", role: "Cajero Principal", dept: "Ventas", initials: "CR" },
                    { name: "Ana Méndez", role: "Sous Chef", dept: "Producción", initials: "AM" },
                    { name: "Pedro Santos", role: "Administrador", dept: "Admin", initials: "PS" },
                ].map((employee, idx) => (
                    <div key={idx} className={cn(
                        "group flex items-center justify-between p-4 hover:bg-indigo-50/30 transition-all border-b border-slate-100 last:border-b-0",
                    )}>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 rounded-xl shrink-0">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[11px] font-bold uppercase rounded-xl">
                                    {employee.initials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">{employee.name}</h3>
                                <p className="text-[11px] font-medium text-slate-400">{employee.role} · {employee.dept}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Activo
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 rounded-xl border-slate-200 shadow-xl">
                                    <DropdownMenuItem className="rounded-lg cursor-pointer text-xs font-medium">
                                        <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600 rounded-lg cursor-pointer text-xs font-medium">
                                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
