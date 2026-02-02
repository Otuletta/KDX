import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Supplier {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
    isActive: boolean;
    _count?: {
        ingredients: number;
        purchaseOrders: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface CreateSupplierInput {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
}

// Fetch all suppliers
export function useSuppliers(filters?: { search?: string }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);

    return useQuery<Supplier[]>({
        queryKey: ["suppliers", filters],
        queryFn: async () => {
            const res = await fetch(`/api/suppliers?${params.toString()}`);
            if (!res.ok) throw new Error("Error al cargar proveedores");
            return res.json();
        },
    });
}

// Fetch single supplier
export function useSupplier(id: string) {
    return useQuery<Supplier>({
        queryKey: ["suppliers", id],
        queryFn: async () => {
            const res = await fetch(`/api/suppliers/${id}`);
            if (!res.ok) throw new Error("Error al cargar proveedor");
            return res.json();
        },
        enabled: !!id,
    });
}

// Create supplier
export function useCreateSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateSupplierInput) => {
            const res = await fetch("/api/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al crear proveedor");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Proveedor creado exitosamente");
        },
        onError: () => {
            toast.error("Error al crear proveedor");
        },
    });
}

// Update supplier
export function useUpdateSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            data,
        }: {
            id: string;
            data: Partial<CreateSupplierInput>;
        }) => {
            const res = await fetch(`/api/suppliers/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al actualizar proveedor");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            queryClient.invalidateQueries({ queryKey: ["suppliers", variables.id] });
            toast.success("Proveedor actualizado");
        },
        onError: () => {
            toast.error("Error al actualizar proveedor");
        },
    });
}

// Delete supplier
export function useDeleteSupplier() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/suppliers/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Error al eliminar proveedor");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            toast.success("Proveedor eliminado");
        },
        onError: () => {
            toast.error("Error al eliminar proveedor");
        },
    });
}
