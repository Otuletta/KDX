"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users, Building2, Store, Mail, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type GlobalUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    isSuperAdmin: boolean;
    createdAt: string;
    tenant: {
        name: string;
        slug: string;
    };
    branches: Array<{
        branch: {
            name: string;
        }
    }>;
};

export default function SuperAdminUsersPage() {
    const [users, setUsers] = useState<GlobalUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/super-admin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Control global de acceso y roles en todas las empresas.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Usuario Global
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground animate-pulse">
                        Cargando usuarios globales...
                    </div>
                ) : users.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                        No hay usuarios registrados aún.
                    </div>
                ) : (
                    users.map((user) => (
                        <Card key={user.id} className="hover:border-slate-400 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1 w-full pr-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2 truncate">
                                                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                                                <span className="truncate">{user.name}</span>
                                            </CardTitle>
                                            <span
                                                className={`px-2 py-1 rounded-full text-[10px] font-medium shrink-0 ml-2 ${user.isActive
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                    }`}
                                            >
                                                {user.isActive ? "ACTIVO" : "INACTIVO"}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-2">
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Mail className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                            <div className="flex items-center text-xs text-muted-foreground">
                                                <Building2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                                                <span className="truncate">{user.tenant.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge variant="outline" className="text-[10px] font-semibold tracking-wider">
                                        {user.role}
                                    </Badge>
                                    {user.isSuperAdmin && (
                                        <Badge className="bg-slate-900 border-none text-[10px] flex items-center gap-1 hover:bg-slate-800">
                                            <ShieldAlert className="w-3 h-3" />
                                            SUPER ADMIN
                                        </Badge>
                                    )}
                                </div>

                                <div className="bg-slate-50 p-2.5 rounded-md border border-slate-100 mb-4">
                                    <div className="flex items-center text-xs font-semibold text-slate-700 mb-2">
                                        <Store className="w-3.5 h-3.5 mr-1.5" />
                                        Sucursales Asignadas ({user.branches.length})
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {user.branches.length > 0 ? (
                                            user.branches.map((b, i) => (
                                                <span key={i} className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-600">
                                                    {b.branch.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-slate-400 italic">No asignadas</span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-[10px] text-muted-foreground text-center">
                                    Registrado {format(new Date(user.createdAt), "d MMM, yyyy", { locale: es })}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
