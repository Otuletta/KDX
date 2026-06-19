"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Store, Building2, MapPin, Users, ReceiptText } from "lucide-react";

type GlobalBranch = {
    id: string;
    name: string;
    address: string | null;
    isActive: boolean;
    createdAt: string;
    tenant: {
        name: string;
        slug: string;
    };
    _count: {
        users: number;
        sales: number;
    };
};

export default function SuperAdminBranchesPage() {
    const [branches, setBranches] = useState<GlobalBranch[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchBranches = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/super-admin/branches");
            if (res.ok) {
                const data = await res.json();
                setBranches(data);
            }
        } catch (error) {
            console.error("Failed to fetch branches", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestión de Sucursales</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Control global de todas las sedes físicas registradas.
                    </p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Sucursal
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground animate-pulse">
                        Cargando sucursales globales...
                    </div>
                ) : branches.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                        No hay sucursales registradas aún.
                    </div>
                ) : (
                    branches.map((branch) => (
                        <Card key={branch.id} className="hover:border-slate-400 transition-colors">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg flex items-center">
                                            <Store className="w-4 h-4 mr-2 text-slate-500" />
                                            {branch.name}
                                        </CardTitle>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <Building2 className="w-3 h-3 mr-1" />
                                            {branch.tenant.name}
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-[10px] font-medium ${branch.isActive
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {branch.isActive ? "ACTIVA" : "INACTIVA"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {branch.address && (
                                    <div className="flex items-start text-xs text-muted-foreground mt-2 mb-4 bg-slate-50 p-2 rounded">
                                        <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{branch.address}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 mt-4 text-center">
                                    <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                                        <Users className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                                        <p className="text-xs font-semibold">{branch._count.users}</p>
                                        <p className="text-[10px] text-muted-foreground">Staff</p>
                                    </div>
                                    <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                                        <ReceiptText className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                                        <p className="text-xs font-semibold">{branch._count.sales}</p>
                                        <p className="text-[10px] text-muted-foreground">Ventas</p>
                                    </div>
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-4 text-center">
                                    Apertura {format(new Date(branch.createdAt), "d MMM, yyyy", { locale: es })}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
