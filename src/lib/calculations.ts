import { Decimal } from "@prisma/client/runtime/library";

/**
 * Convierte Decimal de Prisma a número para cálculos
 */
export function toNumber(value: Decimal | number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === "object" && typeof (value as any).toNumber === "function") {
        return (value as any).toNumber();
    }
    return 0;
}

/**
 * Formatea un número como moneda (RD$)
 */
export function formatCurrency(value: number | Decimal | string): string {
    const num = typeof value === "number" ? value : toNumber(value);
    return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
        minimumFractionDigits: 2,
    }).format(num);
}

/**
 * Formatea un número como porcentaje
 */
export function formatPercent(value: number): string {
    return new Intl.NumberFormat("es-DO", {
        style: "percent",
        minimumFractionDigits: 1,
    }).format(value / 100);
}

/**
 * Calcula el precio sugerido basado en costo y porcentaje de markup (de 0 a 200% o más)
 */
export function calculateSuggestedPrice(cost: number, marginPercent: number): number {
    return cost * (1 + marginPercent / 100);
}

/**
 * Calcula el margen real (markup) dado costo y precio
 */
export function calculateMargin(cost: number, price: number): number {
    if (cost === 0) return 0;
    return ((price - cost) / cost) * 100;
}

/**
 * Calcula el costo total de una receta
 */
export function calculateRecipeCost(
    ingredients: { quantity: number; avgCost: number; conversionFactor?: number }[]
): number {
    return ingredients.reduce((total, ing) => {
        const factor = ing.conversionFactor || 1;
        return total + ing.quantity * ing.avgCost * factor;
    }, 0);
}

/**
 * Determina el estado del semáforo de stock
 */
export function getStockStatus(
    current: number,
    min: number
): "critical" | "low" | "ok" {
    if (current <= 0) return "critical";
    if (current <= min) return "low";
    return "ok";
}

/**
 * Colores para los semáforos de stock
 */
export const stockStatusColors = {
    critical: {
        bg: "bg-red-500/10",
        text: "text-red-500",
        border: "border-red-500",
        badge: "bg-red-500",
    },
    low: {
        bg: "bg-yellow-500/10",
        text: "text-yellow-500",
        border: "border-yellow-500",
        badge: "bg-yellow-500",
    },
    ok: {
        bg: "bg-green-500/10",
        text: "text-green-500",
        border: "border-green-500",
        badge: "bg-green-500",
    },
};

/**
 * Formatea fecha en español
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("es-DO", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(d);
}

/**
 * Formatea solo la fecha sin hora
 */
export function formatDateShort(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("es-DO", {
        dateStyle: "short",
    }).format(d);
}
