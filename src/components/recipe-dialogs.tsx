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
    triggerLabel = "NUEVA RECETA",
    triggerClassName = "aura-pill bg-white text-[#1e3a5f] hover:bg-slate-50 gap-2 h-10 px-6",
}: {
    ingredients: Ingredient[] | undefined;
    existingCategories: string[];
    triggerLabel?: string;
    triggerClassName?: string;
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
                <button className={triggerClassName} disabled={isDemo}>
                    <Plus className="h-4 w-4" /> {triggerLabel}
                </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[820px] bg-white border border-slate-200 rounded-[24px] p-0 shadow-[0_24px_80px_rgba(30,58,95,0.22)]">
                <DialogHeader className="p-8 pb-6 border-b border-slate-100 bg-slate-50/60">
                    <DialogTitle className="text-3xl font-black tracking-tight text-[#1e3a5f] uppercase">Crear Nueva Ingenieria</DialogTitle>
                    <DialogDescription className="text-slate-500 text-[12px] font-black uppercase tracking-widest mt-2">
                        Configuración de producción & cálculo de costos
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid gap-5 sm:grid-cols-2 rounded-2xl border border-slate-100 bg-white p-5">
                        <div className="space-y-3 sm:col-span-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre de la Receta</Label>
                            <Input
                                placeholder="Ej: Lasaña Familiar"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-slate-50 border-slate-200 text-[#1e3a5f] hover:bg-white focus:bg-white focus:border-[#1e3a5f]/40 rounded-xl transition-all h-12 px-4 text-base font-bold placeholder:text-slate-300"
                                required
                            />
                        </div>
                        <div className="space-y-3 sm:col-span-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Descripcion</Label>
                            <Textarea
                                placeholder="Breve descripción del plato..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={2}
                                className="bg-slate-50 border-slate-200 text-[#1e3a5f] hover:bg-white focus:bg-white focus:border-[#1e3a5f]/40 rounded-xl p-4 font-semibold placeholder:text-slate-300"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Rendimiento</Label>
                            <div className="flex gap-3">
                                <Input type="number" min="0.1" step="0.1" value={formData.yield} onChange={(e) => setFormData({ ...formData, yield: e.target.value })} className="w-24 bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-mono font-bold" />
                                <Select value={formData.yieldUnit} onValueChange={(v: string) => setFormData({ ...formData, yieldUnit: v })}>
                                    <SelectTrigger className="flex-1 bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-[#1e3a5f] rounded-xl">
                                        <SelectItem value="unidad">unidades</SelectItem>
                                        <SelectItem value="porción">porciones</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lt">litros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Tiempo (Min)</Label>
                            <Input type="number" min="1" placeholder="30" value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} className="bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-mono font-bold placeholder:text-slate-300" />
                        </div>
                        <div className="space-y-3 sm:col-span-2 relative">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Categoria *</Label>
                            {isNewCategory ? (
                                <div className="flex gap-2">
                                    <Input 
                                        value={formData.category} 
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })} 
                                        required 
                                        placeholder="Ej. PLATOS PRINCIPALES" 
                                        className="bg-slate-50 border-slate-200 text-[#1e3a5f] hover:bg-white focus:bg-white focus:border-[#1e3a5f]/40 rounded-xl transition-all h-12 px-4 text-base font-bold placeholder:text-slate-300 flex-1"
                                        autoComplete="off"
                                        autoFocus
                                    />
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => { setIsNewCategory(false); setFormData({ ...formData, category: "" }); }}
                                        className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#1e3a5f]"
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
                                    <SelectTrigger className="bg-slate-50 border-slate-200 text-[#1e3a5f] hover:bg-white focus:bg-white focus:border-[#1e3a5f]/40 rounded-xl transition-all h-12 px-4 text-base font-bold">
                                        <SelectValue placeholder="Seleccionar o crear..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-200 text-[#1e3a5f] rounded-xl shadow-xl p-2 min-w-[200px]">
                                        {existingCategories.map(c => <SelectItem key={c} value={c} className="focus:bg-slate-100 rounded-lg cursor-pointer py-3 px-4 font-bold text-sm mb-1 last:mb-0 transition-colors uppercase">{c}</SelectItem>)}
                                        {existingCategories.length > 0 && <SelectSeparator className="bg-slate-100 my-2" />}
                                        <SelectItem value="NEW_CATEGORY" className="focus:bg-teal-50 text-teal-600 font-bold justify-center py-3 px-4 cursor-pointer rounded-lg transition-colors">+ Crear Nueva Categoria</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Ingredientes & Proporcion</Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Select value={selectedIngredient} onValueChange={(v: string) => setSelectedIngredient(v)}>
                                <SelectTrigger className="flex-1 bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-bold"><SelectValue placeholder="Seleccionar ingrediente" /></SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 text-[#1e3a5f] rounded-xl">
                                    {availableIngredients?.map((ing) => (
                                        <SelectItem key={ing.id} value={ing.id} className="p-3 rounded-lg focus:bg-slate-100 cursor-pointer">
                                            {ing.name} ({ing.unit}) - {formatCurrency(Number(ing.avgCost))}/{ing.unit}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input type="number" step="0.001" min="0.001" placeholder="Cant." value={ingredientQty} onChange={(e) => setIngredientQty(e.target.value)} className="w-full sm:w-28 bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-mono font-bold placeholder:text-slate-300" />
                            <Button type="button" variant="secondary" onClick={handleAddIngredient} className="h-12 w-full sm:w-12 rounded-xl bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/90 transition-all"><Plus className="h-5 w-5" /></Button>
                        </div>
                        {recipeIngredients.length > 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                                <div className="divide-y divide-slate-100">
                                    {recipeIngredients.map((ri) => (
                                        <div key={ri.ingredientId} className="flex items-center justify-between p-4 group hover:bg-slate-50 transition-colors">
                                            <div>
                                                <p className="font-black text-[#1e3a5f] text-sm">{ri.ingredientName.toUpperCase()}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ri.quantity} {ri.unit.toUpperCase()}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="font-mono text-sm font-bold text-slate-500">{formatCurrency(ri.quantity * ri.avgCost)}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all text-slate-300" onClick={() => handleRemoveIngredient(ri.ingredientId)}><X className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-slate-100 bg-slate-50 p-5 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Costo Total Materiales</span>
                                    <span className="font-mono text-lg font-black text-[#1e3a5f]">{formatCurrency(totalCost)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-slate-400 uppercase font-black tracking-widest text-[10px]">
                                Agrega ingredientes para calcular el coste base
                            </div>
                        )}
                    </div>

                    <div className="space-y-5 rounded-2xl bg-slate-50 border border-slate-100 p-5">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Margen Operativo</Label>
                            <span className="font-mono text-3xl font-black text-[#1e3a5f]">{formData.targetMargin}%</span>
                        </div>
                        <Slider
                            value={[formData.targetMargin]}
                            onValueChange={(v) => setFormData({ ...formData, targetMargin: v[0] })}
                            min={0}
                            max={200}
                            step={1}
                            className="py-4 [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-slate-200 [&_[data-slot=slider-range]]:bg-[#1e3a5f] [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-[#1e3a5f] [&_[data-slot=slider-thumb]]:shadow-md"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="rounded-xl bg-white p-4 text-center border border-slate-200">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Costo/Ud</p>
                                <p className="font-mono font-bold text-slate-600">{formatCurrency(costPerUnit)}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 text-center border border-[#1e3a5f]/20">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#1e3a5f] mb-1">PVP Sugerido</p>
                                <p className="font-mono text-xl font-black text-[#1e3a5f]">{formatCurrency(suggestedPrice)}</p>
                            </div>
                            <div className="rounded-xl bg-white p-4 text-center border border-teal-100">
                                <p className="text-[9px] font-black uppercase tracking-widest text-teal-600 mb-1">Margen/Ud</p>
                                <p className="font-mono font-bold text-teal-600">+{formatCurrency(profit)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Instrucciones de Preparacion</Label>
                        <Textarea placeholder="Describir pasos..." value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} rows={3} className="bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl p-4 focus:border-[#1e3a5f]/40 transition-all placeholder:text-slate-300" />
                    </div>

                    <DialogFooter className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end w-full gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-12 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-[#1e3a5f] hover:bg-slate-100">Cancelar</Button>
                        <Button type="submit" disabled={createMutation.isPending || recipeIngredients.length === 0 || isDemo} className="bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/90 rounded-xl h-12 px-8 font-black text-[11px] uppercase tracking-widest transition-all shadow-[0_8px_22px_rgba(30,58,95,0.22)]">
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
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[820px] bg-white border border-slate-200 rounded-[24px] p-0 shadow-[0_24px_80px_rgba(30,58,95,0.22)]">
                <DialogHeader className="p-8 pb-6 border-b border-slate-100 bg-slate-50/60">
                    <DialogTitle className="text-3xl font-black tracking-tight text-[#1e3a5f] uppercase">Editar Receta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid gap-5 sm:grid-cols-2 rounded-2xl border border-slate-100 bg-white p-5">
                        <div className="space-y-3 sm:col-span-2">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre de la Receta</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-50 border-slate-200 text-[#1e3a5f] hover:bg-white focus:bg-white focus:border-[#1e3a5f]/40 rounded-xl transition-all h-12 px-4 text-base font-bold" required />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Rendimiento</Label>
                            <div className="flex gap-3">
                                <Input type="number" min="0.1" step="0.1" value={formData.yield} onChange={(e) => setFormData({ ...formData, yield: e.target.value })} className="w-24 bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-mono font-bold" />
                                <Select value={formData.yieldUnit} onValueChange={(v) => setFormData({ ...formData, yieldUnit: v })}>
                                    <SelectTrigger className="flex-1 bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-white border-slate-200 text-[#1e3a5f] rounded-xl">
                                        <SelectItem value="unidad">unidades</SelectItem>
                                        <SelectItem value="porción">porciones</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lt">litros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Tiempo (Min)</Label>
                            <Input type="number" min="1" value={formData.prepTime} onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })} className="bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-mono font-bold" />
                        </div>
                        <div className="space-y-3 sm:col-span-2 relative">
                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Categoria *</Label>
                            {isNewCategory ? (
                                <div className="flex gap-2">
                                    <Input 
                                        value={formData.category} 
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })} 
                                        required 
                                        placeholder="Ej. PLATOS PRINCIPALES" 
                                        className="bg-slate-50 border-slate-200 text-[#1e3a5f] hover:bg-white focus:bg-white focus:border-[#1e3a5f]/40 rounded-xl transition-all h-12 px-4 text-base font-bold placeholder:text-slate-300 flex-1"
                                        autoComplete="off"
                                        autoFocus
                                    />
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => { setIsNewCategory(false); setFormData({ ...formData, category: "" }); }}
                                        className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-[#1e3a5f]"
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
                                    <SelectTrigger className="bg-slate-50 border-slate-200 text-[#1e3a5f] hover:bg-white focus:bg-white focus:border-[#1e3a5f]/40 rounded-xl transition-all h-12 px-4 text-base font-bold">
                                        <SelectValue placeholder="Seleccionar o crear..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border border-slate-200 text-[#1e3a5f] rounded-xl shadow-xl p-2 min-w-[200px]">
                                        {existingCategories.map(c => <SelectItem key={c} value={c} className="focus:bg-slate-100 rounded-lg cursor-pointer py-3 px-4 font-bold text-sm mb-1 last:mb-0 transition-colors uppercase">{c}</SelectItem>)}
                                        {existingCategories.length > 0 && <SelectSeparator className="bg-slate-100 my-2" />}
                                        <SelectItem value="NEW_CATEGORY" className="focus:bg-teal-50 text-teal-600 font-bold justify-center py-3 px-4 cursor-pointer rounded-lg transition-colors">+ Crear Nueva Categoria</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Ingredientes & Proporción</Label>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Select value={selectedIngredient} onValueChange={(v: string) => setSelectedIngredient(v)}><SelectTrigger className="flex-1 bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-bold"><SelectValue placeholder="Agregar ingrediente..." /></SelectTrigger><SelectContent className="bg-white border-slate-200 text-[#1e3a5f] rounded-xl">{availableIngredients?.map((ing) => (<SelectItem key={ing.id} value={ing.id} className="p-3 rounded-lg focus:bg-slate-100 cursor-pointer">{ing.name} ({ing.unit})</SelectItem>))}</SelectContent></Select>
                            <Input type="number" step="0.001" min="0.001" placeholder="Cant" value={ingredientQty} onChange={(e) => setIngredientQty(e.target.value)} className="w-full sm:w-24 bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl h-12 px-4 font-mono font-bold placeholder:text-slate-300" />
                            <Button type="button" variant="secondary" onClick={handleAddIngredient} className="h-12 w-full sm:w-12 rounded-xl bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/90 transition-all"><Plus className="h-4 w-4" /></Button>
                        </div>
                        {recipeIngredients.length > 0 && (
                            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
                                {recipeIngredients.map((ri) => (
                                    <div key={ri.ingredientId} className="flex items-center justify-between p-4 group hover:bg-slate-50 transition-colors">
                                        <div><p className="font-black text-[#1e3a5f] text-sm">{ri.ingredientName.toUpperCase()}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ri.quantity} {ri.unit.toUpperCase()}</p></div>
                                        <div className="flex items-center gap-6"><span className="font-mono text-sm font-bold text-slate-500">{formatCurrency(ri.quantity * ri.avgCost)}</span><Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all text-slate-300" onClick={() => handleRemoveIngredient(ri.ingredientId)}><X className="h-4 w-4" /></Button></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-5 rounded-2xl bg-slate-50 border border-slate-100 p-5">
                        <div className="flex items-center justify-between"><Label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Margen Objetivo</Label><span className="font-mono text-3xl font-black text-[#1e3a5f]">{formData.targetMargin}%</span></div>
                        <Slider value={[formData.targetMargin]} onValueChange={(val) => setFormData({ ...formData, targetMargin: val[0] })} min={0} max={200} step={1} className="py-4 [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-slate-200 [&_[data-slot=slider-range]]:bg-[#1e3a5f] [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-[#1e3a5f] [&_[data-slot=slider-thumb]]:shadow-md" />
                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Costo Base: {formatCurrency(costPerUnit)}</span>
                            <span className="font-mono text-xl font-black text-[#1e3a5f]">Venta: {formatCurrency(suggestedPrice)}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">Instrucciones</Label>
                        <Textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} rows={3} className="bg-slate-50 border-slate-200 text-[#1e3a5f] rounded-xl p-4 focus:border-[#1e3a5f]/40 transition-all placeholder:text-slate-300" />
                    </div>
                    <DialogFooter className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end w-full gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-12 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-[#1e3a5f] hover:bg-slate-100">Cancelar</Button>
                        <Button type="submit" disabled={updateMutation.isPending || isDemo} className="bg-[#1e3a5f] text-white hover:bg-[#1e3a5f]/90 rounded-xl h-12 px-8 font-black text-[11px] uppercase tracking-widest transition-all shadow-[0_8px_22px_rgba(30,58,95,0.22)]">
                            {updateMutation.isPending && <Loader2 className="mr-3 h-4 w-4 animate-spin" />} Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
