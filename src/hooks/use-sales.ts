import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Product interface moved to use-products.ts

export interface SaleItem {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product?: {
        id: string;
        name: string;
    };
}

export interface Sale {
    id: string;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    customerName: string | null;
    cashRegisterId: string | null;
    items: SaleItem[];
    createdAt: string;
}

export interface CashRegister {
    id: string;
    openedAt: string;
    closedAt: string | null;
    openingBalance: number;
    closingBalance: number | null;
    // openedBy: string; // Not in schema
    // closedBy: string | null; // Not in schema
    notes: string | null;
}

// Products hook moved to use-products.ts

// Sales
export function useSales(filters?: { today?: boolean; registerId?: string }) {
    const params = new URLSearchParams();
    if (filters?.today) params.append("today", "true");
    if (filters?.registerId) params.append("registerId", filters.registerId);

    return useQuery<Sale[]>({
        queryKey: ["sales", filters],
        queryFn: async () => {
            const res = await fetch(`/api/sales?${params.toString()}`);
            if (!res.ok) throw new Error("Error al cargar ventas");
            return res.json();
        },
    });
}

export function useCreateSale() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            items: { productId: string; quantity: number; unitPrice: number }[];
            discount?: number;
            paymentMethod?: string;
            customerName?: string;
            cashRegisterId?: string;
        }) => {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Error al crear venta");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.invalidateQueries({ queryKey: ["cash-register"] });
            toast.success("Venta registrada exitosamente");
        },
        onError: () => {
            toast.error("Error al registrar venta");
        },
    });
}

// Cash Register
export function useCashRegister() {
    return useQuery<{ current: CashRegister | null; today: CashRegister[] }>({
        queryKey: ["cash-register"],
        queryFn: async () => {
            const res = await fetch("/api/cash-register");
            if (!res.ok) throw new Error("Error al cargar caja");
            return res.json();
        },
    });
}

export function useOpenCashRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { openingBalance: number; openedBy?: string }) => {
            const res = await fetch("/api/cash-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al abrir caja");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cash-register"] });
            toast.success("Caja abierta");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}

export function useCloseCashRegister() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            id: string;
            actualCash: number;
            closedBy?: string;
            notes?: string;
        }) => {
            const res = await fetch(`/api/cash-register/${data.id}/close`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Error al cerrar caja");
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["cash-register"] });
            queryClient.invalidateQueries({ queryKey: ["sales"] });
            const diff = data.summary.difference;
            if (diff === 0) {
                toast.success("Caja cerrada - Cuadre perfecto ✓");
            } else if (diff > 0) {
                toast.success(`Caja cerrada - Sobrante: RD$${diff.toFixed(2)}`);
            } else {
                toast.warning(`Caja cerrada - Faltante: RD$${Math.abs(diff).toFixed(2)}`);
            }
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });
}
