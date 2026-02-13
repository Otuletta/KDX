"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useRecipes, type Recipe } from "@/hooks/use-recipes";
import { useDemo } from "@/hooks/use-demo";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ChefHat,
    Plus,
    Clock,
    Package,
    CheckCircle2,
    Loader2,
    History,
    Zap,
    Search,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProductionBatch {
    id: string;
    recipeId: string;
    quantity: number;
    status: string;
    notes: string | null;
    producedAt: string;
    recipe: {
        id: string;
        name: string;
    };
}

function useProductionBatches(limit = 10) {
    return useQuery<ProductionBatch[]>({
        queryKey: ["production-batches"],
        queryFn: async () => {
            const res = await fetch(`/api/production?limit=${limit}`);
            if (!res.ok) throw new Error("Error al cargar historial");
            return res.json();
        },
    });
}

function useExecuteProduction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            recipeId,
            quantity,
            notes,
        }: {
            recipeId: string;
            quantity: number;
            notes?: string;
        }) => {
            const res = await fetch("/api/production", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ recipeId, quantity, notes }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Error al ejecutar producción");
            }
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["production-batches"] });
            queryClient.invalidateQueries({ queryKey: ["ingredients"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success(
                `Producción registrada: ${data.producedQuantity} unidades`,
                {
                    description: `Inventario actualizado correctamente.`,
                }
            );
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export default function CocinaPage() {
    const { isDemo } = useDemo();
    const { data: recipes, isLoading: loadingRecipes } = useRecipes();
    const { data: batches, isLoading: loadingBatches } = useProductionBatches();
    const executeMutation = useExecuteProduction();

    const [search, setSearch] = useState("");
    const [produceDialog, setProduceDialog] = useState<{ recipe: Recipe; quantity: number } | null>(null);

    // Stats
    const todayBatches =
        batches?.filter((b) => {
            const today = new Date();
            const batchDate = new Date(b.producedAt);
            return batchDate.toDateString() === today.toDateString();
        }) || [];

    const totalProducedToday = todayBatches.reduce(
        (sum, b) => sum + Number(b.quantity),
        0
    );

    const filteredRecipes = recipes?.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const handleProduceClick = (recipe: Recipe) => {
        setProduceDialog({ recipe, quantity: Number(recipe.yield) || 1 });
    };

    const confirmProduction = () => {
        if (!produceDialog) return;
        executeMutation.mutate({
            recipeId: produceDialog.recipe.id,
            quantity: produceDialog.quantity
        });
        setProduceDialog(null);
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Modo Cocina</h1>
                    <p className="text-muted-foreground">
                        Registro de producción y control de lotes
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <ChefHat className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Lotes Hoy</p>
                            <p className="text-2xl font-bold">{todayBatches.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Package className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Unidades Producidas</p>
                            <p className="text-2xl font-bold">{totalProducedToday}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/50">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <Zap className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Recetas Activas</p>
                            <p className="text-2xl font-bold">{recipes?.length || 0}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left: Production List */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-salsa" />
                            Producción Rápida
                        </h2>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar receta..."
                                className="pl-9 h-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border bg-card overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[300px]">Receta</TableHead>
                                    <TableHead>Rendimiento</TableHead>
                                    <TableHead>Tiempo</TableHead>
                                    <TableHead className="text-right">Acción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingRecipes ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRecipes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                            No se encontraron recetas.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecipes.map((recipe) => (
                                        <TableRow key={recipe.id}>
                                            <TableCell>
                                                <div className="font-medium">{recipe.name}</div>
                                                <div className="text-xs text-muted-foreground">{recipe.category}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {Number(recipe.yield)} {recipe.yieldUnit}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {recipe.prepTime ? `${recipe.prepTime} min` : "--"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => executeMutation.mutate({ recipeId: recipe.id, quantity: Number(recipe.yield) })}
                                                    disabled={executeMutation.isPending || isDemo}
                                                    className="mr-2"
                                                    variant="ghost"
                                                >
                                                    <Zap className="h-4 w-4 mr-1" />
                                                    Rápido
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleProduceClick(recipe)}
                                                    disabled={executeMutation.isPending || isDemo}
                                                >
                                                    Producir...
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Right: History */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <History className="h-5 w-5 text-muted-foreground" />
                        Historial Reciente
                    </h2>

                    <div className="rounded-md border bg-card/50">
                        {loadingBatches ? (
                            <div className="p-8 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                            </div>
                        ) : batches?.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                No hay registros hoy.
                            </div>
                        ) : (
                            <div className="divide-y">
                                {batches?.map((batch) => (
                                    <div key={batch.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                        <div>
                                            <p className="font-medium text-sm">{batch.recipe.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(batch.producedAt)}</p>
                                        </div>
                                        <Badge variant="outline" className="font-mono">
                                            +{Number(batch.quantity)}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Production Dialog */}
            <Dialog open={!!produceDialog} onOpenChange={(open) => !open && setProduceDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Producción</DialogTitle>
                        <DialogDescription>
                            {produceDialog?.recipe.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Cantidad a Producir</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={produceDialog?.quantity}
                                    onChange={(e) => setProduceDialog(prev => prev ? ({ ...prev, quantity: parseFloat(e.target.value) || 0 }) : null)}
                                    className="font-mono text-lg"
                                    min="0"
                                />
                                <span className="text-sm text-muted-foreground font-medium w-16">
                                    {produceDialog?.recipe.yieldUnit}
                                </span>
                            </div>
                        </div>
                        <div className="bg-blue-500/10 text-blue-400 p-3 rounded-md text-xs flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <p>
                                Se descontarán los ingredientes del inventario automáticamente basándose en la receta.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setProduceDialog(null)}>Cancelar</Button>
                        <Button onClick={confirmProduction} disabled={executeMutation.isPending || isDemo}>
                            {executeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Salida
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

    );
}
