"use client";

import { useState, useMemo } from "react";
import { useRecipes, type Recipe } from "@/hooks/use-recipes";
import { useDemo } from "@/hooks/use-demo";
import { formatDate } from "@/lib/calculations";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    ChefHat,
    Clock,
    Package,
    Loader2,
    History,
    Zap,
    AlertCircle,
    MoreHorizontal,
    Pencil,
    Trash2,
    Activity,
    TrendingUp,
    ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIngredients } from "@/hooks/use-ingredients";
import { CreateRecipeDialog, EditRecipeDialog } from "@/components/recipe-dialogs";
import { useDeleteRecipe } from "@/hooks/use-recipes";

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
                    description: `Inventario de producción actualizado.`,
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
    const { data: ingredients } = useIngredients();
    const executeMutation = useExecuteProduction();
    const deleteMutation = useDeleteRecipe();

    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [produceDialog, setProduceDialog] = useState<{ recipe: Recipe; quantity: number } | null>(null);
    const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);

    const filteredRecipes = recipes?.filter(r => {
        if (activeCategory !== "all" && r.category !== activeCategory) return false;
        return r.name.toLowerCase().includes(search.toLowerCase());
    }) || [];

    const dynamicCats = useMemo(() => {
        if (!recipes) return [];
        const cats = new Set<string>();
        recipes.forEach(r => { if (r.category) cats.add(r.category); });
        return Array.from(cats).sort();
    }, [recipes]);

    const confirmProduction = () => {
        if (!produceDialog) return;
        executeMutation.mutate({
            recipeId: produceDialog.recipe.id,
            quantity: produceDialog.quantity
        });
        setProduceDialog(null);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-enter pb-10">
            {/* 1. Page Header Card (Laboratorio Royal) */}
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-6 relative overflow-hidden mb-8">
                <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400" />
                
                <div className="relative z-10">
                     <h1 className="text-[32px] font-black tracking-tight text-[#1e3a5f] uppercase leading-none mb-3">Laboratorio Royal</h1>
                     <p className="text-[13px] font-bold text-slate-400 mb-5">
                          Exploración y Desarrollo de Ingeniería Gastronómica
                     </p>
                     <div className="flex gap-1 p-1 bg-slate-50 rounded-2xl border border-slate-100 w-fit">
                         <div className="flex items-center gap-2 px-4 py-2 border-r border-slate-200/50">
                              <TrendingUp className="h-4 w-4 text-emerald-500" />
                              <span className="text-[11px] font-black uppercase tracking-widest text-[#1e3a5f]">ROI 240%</span>
                         </div>
                         <div className="flex items-center gap-2 px-4 py-2">
                              <Activity className="h-4 w-4 text-indigo-500" />
                              <span className="text-[11px] font-black uppercase tracking-widest text-[#1e3a5f]">Mode: Smart Cost</span>
                         </div>
                     </div>
                </div>
                <div className="relative z-10">
                    <CreateRecipeDialog
                        ingredients={ingredients}
                        existingCategories={dynamicCats}
                        triggerLabel="Nueva Ingeniería"
                        triggerClassName="inline-flex items-center justify-center gap-2 bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white rounded-xl h-12 px-8 font-black uppercase text-[11px] tracking-widest shadow-[0_4px_14px_0_rgba(30,58,95,0.39)] hover:shadow-[0_6px_20px_rgba(30,58,95,0.23)] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                    />
                </div>
            </div>

            {/* 2. KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-2">
                {/* Proyectos */}
                <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-[#1e3a5f] transition-transform group-hover:scale-105" />
                    <div className="flex items-center justify-between mt-2 mb-6">
                         <span className="text-[12px] font-black text-[#1e3a5f] uppercase tracking-widest">Proyectos</span>
                         <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <ChefHat className="w-5 h-5 text-[#1e3a5f]" />
                         </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-4 mb-3">
                            <p className="text-[42px] font-black text-[#1e3a5f] leading-none">{recipes?.length || 0}</p>
                            <div className="flex items-center text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                <span className="font-black text-sm">41%</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-[3px] w-8 bg-[#1e3a5f] rounded-full" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EN INVESTIGACIÓN</span>
                        </div>
                    </div>
                </div>

                {/* Global */}
                <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-emerald-500 transition-transform group-hover:scale-105" />
                    <div className="flex items-center justify-between mt-2 mb-6">
                         <span className="text-[12px] font-black text-[#1e3a5f] uppercase tracking-widest">Global</span>
                         <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Package className="w-5 h-5 text-emerald-500" />
                         </div>
                    </div>
                    <div>
                        <p className="text-[42px] font-black text-emerald-500 leading-none mb-3">17</p>
                        <div className="flex items-center gap-2">
                            <div className="h-[3px] w-8 bg-emerald-500 rounded-full" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CANTIDAD TOTAL</span>
                        </div>
                    </div>
                </div>

                {/* Variación */}
                <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[6px] bg-amber-500 transition-transform group-hover:scale-105" />
                    <div className="flex items-center justify-between mt-2 mb-6">
                         <span className="text-[12px] font-black text-[#1e3a5f] uppercase tracking-widest">Variación</span>
                         <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                              <ArrowUpRight className="w-5 h-5 text-amber-500" />
                         </div>
                    </div>
                    <div>
                        <p className="text-[42px] font-black text-amber-500 leading-none mb-3">0.8%</p>
                        <div className="flex items-center gap-2">
                            <div className="h-[3px] w-8 bg-amber-500 rounded-full" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DESVIACIÓN ESTÁNDAR</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
                    <div className="flex-1 overflow-x-auto pb-2 scrollbar-none w-full border-r border-slate-100/50 pr-4">
                        <div className="flex items-center bg-[#f4f6f8] p-1 rounded-2xl w-max">
                            {["TODAS", "ENTRADAS", "PLATOS PRINCIPALES", "SALSAS", "POSTRES", "BEBIDAS", "SNACKS"].map((cat) => (
                                <button 
                                    key={cat}
                                    onClick={() => setActiveCategory(cat === "TODAS" ? "all" : cat.toLowerCase())}
                                    className={cn(
                                        "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                        (activeCategory === "all" && cat === "TODAS") || activeCategory === cat.toLowerCase()
                                            ? "bg-white text-[#1e3a5f] shadow-sm border border-slate-200"
                                            : "text-slate-500 hover:text-[#1e3a5f]"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#f4f6f8] rounded-2xl p-1 flex items-center border border-slate-200 w-full md:w-80 shadow-sm shrink-0">
                        <input
                            type="text"
                            placeholder="BUSCAR INGENIERÍA..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 h-10 px-4 bg-transparent outline-none text-[10px] font-black text-slate-600 placeholder:text-slate-400 tracking-widest uppercase"
                        />
                    </div>
                </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content: Recipes Grid */}
                <div className="lg:col-span-3 space-y-6">
                    {loadingRecipes ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-4 precision-panel animate-pulse">
                            <div className="h-16 w-16 rounded-[24px] bg-indigo-50 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-200" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] animate-pulse">Sincronizando KDS...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {filteredRecipes.map((recipe, idx) => (
                                <div key={recipe.id} className={cn("aura-card p-6 flex flex-col justify-between group", idx < 9 ? `animate-stagger-${(idx % 4) + 1}` : "")}>
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="bg-indigo-50 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                                    {recipe.category || "PROCESO"}
                                                </span>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="z-[80] w-56 rounded-2xl border border-slate-200 bg-white p-2 text-[#1e3a5f] shadow-[0_18px_50px_rgba(30,58,95,0.2)]">
                                                    <DropdownMenuItem onClick={() => setEditRecipe(recipe)} className="rounded-xl cursor-pointer py-3 text-[10px] font-black uppercase tracking-widest focus:bg-slate-50 focus:text-[#1e3a5f]"><Pencil className="w-4 h-4 mr-3" /> Editar Ficha</DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-slate-100" />
                                                    <DropdownMenuItem onClick={() => { if (confirm(`¿Eliminar receta?`)) deleteMutation.mutate(recipe.id); }} className="rounded-xl cursor-pointer py-3 text-[10px] font-black uppercase tracking-widest text-red-600 focus:bg-red-50 focus:text-red-600"><Trash2 className="w-4 h-4 mr-3" /> Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        
                                        <h3 className="text-[22px] font-black text-[#1e3a5f] tracking-tight leading-[1] uppercase py-2">{recipe.name}</h3>
                                        
                                        <div className="grid grid-cols-2 gap-4 py-3 border-t border-slate-200/60 border-b">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rendimiento</span>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-[15px] font-black text-slate-800">{recipe.yield}</span>
                                                    <span className="text-[10px] font-black text-slate-500 uppercase">{recipe.yieldUnit}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1 border-l border-slate-200/60 pl-4">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Preparación</span>
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span className="text-sm font-bold">{recipe.prepTime || "--"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-auto flex items-center justify-between gap-3 relative z-10 w-full">
                                        <button 
                                            className="aura-pill flex-1 border border-orange-200 text-orange-500 hover:bg-orange-50 justify-center gap-1 shadow-none bg-white text-[10px]"
                                            onClick={() => setProduceDialog({ recipe, quantity: 1 })}
                                        >
                                            <Zap className="w-3 h-3" /> LOTE 1X
                                        </button>
                                        <button 
                                            className="aura-pill flex-1 bg-[#ef4444] text-white hover:bg-red-600 shadow-[0_4px_12px_rgba(239,68,68,0.3)] justify-center text-[10px]"
                                            onClick={() => setProduceDialog({ recipe, quantity: Number(recipe.yield) || 1 })}
                                        >
                                            PRODUCCIÓN
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Production History - Vivid Design */}
                <div className="space-y-6 animate-enter-right">
                    <div className="aura-card p-6 min-h-[500px]">
                        <div className="flex items-center gap-2 mb-6">
                            <History className="w-4 h-4 text-[#ef4444]" />
                            <h3 className="text-[12px] font-black text-slate-600 uppercase tracking-widest">Historial de Producción</h3>
                        </div>
                        
                        {loadingBatches ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
                            </div>
                        ) : batches?.length === 0 ? (
                            <div className="py-20 text-center space-y-4">
                                <Activity className="w-8 h-8 text-slate-200 mx-auto" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-relaxed">Sin actividad</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {batches?.slice(0, 8).map((batch) => (
                                    <div key={batch.id} className="p-3 border border-slate-200 rounded-2xl bg-white flex items-center justify-between">
                                        <div className="overflow-hidden pr-2">
                                            <h4 className="text-[11px] font-black text-[#1e3a5f] uppercase truncate leading-tight">{batch.recipe?.name}</h4>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase pt-1">
                                                {formatDate(batch.producedAt)}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[12px] font-black text-[#14b8a6]">+{batch.quantity}</span>
                                            <span className="text-[8px] font-black text-[#14b8a6]/70 uppercase block">UD.</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Premium Production Dialog - Master Action */}
            <Dialog open={!!produceDialog} onOpenChange={(open) => !open && setProduceDialog(null)}>
                <DialogContent className="sm:max-w-[480px] p-10 gap-10 bg-white border-none rounded-[48px] shadow-2xl font-sans relative overflow-hidden">
                    <DialogHeader className="space-y-4">
                        <div className="h-16 w-16 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white shadow-2xl shadow-indigo-200 mx-auto animate-bounce-subtle">
                             <Zap className="h-8 w-8" />
                        </div>
                        <div className="text-center space-y-2">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">Validar Carga de Producción</DialogTitle>
                            <DialogDescription className="text-sm font-medium text-slate-500">
                                Iniciando lote de <span className="text-indigo-600 font-bold uppercase">{produceDialog?.recipe.name}</span>.<br/>Confirma las unidades finales para actualizar stock.
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="space-y-10">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center block opacity-60">Producción Planeada ({produceDialog?.recipe.yieldUnit})</Label>
                            <div className="relative group">
                                <Input
                                    type="number"
                                    value={produceDialog?.quantity}
                                    onChange={(e) => setProduceDialog(prev => prev ? ({ ...prev, quantity: parseFloat(e.target.value) || 0 }) : null)}
                                    className="h-24 text-6xl font-bold text-center border-none bg-slate-50/50 group-hover:bg-slate-50 transition-colors focus-visible:ring-0 text-slate-900 tabular-nums rounded-[32px]"
                                    min="0"
                                    autoFocus
                                />
                                <div className="absolute inset-0 rounded-[32px] border-2 border-indigo-500/0 group-focus-within:border-indigo-500/10 transition-all pointer-events-none" />
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border border-slate-100/60 rounded-[32px] flex items-start gap-4">
                            <div className="h-10 w-10 shrink-0 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                                <AlertCircle className="h-5 w-5" />
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                                Dedducción automática de <span className="text-slate-900">Explosión de Materiales</span> activa. El stock maestro se actualizará inmediatamente tras confirmar.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-4 flex-col sm:flex-row pt-4">
                        <Button variant="ghost" onClick={() => setProduceDialog(null)} className="h-14 px-8 font-bold text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 rounded-2xl transition-all">Abortar</Button>
                        <Button
                            onClick={confirmProduction}
                            disabled={executeMutation.isPending || isDemo}
                            className="h-14 flex-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-600 rounded-2xl group/confirm transition-all relative overflow-hidden"
                        >
                            <div className="absolute inset-0 shimmer opacity-20" />
                            {executeMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Activity className="mr-2 h-5 w-5 group-hover/confirm:rotate-12 transition-transform" />} Validar & Procesar
                        </Button>
                    </DialogFooter>
                    
                    {/* Visual Decor */}
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
                </DialogContent>
            </Dialog>

            {/* Edit recipe dialog is assumed to follow the new UI pattern as it is a complex component */}
            {editRecipe && (
                <EditRecipeDialog
                    recipe={editRecipe}
                    ingredients={ingredients || []}
                    open={!!editRecipe}
                    onOpenChange={(v) => !v && setEditRecipe(null)}
                    existingCategories={dynamicCats}
                />
            )}
        </div>
    );
}
