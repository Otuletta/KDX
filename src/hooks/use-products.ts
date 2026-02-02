import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Product {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;  // Added for product images
    recipeId: string | null;
    sellingPrice: number;
    currentStock: number;
    category: string | null;
    sku: string | null;
    isActive: boolean;
    recipe?: {
        id: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

export function useProducts(filters?: { search?: string; inStock?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.inStock) params.append("inStock", "true");

    return useQuery<Product[]>({
        queryKey: ["products", filters],
        queryFn: async () => {
            const res = await fetch(`/api/products?${params.toString()}`);
            if (!res.ok) throw new Error("Error al cargar productos");
            return res.json();
        },
    });
}

export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Product>) => {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al crear producto");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Producto creado exitosamente");
        },
        onError: () => {
            toast.error("Error al crear producto");
        },
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
            const res = await fetch(`/api/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al actualizar producto");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Producto actualizado");
        },
        onError: () => {
            toast.error("Error al actualizar producto");
        },
    });
}

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/products/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error al eliminar producto");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast.success("Producto eliminado");
        },
        onError: () => {
            toast.error("Error al eliminar producto");
        },
    });
}
