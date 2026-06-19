import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface PurchaseOrderItem {
    id: string;
    ingredientId: string;
    quantity: number;
    estimatedCost: number;
    actualCost: number | null;
    received: boolean;
}

export interface PurchaseOrder {
    id: string;
    supplierId: string | null;
    status: "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED";
    totalAmount: number | null;
    notes: string | null;
    sentAt: string | null;
    receivedAt: string | null;
    items: PurchaseOrderItem[];
    createdAt: string;
}

export function usePurchaseOrders(filters?: { supplierId?: string }) {
    const params = new URLSearchParams();
    if (filters?.supplierId) params.append("supplierId", filters.supplierId);

    return useQuery<PurchaseOrder[]>({
        queryKey: ["purchase-orders", filters],
        queryFn: async () => {
            const res = await fetch(`/api/purchase-orders?${params.toString()}`);
            if (!res.ok) throw new Error("Error al cargar órdenes de compra");
            return res.json();
        },
    });
}

export function useCreatePurchaseOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            supplierId?: string | null;
            autoGenerate?: boolean;
            repeatLast?: boolean;
            items?: { ingredientId: string; quantity: number; estimatedCost: number }[];
            notes?: string;
        }) => {
            const res = await fetch("/api/purchase-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al crear orden");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            queryClient.invalidateQueries({ queryKey: ["suppliers"] }); // To update counts if linked
            toast.success("Orden de compra creada exitosamente");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export function useUpdatePurchaseOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: "SENT" | "RECEIVED" | "CANCELLED" }) => {
            const res = await fetch(`/api/purchase-orders/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al actualizar estado");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
            queryClient.invalidateQueries({ queryKey: ["ingredients"] }); // To update stock if received
            toast.success("Estado actualizado exitosamente");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}
