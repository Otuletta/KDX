import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Ingredient {
    id: string;
    name: string;
    unit: string;
    currentStock: number;
    minStock: number;
    avgCost: number;
    category: string | null;
    isActive: boolean;
    supplierId: string | null;
    supplier: {
        id: string;
        name: string;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateIngredientInput {
    name: string;
    unit: string;
    currentStock?: number;
    minStock?: number;
    avgCost?: number;
    category?: string;
    supplierId?: string;
}

export interface StockMovementInput {
    type: "IN" | "OUT" | "ADJUST";
    quantity: number;
    reason?: string;
    referenceId?: string;
    unitCost?: number;
    supplierId?: string;
    invoiceRef?: string;
}

export interface StockMovement {
    id: string;
    ingredientId: string;
    type: "IN" | "OUT" | "ADJUST";
    quantity: number;
    reason: string | null;
    referenceId: string | null;
    createdAt: string;
    branch: { name: string };
}

// Fetch all ingredients
export function useIngredients(filters?: {
    search?: string;
    category?: string;
    status?: string;
}) {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.category) params.append("category", filters.category);
    if (filters?.status) params.append("status", filters.status);

    return useQuery<Ingredient[]>({
        queryKey: ["ingredients", filters],
        queryFn: async () => {
            const res = await fetch(`/api/ingredients?${params.toString()}`);
            if (!res.ok) throw new Error("Error al cargar ingredientes");
            return res.json();
        },
    });
}

// Fetch single ingredient with details
export function useIngredient(id: string) {
    return useQuery({
        queryKey: ["ingredients", id],
        queryFn: async () => {
            const res = await fetch(`/api/ingredients/${id}`);
            if (!res.ok) throw new Error("Error al cargar ingrediente");
            return res.json();
        },
        enabled: !!id,
    });
}

// Fetch ingredient movements (Kardex)
export function useIngredientMovements(id: string) {
    return useQuery<StockMovement[]>({
        queryKey: ["ingredients", id, "movements"],
        queryFn: async () => {
            const res = await fetch(`/api/ingredients/${id}/movements`);
            if (!res.ok) throw new Error("Error al cargar historial de stock");
            return res.json();
        },
        enabled: !!id,
    });
}

// Create ingredient
export function useCreateIngredient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateIngredientInput) => {
            const res = await fetch("/api/ingredients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al crear ingrediente");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ingredients"] });
            toast.success("Ingrediente creado exitosamente");
        },
        onError: () => {
            toast.error("Error al crear ingrediente");
        },
    });
}

// Update ingredient
export function useUpdateIngredient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Partial<CreateIngredientInput>;
        }) => {
            const res = await fetch(`/api/ingredients/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al actualizar ingrediente");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["ingredients"] });
            queryClient.invalidateQueries({ queryKey: ["ingredients", variables.id] });
            toast.success("Ingrediente actualizado");
        },
        onError: () => {
            toast.error("Error al actualizar ingrediente");
        },
    });
}

// Delete ingredient
export function useDeleteIngredient() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/ingredients/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error al eliminar ingrediente");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ingredients"] });
            toast.success("Ingrediente eliminado");
        },
        onError: () => {
            toast.error("Error al eliminar ingrediente");
        },
    });
}

// Stock movement
export function useStockMovement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ingredientId,
            data,
        }: {
            ingredientId: string;
            data: StockMovementInput;
        }) => {
            const res = await fetch(`/api/ingredients/${ingredientId}/stock`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al registrar movimiento");
            }
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["ingredients"] });
            queryClient.invalidateQueries({
                queryKey: ["ingredients", variables.ingredientId],
            });
            toast.success("Movimiento registrado");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

// Get stock status
export function getStockStatus(
    currentStock: number,
    minStock: number
): "critical" | "low" | "ok" {
    if (currentStock <= 0) return "critical";
    if (currentStock <= minStock) return "low";
    return "ok";
}
