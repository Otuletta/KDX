"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Building2, Store, Users, Package } from "lucide-react";

type GlobalTenant = {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    createdAt: string;
    _count: {
        users: number;
        branches: number;
        products: number;
    };
};

export default function SuperAdminTenantsPage() {
    const [tenants, setTenants] = useState<GlobalTenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTenants = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/super-admin/tenants");
            if (res.ok) {
                const data = await res.json();
                setTenants(data);
            }
        } catch (error) {
            console.error("Failed to fetch tenants", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestión de Tenants</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Control global de todas las empresas y cuentas registradas.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Tenant
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground animate-pulse">
                        Cargando tenants globales...
                    </div>
                ) : tenants.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                        No hay empresas registradas aún.
                    </div>
                ) : (
                    tenants.map((tenant) => (
                        <Card key={tenant.id} className="hover:border-slate-400 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center">
                                            <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                                            {tenant.name}
                                        </CardTitle>
                                        <CardDescription className="font-mono text-xs">
                                            {tenant.slug}
                                        </CardDescription>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-[10px] font-medium ${tenant.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {tenant.isActive ? "ACTIVO" : "INACTIVO"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                    <div className="bg-slate-50 p-2 rounded-md">
                                        <Users className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                                        <p className="text-xs font-semibold">{tenant._count.users}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-md">
                                        <Store className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                                        <p className="text-xs font-semibold">{tenant._count.branches}</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-md">
                                        <Package className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                                        <p className="text-xs font-semibold">{tenant._count.products}</p>
                                    </div>
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-4 text-center">
                                    Creado {format(new Date(tenant.createdAt), "d MMM, yyyy", { locale: es })}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
