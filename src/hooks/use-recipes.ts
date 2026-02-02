import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface RecipeIngredient {
    id: string;
    recipeId: string;
    ingredientId: string;
    quantity: number;
    unit: string;
    notes: string | null;
    ingredient: {
        id: string;
        name: string;
        unit: string;
        avgCost: number;
    };
}

export interface Recipe {
    id: string;
    name: string;
    description: string | null;
    yield: number;
    yieldUnit: string;
    targetMargin: number;
    calculatedCost: number;
    suggestedPrice: number;
    category: string | null;
    prepTime: number | null;
    instructions: string | null;
    isActive: boolean;
    ingredients: RecipeIngredient[];
    _count?: {
        productionBatches: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateRecipeInput {
    name: string;
    description?: string;
    yield: number;
    yieldUnit: string;
    targetMargin?: number;
    category?: string;
    prepTime?: number;
    instructions?: string;
    ingredients: {
        ingredientId: string;
        quantity: number;
        unit: string;
        notes?: string;
    }[];
}

// Fetch all recipes
export function useRecipes(filters?: { search?: string }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);

    return useQuery<Recipe[]>({
        queryKey: ["recipes", filters],
        queryFn: async () => {
            const res = await fetch(`/api/recipes?${params.toString()}`);
            if (!res.ok) throw new Error("Error al cargar recetas");
            return res.json();
        },
    });
}

// Fetch single recipe
export function useRecipe(id: string) {
    return useQuery<Recipe>({
        queryKey: ["recipes", id],
        queryFn: async () => {
            const res = await fetch(`/api/recipes/${id}`);
            if (!res.ok) throw new Error("Error al cargar receta");
            return res.json();
        },
        enabled: !!id,
    });
}

// Create recipe
export function useCreateRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateRecipeInput) => {
            const res = await fetch("/api/recipes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al crear receta");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
            toast.success("Receta creada exitosamente");
        },
        onError: () => {
            toast.error("Error al crear receta");
        },
    });
}

// Update recipe
export function useUpdateRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Partial<CreateRecipeInput>;
        }) => {
            const res = await fetch(`/api/recipes/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al actualizar receta");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
            queryClient.invalidateQueries({ queryKey: ["recipes", variables.id] });
            toast.success("Receta actualizada");
        },
        onError: () => {
            toast.error("Error al actualizar receta");
        },
    });
}

// Delete recipe
export function useDeleteRecipe() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/recipes/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error al eliminar receta");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["recipes"] });
            toast.success("Receta eliminada");
        },
        onError: () => {
            toast.error("Error al eliminar receta");
        },
    });
}

// Calculate recipe cost from ingredients
export function calculateRecipeCost(
    ingredients: { quantity: number; avgCost: number }[]
): number {
    return ingredients.reduce((total, ing) => {
        return total + ing.quantity * ing.avgCost;
    }, 0);
}

// Calculate suggested price
export function calculateSuggestedPrice(cost: number, marginPercent: number): number {
    if (marginPercent >= 100) return cost * 10;
    return cost / (1 - marginPercent / 100);
}

// Calculate actual margin
export function calculateMargin(cost: number, price: number): number {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
}
