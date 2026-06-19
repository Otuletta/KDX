"use client";

import { useState, useMemo, useEffect } from "react";
import {
    useCreateRecipe,
    useUpdateRecipe,
    calculateSuggestedPrice,
    type Recipe,
} from "@/hooks/use-recipes";
import { useDemo } from "@/hooks/use-demo";
import { type Ingredient } from "@/hooks/use-ingredients";
import { formatCurrency } from "@/lib/calculations";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface RecipeIngredientForm {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    avgCost: number;
}

export function CreateRecipeDialog({
    ingredients,
    existingCategories,
}: {
    ingredients: Ingredient[] | undefined;
    existingCategories: string[];
}) {
    const { isDemo } = useDemo();
    const [open, setOpen] = useState(false);
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        yield: "1",
        yieldUnit: "unidad",
        targetMargin: 40,
        category: "",
        prepTime: "",
        instructions: "",
    });
    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientForm[]>([]);
    const [selectedIngredient, setSelectedIngredient] = useState("");
    const [ingredientQty, setIngredientQty] = useState("");

    const createMutation = useCreateRecipe();

    const totalCost = useMemo(() => {
        return recipeIngredients.reduce((sum, ing) => sum + ing.quantity * ing.avgCost, 0);
    }, [recipeIngredients]);

    const costPerUnit = parseFloat(formData.yield) > 0 ? totalCost / parseFloat(formData.yield) : totalCost;
    const suggestedPrice = calculateSuggestedPrice(costPerUnit, formData.targetMargin);
    const profit = suggestedPrice - costPerUnit;

    const handleAddIngredient = () => {
        if (!selectedIngredient || !ingredientQty) return;
        const ing = ingredients?.find((i) => i.id === selectedIngredient);
        if (!ing) return;
        if (recipeIngredients.some((ri) => ri.ingredientId === ing.id)) return;

        setRecipeIngredients([
            ...recipeIngredients,
            {
                ingredientId: ing.id,
                ingredientName: ing.name,
                quantity: parseFloat(ingredientQty),
                unit: ing.unit,
                avgCost: Number(ing.avgCost),
            },
        ]);

        setSelectedIngredient("");
        setIngredientQty("");
    };

    const handleRemoveIngredient = (ingredientId: string) => {
        setRecipeIngredients(recipeIngredients.filter((ri) => ri.ingredientId !== ingredientId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createMutation.mutateAsync({
            name: formData.name,
            description: formData.description || undefined,
            yield: parseFloat(formData.yield),
            yieldUnit: formData.yieldUnit,
            targetMargin: formData.targetMargin,
            category: formData.category || undefined,
            prepTime: formData.prepTime ? parseInt(formData.prepTime) : undefined,
            instructions: formData.instructions || undefined,
            ingredients: recipeIngredients.map((ri) => ({
                ingredientId: ri.ingredientId,
                quantity: ri.quantity,
                unit: ri.unit,
            })),
        });

        setOpen(false);
        setFormData({
            name: "", description: "", yield: "1", yieldUnit: "unidad",
            targetMargin: 40, category: "", prepTime: "", instructions: "",
        });
        setRecipeIngredients([]);
        setIsNewCategory(false);
    };

    const availableIngredients = ingredients?.filter(
        (ing) => !recipeIngredients.some((ri) => ri.ingredientId === ing.id)
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="aura-pill bg-white text-[#1e3a5f] hover:bg-slate-50 gap-2 h-10 px-6" disabled={isDemo}>
                    <Plus className="h-4 w-4" /> NUEVA RECETA
                </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px] bg-[#09090b] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)]">
                <DialogHeader className="p-10 pb-6 border-b border-white/[0.05]">
                    <DialogTitle className="text-4xl font-black tracking-tighter text-white uppercase italic">Crear Nueva Receta</DialogTitle>
                    <DialogDescription className="text-white/30 text-xs font-black uppercase tracking-[0.2em] mt-2">
                        Configuración de producción & cálculo de costos
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid gap-8 sm:grid-cols-2">
                        <div className="space-y-3 sm:col-span-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Nombre de la Receta</Label>
                            <Input
                                placeholder="Ej: Lasaña Familiar"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-indigo-500/40 rounded-2xl transition-all h-14 px-6 text-base font-bold placeholder:text-white/10"
                                required
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Descripción</Label>
                            <Textarea
                                placeholder="Breve descripción del plato..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Rendimiento</Label>
                            <div className="flex gap-3">
                                <Input type="number" min="0.1" step="0.1" value={formData.yield} onChange={(e) => setFormData({ ...formData, yield: e.target.value })} className="w-24 bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-4 font-mono font-bold" />
                                <Select value={formData.yieldUnit} onValueChange={(v: string) => setFormData({ ...formData, yieldUnit: v })}>
                                    <SelectTrigger className="flex-1 bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-4 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#09090b] border-white/10 text-white rounded-xl">
                                        <SelectItem value="unidad">unidades</SelectItem>
                                        <SelectItem value="porción">porciones</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lt">litros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Tiempo (Min)</Label>
                            <Input type="number" min="1" placeholder="30" value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} className="bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-6 font-mono font-bold" />
                        </div>
                        <div className="space-y-3 sm:col-span-2 relative">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Categoría *</Label>
                            {isNewCategory ? (
                                <div className="flex gap-2">
                                    <Input 
                                        value={formData.category} 
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })} 
                                        required 
                                        placeholder="Ej. PLATOS PRINCIPALES" 
                                        className="bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-indigo-500/40 rounded-2xl transition-all h-14 px-6 text-base font-bold placeholder:text-white/10 flex-1"
                                        autoComplete="off"
                                        autoFocus
                                    />
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => { setIsNewCategory(false); setFormData({ ...formData, category: "" }); }}
                                        className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </Button>
                                </div>
                            ) : (
                                <Select 
                                    value={formData.category} 
                                    onValueChange={(v: string) => {
                                        if (v === "NEW_CATEGORY") {
                                            setIsNewCategory(true);
                                            setFormData({ ...formData, category: "" });
                                        } else {
                                            setFormData({ ...formData, category: v });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-indigo-500/40 rounded-2xl transition-all h-14 px-6 text-base font-bold">
                                        <SelectValue placeholder="Seleccionar o crear..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#09090b] border border-white/10 text-white rounded-2xl shadow-2xl p-2 min-w-[200px]">
                                        {existingCategories.map(c => <SelectItem key={c} value={c} className="hover:bg-white/5 focus:bg-indigo-500 focus:text-white rounded-xl cursor-pointer py-3 px-4 font-bold text-sm mb-1 last:mb-0 transition-colors uppercase">{c}</SelectItem>)}
                                        {existingCategories.length > 0 && <SelectSeparator className="bg-white/10 my-2" />}
                                        <SelectItem value="NEW_CATEGORY" className="focus:bg-indigo-500/20 text-indigo-400 font-bold justify-center py-3 px-4 cursor-pointer rounded-xl transition-colors">+ Crear Nueva Categoría</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-[0.3em] text-white/40 ml-1">Ingredientes & Proporción</Label>
                        <div className="flex gap-3">
                            <Select value={selectedIngredient} onValueChange={(v: string) => setSelectedIngredient(v)}>
                                <SelectTrigger className="flex-1 bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-4 font-bold"><SelectValue placeholder="Seleccionar ingrediente" /></SelectTrigger>
                                <SelectContent className="bg-[#09090b] border-white/10 text-white rounded-xl">
                                    {availableIngredients?.map((ing) => (
                                        <SelectItem key={ing.id} value={ing.id} className="p-3 rounded-lg focus:bg-white/10 cursor-pointer">
                                            {ing.name} ({ing.unit}) - {formatCurrency(Number(ing.avgCost))}/{ing.unit}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input type="number" step="0.001" min="0.001" placeholder="Cant." value={ingredientQty} onChange={(e) => setIngredientQty(e.target.value)} className="w-28 bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-4 font-mono font-bold" />
                            <Button type="button" variant="secondary" onClick={handleAddIngredient} className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-white/10 border-white/5 transition-all"><Plus className="h-5 w-5" /></Button>
                        </div>
                        {recipeIngredients.length > 0 ? (
                            <div className="rounded-[2rem] border border-white/5 bg-white/[0.01] overflow-hidden">
                                <div className="divide-y divide-white/5">
                                    {recipeIngredients.map((ri) => (
                                        <div key={ri.ingredientId} className="flex items-center justify-between p-4 group hover:bg-white/[0.02] transition-colors">
                                            <div>
                                                <p className="font-black text-white italic text-sm">{ri.ingredientName.toUpperCase()}</p>
                                                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{ri.quantity} {ri.unit.toUpperCase()}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="font-mono text-sm font-bold text-white/40">{formatCurrency(ri.quantity * ri.avgCost)}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all text-white/10" onClick={() => handleRemoveIngredient(ri.ingredientId)}><X className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-white/5 bg-white/[0.03] p-5 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Costo Total Materiales</span>
                                    <span className="font-mono text-lg font-black text-white">{formatCurrency(totalCost)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-[2rem] border border-dashed border-white/5 p-12 text-center text-white/10 uppercase font-black tracking-[0.3em] text-[10px]">
                                Agrega ingredientes para calcular el coste base
                            </div>
                        )}
                    </div>

                    <div className="space-y-6 rounded-[2rem] bg-indigo-500/[0.03] border border-indigo-500/10 p-6">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 ml-1">Margen Operativo</Label>
                            <span className="font-mono text-3xl font-black text-indigo-400">{formData.targetMargin}%</span>
                        </div>
                        <Slider value={[formData.targetMargin]} onValueChange={(v) => setFormData({ ...formData, targetMargin: v[0] })} min={0} max={200} step={1} className="py-2" />
                        <div className="grid grid-cols-3 gap-4 pt-2">
                            <div className="rounded-2xl bg-white/[0.02] p-4 text-center border border-white/5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Costo/Ud</p>
                                <p className="font-mono font-bold text-white/60">{formatCurrency(costPerUnit)}</p>
                            </div>
                            <div className="rounded-2xl bg-white/[0.05] p-4 text-center border border-white/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">PVP Sugerido</p>
                                <p className="font-mono text-xl font-black text-white">{formatCurrency(suggestedPrice)}</p>
                            </div>
                            <div className="rounded-2xl bg-emerald-500/5 p-4 text-center border border-emerald-500/10">
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 mb-1">Margen/Ud</p>
                                <p className="font-mono font-bold text-emerald-400">+{formatCurrency(profit)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Instrucciones de Preparación</Label>
                        <Textarea placeholder="Describir pasos..." value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} rows={3} className="bg-white/[0.02] border-white/5 text-white rounded-2xl p-6 focus:border-indigo-500/40 transition-all placeholder:text-white/10" />
                    </div>

                    <DialogFooter className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-end w-full gap-5">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-white">Cancelar</Button>
                        <Button type="submit" disabled={createMutation.isPending || recipeIngredients.length === 0 || isDemo} className="bg-white text-black hover:bg-white/90 rounded-2xl h-14 px-10 font-black text-[11px] uppercase tracking-[0.2em] transition-all">
                            {createMutation.isPending && <Loader2 className="mr-3 h-4 w-4 animate-spin" />} Crear Receta
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function EditRecipeDialog({
    recipe,
    ingredients,
    open,
    onOpenChange,
    existingCategories,
}: {
    recipe: Recipe;
    ingredients: Ingredient[] | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingCategories: string[];
}) {
    const { isDemo } = useDemo();
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [formData, setFormData] = useState({
        name: recipe.name,
        description: recipe.description || "",
        yield: recipe.yield.toString(),
        yieldUnit: recipe.yieldUnit,
        targetMargin: Number(recipe.targetMargin),
        category: recipe.category || "",
        prepTime: recipe.prepTime?.toString() || "",
        instructions: recipe.instructions || "",
    });

    const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientForm[]>(
        recipe.ingredients.map((ri) => ({
            ingredientId: ri.ingredientId,
            ingredientName: ri.ingredient.name,
            quantity: Number(ri.quantity),
            unit: ri.unit,
            avgCost: Number(ri.ingredient.avgCost),
        }))
    );
    const [selectedIngredient, setSelectedIngredient] = useState("");
    const [ingredientQty, setIngredientQty] = useState("");

    const updateMutation = useUpdateRecipe();

    useEffect(() => {
        if (!open) return;
        const timeout = setTimeout(() => {
            setFormData({
                name: recipe.name, description: recipe.description || "", yield: recipe.yield.toString(), yieldUnit: recipe.yieldUnit,
                targetMargin: Number(recipe.targetMargin), category: recipe.category || "", prepTime: recipe.prepTime?.toString() || "", instructions: recipe.instructions || "",
            });
            setRecipeIngredients(recipe.ingredients.map((ri) => ({
                ingredientId: ri.ingredientId, ingredientName: ri.ingredient.name, quantity: Number(ri.quantity), unit: ri.unit, avgCost: Number(ri.ingredient.avgCost),
            })));
            setIsNewCategory(false);
        }, 0);
        return () => clearTimeout(timeout);
    }, [open, recipe]);

    const totalCost = useMemo(() => recipeIngredients.reduce((sum, ing) => sum + ing.quantity * ing.avgCost, 0), [recipeIngredients]);
    const costPerUnit = parseFloat(formData.yield) > 0 ? totalCost / parseFloat(formData.yield) : totalCost;
    const suggestedPrice = calculateSuggestedPrice(costPerUnit, formData.targetMargin);
    const profit = suggestedPrice - costPerUnit;

    const handleAddIngredient = () => {
        if (!selectedIngredient || !ingredientQty) return;
        const ing = ingredients?.find((i) => i.id === selectedIngredient);
        if (!ing || recipeIngredients.some((ri) => ri.ingredientId === ing.id)) return;
        setRecipeIngredients([...recipeIngredients, { ingredientId: ing.id, ingredientName: ing.name, quantity: parseFloat(ingredientQty), unit: ing.unit, avgCost: Number(ing.avgCost) }]);
        setSelectedIngredient(""); setIngredientQty("");
    };

    const handleRemoveIngredient = (ingredientId: string) => setRecipeIngredients(recipeIngredients.filter((ri) => ri.ingredientId !== ingredientId));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateMutation.mutateAsync({
            id: recipe.id,
            data: {
                name: formData.name, description: formData.description || undefined, yield: parseFloat(formData.yield), yieldUnit: formData.yieldUnit,
                targetMargin: formData.targetMargin, category: formData.category || undefined, prepTime: formData.prepTime ? parseInt(formData.prepTime) : undefined, instructions: formData.instructions || undefined,
                ingredients: recipeIngredients.map((ri) => ({ ingredientId: ri.ingredientId, quantity: ri.quantity, unit: ri.unit })),
            },
        });
        onOpenChange(false);
    };

    const availableIngredients = ingredients?.filter((ing) => !recipeIngredients.some((ri) => ri.ingredientId === ing.id));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px] bg-[#09090b] border-white/10 rounded-[2.5rem] p-0 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9)]">
                <DialogHeader className="p-10 pb-6 border-b border-white/[0.05]">
                    <DialogTitle className="text-4xl font-black tracking-tighter text-white uppercase italic">Editar Receta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="grid gap-8 sm:grid-cols-2">
                        <div className="space-y-3 sm:col-span-2">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Nombre de la Receta</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-indigo-500/40 rounded-2xl transition-all h-14 px-6 text-base font-bold" required />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Rendimiento</Label>
                            <div className="flex gap-3">
                                <Input type="number" min="0.1" step="0.1" value={formData.yield} onChange={(e) => setFormData({ ...formData, yield: e.target.value })} className="w-24 bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-4 font-mono font-bold" />
                                <Select value={formData.yieldUnit} onValueChange={(v) => setFormData({ ...formData, yieldUnit: v })}>
                                    <SelectTrigger className="flex-1 bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-4 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#09090b] border-white/10 text-white rounded-xl">
                                        <SelectItem value="unidad">unidades</SelectItem>
                                        <SelectItem value="porción">porciones</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lt">litros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Tiempo (Min)</Label>
                            <Input type="number" min="1" value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} className="bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-6 font-mono font-bold" />
                        </div>
                        <div className="space-y-3 sm:col-span-2 relative">
                            <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Categoría *</Label>
                            {isNewCategory ? (
                                <div className="flex gap-2">
                                    <Input 
                                        value={formData.category} 
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })} 
                                        required 
                                        placeholder="Ej. PLATOS PRINCIPALES" 
                                        className="bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-indigo-500/40 rounded-2xl transition-all h-14 px-6 text-base font-bold placeholder:text-white/10 flex-1"
                                        autoComplete="off"
                                        autoFocus
                                    />
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => { setIsNewCategory(false); setFormData({ ...formData, category: "" }); }}
                                        className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </Button>
                                </div>
                            ) : (
                                <Select 
                                    value={formData.category} 
                                    onValueChange={(v: string) => {
                                        if (v === "NEW_CATEGORY") {
                                            setIsNewCategory(true);
                                            setFormData({ ...formData, category: "" });
                                        } else {
                                            setFormData({ ...formData, category: v });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="bg-white/[0.02] border-white/5 text-white hover:bg-white/[0.05] focus:bg-white/[0.05] focus:border-indigo-500/40 rounded-2xl transition-all h-14 px-6 text-base font-bold">
                                        <SelectValue placeholder="Seleccionar o crear..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#09090b] border border-white/10 text-white rounded-2xl shadow-2xl p-2 min-w-[200px]">
                                        {existingCategories.map(c => <SelectItem key={c} value={c} className="hover:bg-white/5 focus:bg-indigo-500 focus:text-white rounded-xl cursor-pointer py-3 px-4 font-bold text-sm mb-1 last:mb-0 transition-colors uppercase">{c}</SelectItem>)}
                                        {existingCategories.length > 0 && <SelectSeparator className="bg-white/10 my-2" />}
                                        <SelectItem value="NEW_CATEGORY" className="focus:bg-indigo-500/20 text-indigo-400 font-bold justify-center py-3 px-4 cursor-pointer rounded-xl transition-colors">+ Crear Nueva Categoría</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-[0.3em] text-white/40 ml-1">Ingredientes & Proporción</Label>
                        <div className="flex gap-3">
                            <Select value={selectedIngredient} onValueChange={(v: string) => setSelectedIngredient(v)}><SelectTrigger className="flex-1 bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-4 font-bold"><SelectValue placeholder="Agregar ingrediente..." /></SelectTrigger><SelectContent className="bg-[#09090b] border-white/10 text-white rounded-xl">{availableIngredients?.map((ing) => (<SelectItem key={ing.id} value={ing.id} className="p-3 rounded-lg focus:bg-white/10 cursor-pointer">{ing.name} ({ing.unit})</SelectItem>))}</SelectContent></Select>
                            <Input type="number" step="0.001" min="0.001" placeholder="Cant" value={ingredientQty} onChange={(e) => setIngredientQty(e.target.value)} className="w-24 bg-white/[0.02] border-white/5 text-white rounded-2xl h-14 px-4 font-mono font-bold" />
                            <Button type="button" variant="secondary" onClick={handleAddIngredient} className="h-14 w-14 rounded-2xl bg-white/5 text-white hover:bg-white/10 border-white/5 transition-all"><Plus className="h-4 w-4" /></Button>
                        </div>
                        {recipeIngredients.length > 0 && (
                            <div className="rounded-[2rem] border border-white/5 bg-white/[0.01] overflow-hidden divide-y divide-white/5">
                                {recipeIngredients.map((ri) => (
                                    <div key={ri.ingredientId} className="flex items-center justify-between p-4 group hover:bg-white/[0.02] transition-colors">
                                        <div><p className="font-black text-white italic text-sm">{ri.ingredientName.toUpperCase()}</p><p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{ri.quantity} {ri.unit.toUpperCase()}</p></div>
                                        <div className="flex items-center gap-6"><span className="font-mono text-sm font-bold text-white/40">{formatCurrency(ri.quantity * ri.avgCost)}</span><Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all text-white/10" onClick={() => handleRemoveIngredient(ri.ingredientId)}><X className="h-4 w-4" /></Button></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-6 rounded-[2rem] bg-indigo-500/[0.03] border border-indigo-500/10 p-6">
                        <div className="flex items-center justify-between"><Label className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 ml-1">Margen Objetivo</Label><span className="font-mono text-3xl font-black text-indigo-400">{formData.targetMargin}%</span></div>
                        <Slider value={[formData.targetMargin]} onValueChange={(val) => setFormData({ ...formData, targetMargin: val[0] })} min={0} max={200} step={1} className="py-2" />
                        <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Costo Base: {formatCurrency(costPerUnit)}</span>
                            <span className="font-mono text-xl font-black text-white">Venta: {formatCurrency(suggestedPrice)}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Instrucciones</Label>
                        <Textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} rows={3} className="bg-white/[0.02] border-white/5 text-white rounded-2xl p-6 focus:border-indigo-500/40 transition-all placeholder:text-white/10" />
                    </div>
                    <DialogFooter className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-end w-full gap-5">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-14 px-8 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-white">Cancelar</Button>
                        <Button type="submit" disabled={updateMutation.isPending || isDemo} className="bg-white text-black hover:bg-white/90 rounded-2xl h-14 px-10 font-black text-[11px] uppercase tracking-[0.2em] transition-all">
                            {updateMutation.isPending && <Loader2 className="mr-3 h-4 w-4 animate-spin" />} Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
