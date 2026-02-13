"use client";

import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import {
    useRecipes,
    useCreateRecipe,
    useUpdateRecipe,
    useDeleteRecipe,
    calculateSuggestedPrice,
    type Recipe,
    type RecipeIngredient,
} from "@/hooks/use-recipes";
import { useDemo } from "@/hooks/use-demo";
import { useIngredients, type Ingredient } from "@/hooks/use-ingredients";
import { formatCurrency } from "@/lib/calculations";
import {
    FlaskConical,
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    TrendingUp,
    Package,
    Clock,
    Loader2,
    Calculator,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface RecipeIngredientForm {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
    avgCost: number;
}

// Reuse form logic could be extracted but keeping it simple inline keying off passed recipe or not
// For clarity I will create a separate Edit Dialog component

function CreateRecipeDialog({
    ingredients,
}: {
    ingredients: Ingredient[] | undefined;
}) {
    const { isDemo } = useDemo();
    const [open, setOpen] = useState(false);
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
    const [recipeIngredients, setRecipeIngredients] = useState<
        RecipeIngredientForm[]
    >([]);
    const [selectedIngredient, setSelectedIngredient] = useState("");
    const [ingredientQty, setIngredientQty] = useState("");

    const createMutation = useCreateRecipe();

    // Calculate totals
    const totalCost = useMemo(() => {
        return recipeIngredients.reduce(
            (sum, ing) => sum + ing.quantity * ing.avgCost,
            0
        );
    }, [recipeIngredients]);

    const costPerUnit =
        parseFloat(formData.yield) > 0
            ? totalCost / parseFloat(formData.yield)
            : totalCost;

    const suggestedPrice = calculateSuggestedPrice(
        costPerUnit,
        formData.targetMargin
    );

    const profit = suggestedPrice - costPerUnit;

    const handleAddIngredient = () => {
        if (!selectedIngredient || !ingredientQty) return;

        const ing = ingredients?.find((i) => i.id === selectedIngredient);
        if (!ing) return;

        // Check if already added
        if (recipeIngredients.some((ri) => ri.ingredientId === ing.id)) {
            return;
        }

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
        setRecipeIngredients(
            recipeIngredients.filter((ri) => ri.ingredientId !== ingredientId)
        );
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
            name: "",
            description: "",
            yield: "1",
            yieldUnit: "unidad",
            targetMargin: 40,
            category: "",
            prepTime: "",
            instructions: "",
        });
        setRecipeIngredients([]);
    };

    const availableIngredients = ingredients?.filter(
        (ing) => !recipeIngredients.some((ri) => ri.ingredientId === ing.id)
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2" disabled={isDemo}>
                    <Plus className="h-4 w-4" />
                    Nueva Receta
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
                {/* Form content repeated logic from previous file but wrapped here */}
                <DialogHeader>
                    <DialogTitle>Crear Nueva Receta</DialogTitle>
                    <DialogDescription>
                        Define los ingredientes y calcula el precio óptimo
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Form content repeated logic from previous file but wrapped here */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Nombre de la Receta *</Label>
                            <Input
                                placeholder="Ej: Lasaña Familiar"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Descripción</Label>
                            <Textarea
                                placeholder="Breve descripción del plato..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Rendimiento</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={formData.yield}
                                    onChange={(e) =>
                                        setFormData({ ...formData, yield: e.target.value })
                                    }
                                    className="w-24"
                                />
                                <Select
                                    value={formData.yieldUnit}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, yieldUnit: value })
                                    }
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unidad">unidades</SelectItem>
                                        <SelectItem value="porción">porciones</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lt">litros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tiempo de Preparación (min)</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="30"
                                value={formData.prepTime}
                                onChange={(e) =>
                                    setFormData({ ...formData, prepTime: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                            <Label>Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Platos Principales">
                                        Platos Principales
                                    </SelectItem>
                                    <SelectItem value="Entradas">Entradas</SelectItem>
                                    <SelectItem value="Postres">Postres</SelectItem>
                                    <SelectItem value="Bebidas">Bebidas</SelectItem>
                                    <SelectItem value="Salsas">Salsas</SelectItem>
                                    <SelectItem value="Snacks">Snacks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Ingredients Section */}
                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Ingredientes</Label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedIngredient}
                                onValueChange={setSelectedIngredient}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Seleccionar ingrediente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableIngredients?.map((ing) => (
                                        <SelectItem key={ing.id} value={ing.id}>
                                            {ing.name} ({ing.unit}) -{" "}
                                            {formatCurrency(Number(ing.avgCost))}/{ing.unit}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                step="0.001"
                                min="0.001"
                                placeholder="Cantidad"
                                value={ingredientQty}
                                onChange={(e) => setIngredientQty(e.target.value)}
                                className="w-28"
                            />
                            <Button type="button" variant="secondary" onClick={handleAddIngredient}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {recipeIngredients.length > 0 ? (
                            <div className="rounded-lg border">
                                <div className="divide-y">
                                    {recipeIngredients.map((ri) => (
                                        <div
                                            key={ri.ingredientId}
                                            className="flex items-center justify-between p-3"
                                        >
                                            <div>
                                                <span className="font-medium">{ri.ingredientName}</span>
                                                <span className="ml-2 text-muted-foreground">
                                                    {ri.quantity} {ri.unit}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm">
                                                    {formatCurrency(ri.quantity * ri.avgCost)}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleRemoveIngredient(ri.ingredientId)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t bg-muted/50 p-3">
                                    <div className="flex justify-between font-semibold">
                                        <span>Costo Total de Materiales</span>
                                        <span className="font-mono">{formatCurrency(totalCost)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                                Agrega ingredientes para calcular el costo
                            </div>
                        )}
                    </div>

                    {/* Profit Slider */}
                    {recipeIngredients.length > 0 && (
                        <div className="space-y-4 rounded-lg bg-gradient-to-r from-primary/5 to-orange-500/5 p-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">
                                    Margen de Ganancia
                                </Label>
                                <span className="font-mono text-2xl font-bold text-primary">
                                    {formData.targetMargin}%
                                </span>
                            </div>

                            <Slider
                                value={[formData.targetMargin]}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, targetMargin: value[0] })
                                }
                                min={10}
                                max={80}
                                step={1}
                                className="py-4"
                            />

                            <div className="grid grid-cols-3 gap-4 pt-2">
                                <div className="rounded-lg bg-background p-3 text-center">
                                    <p className="text-xs text-muted-foreground">Costo/Unidad</p>
                                    <p className="font-mono font-semibold">
                                        {formatCurrency(costPerUnit)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-primary/10 p-3 text-center">
                                    <p className="text-xs text-primary">Precio Sugerido</p>
                                    <p className="font-mono text-xl font-bold text-primary">
                                        {formatCurrency(suggestedPrice)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-green-500/10 p-3 text-center">
                                    <p className="text-xs text-green-600">Ganancia/Unidad</p>
                                    <p className="font-mono font-semibold text-green-600">
                                        +{formatCurrency(profit)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="space-y-2">
                        <Label>Instrucciones</Label>
                        <Textarea
                            placeholder="Pasos de preparación..."
                            value={formData.instructions}
                            onChange={(e) =>
                                setFormData({ ...formData, instructions: e.target.value })
                            }
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                createMutation.isPending || recipeIngredients.length === 0 || isDemo
                            }
                        >
                            {createMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Crear Receta
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditRecipeDialog({
    recipe,
    ingredients,
    open,
    onOpenChange,
}: {
    recipe: Recipe;
    ingredients: Ingredient[] | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { isDemo } = useDemo();
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

    const [recipeIngredients, setRecipeIngredients] = useState<
        RecipeIngredientForm[]
    >(
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

    // Reset/Sync when recipe changes (important for re-opening dialog with fresh data if needed, but mainly init is enough)
    useEffect(() => {
        if (open) {
            setFormData({
                name: recipe.name,
                description: recipe.description || "",
                yield: recipe.yield.toString(),
                yieldUnit: recipe.yieldUnit,
                targetMargin: Number(recipe.targetMargin),
                category: recipe.category || "",
                prepTime: recipe.prepTime?.toString() || "",
                instructions: recipe.instructions || "",
            });
            setRecipeIngredients(recipe.ingredients.map((ri) => ({
                ingredientId: ri.ingredientId,
                ingredientName: ri.ingredient.name,
                quantity: Number(ri.quantity),
                unit: ri.unit,
                avgCost: Number(ri.ingredient.avgCost),
            })));
        }
    }, [open, recipe]);

    const totalCost = useMemo(() => {
        return recipeIngredients.reduce(
            (sum, ing) => sum + ing.quantity * ing.avgCost,
            0
        );
    }, [recipeIngredients]);

    const costPerUnit =
        parseFloat(formData.yield) > 0
            ? totalCost / parseFloat(formData.yield)
            : totalCost;

    const suggestedPrice = calculateSuggestedPrice(
        costPerUnit,
        formData.targetMargin
    );

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
        setRecipeIngredients(
            recipeIngredients.filter((ri) => ri.ingredientId !== ingredientId)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateMutation.mutateAsync({
            id: recipe.id,
            data: {
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
            },
        });
        onOpenChange(false);
    };

    const availableIngredients = ingredients?.filter(
        (ing) => !recipeIngredients.some((ri) => ri.ingredientId === ing.id)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Editar Receta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Exactly same form fields as Create */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Nombre de la Receta *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Rendimiento</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={formData.yield}
                                    onChange={(e) =>
                                        setFormData({ ...formData, yield: e.target.value })
                                    }
                                    className="w-24"
                                />
                                <Select
                                    value={formData.yieldUnit}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, yieldUnit: value })
                                    }
                                >
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unidad">unidades</SelectItem>
                                        <SelectItem value="porción">porciones</SelectItem>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lt">litros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Tiempo de Preparación (min)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.prepTime}
                                onChange={(e) =>
                                    setFormData({ ...formData, prepTime: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label>Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, category: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Platos Principales">Platos Principales</SelectItem>
                                    <SelectItem value="Entradas">Entradas</SelectItem>
                                    <SelectItem value="Postres">Postres</SelectItem>
                                    <SelectItem value="Bebidas">Bebidas</SelectItem>
                                    <SelectItem value="Salsas">Salsas</SelectItem>
                                    <SelectItem value="Snacks">Snacks</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-base font-semibold">Ingredientes</Label>
                        <div className="flex gap-2">
                            <Select
                                value={selectedIngredient}
                                onValueChange={setSelectedIngredient}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Agregar ingrediente..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableIngredients?.map((ing) => (
                                        <SelectItem key={ing.id} value={ing.id}>
                                            {ing.name} ({ing.unit})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                type="number"
                                step="0.001"
                                min="0.001"
                                placeholder="Cant"
                                value={ingredientQty}
                                onChange={(e) => setIngredientQty(e.target.value)}
                                className="w-24"
                            />
                            <Button type="button" variant="secondary" onClick={handleAddIngredient}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {recipeIngredients.length > 0 && (
                            <div className="rounded-lg border divide-y">
                                {recipeIngredients.map((ri) => (
                                    <div key={ri.ingredientId} className="flex items-center justify-between p-3">
                                        <div>
                                            <span className="font-medium">{ri.ingredientName}</span>
                                            <span className="ml-2 text-muted-foreground">{ri.quantity} {ri.unit}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm">{formatCurrency(ri.quantity * ri.avgCost)}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveIngredient(ri.ingredientId)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 rounded-lg bg-secondary/10 p-4">
                        <div className="flex items-center justify-between">
                            <Label>Margen Objetivo</Label>
                            <span className="font-bold text-primary">{formData.targetMargin}%</span>
                        </div>
                        <Slider
                            value={[formData.targetMargin]}
                            onValueChange={(val) => setFormData({ ...formData, targetMargin: val[0] })}
                            min={10} max={80} step={1}
                        />
                        <div className="flex justify-between text-sm">
                            <span>Costo: {formatCurrency(costPerUnit)}</span>
                            <span className="font-bold text-lg">Precio: {formatCurrency(suggestedPrice)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Instrucciones</Label>
                        <Textarea
                            value={formData.instructions}
                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={updateMutation.isPending || isDemo}>
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RecipeCard({
    recipe,
    onDelete,
    onEdit,
}: {
    recipe: Recipe;
    onDelete: () => void;
    onEdit: () => void;
}) {
    const [margin, setMargin] = useState(Number(recipe.targetMargin));

    const cost = Number(recipe.calculatedCost);
    const suggestedPrice = useMemo(() => {
        return calculateSuggestedPrice(cost, margin);
    }, [cost, margin]);

    const profit = suggestedPrice - cost;
    const { isDemo } = useDemo();

    return (
        <Card className="group overflow-hidden transition-all hover:border-primary/50">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{recipe.name}</CardTitle>
                        {recipe.category && (
                            <Badge variant="secondary" className="mt-1">
                                {recipe.category}
                            </Badge>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100"
                                disabled={isDemo}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onEdit}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Recipe Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>
                            Rinde: {Number(recipe.yield)} {recipe.yieldUnit}
                        </span>
                    </div>
                    {recipe.prepTime && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{recipe.prepTime} min</span>
                        </div>
                    )}
                </div>

                {/* Ingredient Count */}
                <div className="text-sm text-muted-foreground">
                    {recipe.ingredients?.length || 0} ingredientes
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Costo por unidad</span>
                        <span className="font-mono font-semibold">
                            {formatCurrency(cost)}
                        </span>
                    </div>

                    {/* Profit Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Margen de ganancia
                            </span>
                            <span className="font-mono text-lg font-bold text-primary">
                                {margin.toFixed(0)}%
                            </span>
                        </div>
                        <Slider
                            value={[margin]}
                            onValueChange={(value) => setMargin(value[0])}
                            min={10}
                            max={80}
                            step={1}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>10%</span>
                            <span>80%</span>
                        </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Suggested Price */}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio sugerido</span>
                        <span className="font-mono text-xl font-bold text-primary">
                            {formatCurrency(suggestedPrice)}
                        </span>
                    </div>

                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ganancia por unidad</span>
                        <span className="font-mono font-semibold text-green-500">
                            +{formatCurrency(profit)}
                        </span>
                    </div>
                </div>

                {/* Production Count */}
                {recipe._count && recipe._count.productionBatches > 0 && (
                    <div className="text-xs text-muted-foreground">
                        {recipe._count.productionBatches} lotes producidos
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function LaboratorioPage() {
    const [search, setSearch] = useState("");
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

    const { data: recipes, isLoading, error } = useRecipes({ search });
    const { data: ingredients } = useIngredients();

    const deleteMutation = useDeleteRecipe();

    // Calculate totals
    const stats = useMemo(() => {
        if (!recipes) return { total: 0, avgMargin: 0, avgCost: 0 };
        const totalMargin = recipes.reduce(
            (sum, r) => sum + Number(r.targetMargin),
            0
        );
        const totalCost = recipes.reduce(
            (sum, r) => sum + Number(r.calculatedCost),
            0
        );
        return {
            total: recipes.length,
            avgMargin: recipes.length > 0 ? totalMargin / recipes.length : 0,
            avgCost: recipes.length > 0 ? totalCost / recipes.length : 0,
        };
    }, [recipes]);

    return (

        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Laboratorio de Precios
                    </h1>
                    <p className="text-muted-foreground">
                        Construye recetas y optimiza tus márgenes de ganancia
                    </p>
                </div>
                <CreateRecipeDialog ingredients={ingredients} />
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <FlaskConical className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-muted-foreground">Recetas Activas</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                            <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {stats.avgMargin.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Margen Promedio</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                            <Calculator className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">
                                {formatCurrency(stats.avgCost)}
                            </p>
                            <p className="text-xs text-muted-foreground">Costo Promedio</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar recetas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Recipes Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-muted-foreground">Error al cargar recetas</p>
                    </CardContent>
                </Card>
            ) : recipes?.length === 0 ? (
                <Card className="border-dashed border-2 border-muted-foreground/25">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                            <FlaskConical className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold">
                            Crea tu primera receta
                        </h3>
                        <p className="mb-6 max-w-md text-muted-foreground">
                            {ingredients && ingredients.length > 0
                                ? "Combina tus ingredientes y calcula precios óptimos con el Profit Slider"
                                : "Primero agrega ingredientes en el módulo de Inventario"}
                        </p>
                        <CreateRecipeDialog ingredients={ingredients} />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {recipes?.map((recipe) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onDelete={() => deleteMutation.mutate(recipe.id)}
                            onEdit={() => setEditingRecipe(recipe)}
                        />
                    ))}
                </div>
            )}

            {editingRecipe && (
                <EditRecipeDialog
                    recipe={editingRecipe}
                    ingredients={ingredients}
                    open={!!editingRecipe}
                    onOpenChange={(open) => !open && setEditingRecipe(null)}
                />
            )}
        </div>
    );
}
