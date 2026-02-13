"use client";

import { useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import {
    useIngredients,
    useCreateIngredient,
    useUpdateIngredient,
    useDeleteIngredient,
    useStockMovement,
    getStockStatus,
    type Ingredient,
} from "@/hooks/use-ingredients";
import { useDemo } from "@/hooks/use-demo";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/calculations";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    AlertTriangle,
    XCircle,
    Loader2,
    Filter,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// --- Configuration ---
const UNITS = [
    { value: "kg", label: "Kilogramos (kg)" },
    { value: "lb", label: "Libras (lb)" },
    { value: "lt", label: "Litros (lt)" },
    { value: "gal", label: "Galones (gal)" },
    { value: "unidad", label: "Unidades" },
    { value: "docena", label: "Docenas" },
    { value: "oz", label: "Onzas (oz)" },
    { value: "g", label: "Gramos (g)" },
];

const CATEGORIES = [
    "Proteínas", "Vegetales", "Lácteos", "Granos", "Especias", "Aceites", "Salsas", "Empaque", "Otros"
];

// --- Sub-components ---

function StockLevelBar({ current, min }: { current: number, min: number }) {
    const percentage = Math.min(100, Math.max(0, (current / (min * 3)) * 100)); // Arbitrary scale
    let colorClass = "bg-emerald-500";
    if (current <= min) colorClass = "bg-destructive";
    else if (current <= min * 1.5) colorClass = "bg-amber-500";

    return (
        <Progress value={percentage} className="h-2 w-24" indicatorClassName={colorClass} />
    );
}

function CreateIngredientDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const [formData, setFormData] = useState({
        name: "", unit: "kg", currentStock: "", minStock: "", avgCost: "", category: "",
    });

    const createMutation = useCreateIngredient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createMutation.mutateAsync({
            name: formData.name,
            unit: formData.unit,
            currentStock: parseFloat(formData.currentStock) || 0,
            minStock: parseFloat(formData.minStock) || 0,
            avgCost: parseFloat(formData.avgCost) || 0,
            category: formData.category || undefined,
        });
        onOpenChange(false);
        setFormData({ name: "", unit: "kg", currentStock: "", minStock: "", avgCost: "", category: "" });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Ingrediente</DialogTitle>
                    <DialogDescription>Agrega un item a tu inventario.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ej. Queso Mozzarella" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Unidad</Label>
                                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Stock Inicial</Label>
                                <Input type="number" step="0.01" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Mínimo</Label>
                                <Input type="number" step="0.01" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Costo Prom.</Label>
                                <Input type="number" step="0.01" value={formData.avgCost} onChange={(e) => setFormData({ ...formData, avgCost: e.target.value })} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={createMutation.isPending}>Guardar</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function StockAdjustmentDialog({ ingredient, open, onOpenChange }: { ingredient: Ingredient, open: boolean, onOpenChange: (Open: boolean) => void }) {
    const [type, setType] = useState<"IN" | "OUT">("IN");
    const [quantity, setQuantity] = useState("");
    const [notes, setNotes] = useState("");
    const stockMutation = useStockMovement();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await stockMutation.mutateAsync({
            ingredientId: ingredient.id,
            data: { type, quantity: parseFloat(quantity), reason: notes || undefined }
        });
        onOpenChange(false);
        setQuantity("");
        setNotes("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Ajuste Rápido de Stock</DialogTitle>
                    <DialogDescription>{ingredient.name} ({ingredient.unit})</DialogDescription>
                </DialogHeader>
                <Tabs value={type} onValueChange={(v) => setType(v as "IN" | "OUT")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="IN" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700">Entrada (+)</TabsTrigger>
                        <TabsTrigger value="OUT" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Salida (-)</TabsTrigger>
                    </TabsList>
                </Tabs>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label>Cantidad</Label>
                        <Input type="number" step="0.01" autoFocus value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="0.00" className="text-lg font-mono" />
                    </div>
                    <div className="space-y-2">
                        <Label>Nota (Opcional)</Label>
                        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Merma, Compra..." />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={stockMutation.isPending} className={cn("w-full", type === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}>
                            {stockMutation.isPending ? <Loader2 className="animate-spin" /> : "Confirmar Ajuste"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Page ---
export default function InventarioPage() {
    const { isDemo } = useDemo();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [createOpen, setCreateOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeCategory, setActiveCategory] = useState("all");
    const [adjustmentItem, setAdjustmentItem] = useState<Ingredient | null>(null);

    const { data: ingredients, isLoading } = useIngredients({ search: debouncedSearch });
    const deleteMutation = useDeleteIngredient();

    const filteredData = useMemo(() => {
        if (!ingredients) return [];
        return ingredients.filter(item => {
            const status = getStockStatus(Number(item.currentStock), Number(item.minStock));
            if (statusFilter !== "all" && status !== statusFilter) return false;
            if (activeCategory !== "all" && item.category !== activeCategory) return false;
            return true;
        });
    }, [ingredients, statusFilter, activeCategory]);

    const stats = useMemo(() => {
        if (!ingredients) return { total: 0, critical: 0, low: 0, ok: 0 };
        return {
            total: ingredients.length,
            critical: ingredients.filter(i => getStockStatus(Number(i.currentStock), Number(i.minStock)) === "critical").length,
            low: ingredients.filter(i => getStockStatus(Number(i.currentStock), Number(i.minStock)) === "low").length,
            ok: ingredients.filter(i => getStockStatus(Number(i.currentStock), Number(i.minStock)) === "ok").length,
        };
    }, [ingredients]);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Inventario</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                        <Package className="h-4 w-4" />
                        <p className="text-sm">Gestión de existencias • {stats.total} Items • {stats.critical} Críticos</p>
                    </div>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    disabled={isDemo}
                    className={cn("w-full sm:w-auto bg-salsa hover:bg-salsa/90 text-white shadow-md shadow-salsa/20 rounded-xl", isDemo && "opacity-50 cursor-not-allowed")}
                >
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Ingrediente
                </Button>
            </div>

            {/* Toolbar - Compact & Clean */}
            <div className="flex flex-col gap-4 bg-muted/20 p-2 lg:p-4 rounded-xl border border-border">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar ingredientes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-white border-border rounded-xl h-10 lg:h-11"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Categories */}
                    <div className="w-full overflow-x-auto pb-2 -mx-2 px-2 lg:mx-0 lg:px-0">
                        <div className="flex gap-2 min-w-max">
                            <button
                                onClick={() => setActiveCategory("all")}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all border",
                                    activeCategory === "all"
                                        ? "bg-foreground text-background border-foreground shadow-sm"
                                        : "bg-white text-muted-foreground border-border hover:bg-muted/50"
                                )}
                            >
                                Todas
                            </button>
                            {CATEGORIES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setActiveCategory(c)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all border",
                                        activeCategory === c
                                            ? "bg-foreground text-background border-foreground shadow-sm"
                                            : "bg-white text-muted-foreground border-border hover:bg-muted/50"
                                    )}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto shrink-0 max-w-full">
                        <TabsList className="bg-white border border-border p-1 h-auto rounded-xl flex w-full sm:w-auto">
                            <TabsTrigger value="all" className="flex-1 text-xs h-8 px-3 rounded-lg">Todos</TabsTrigger>
                            <TabsTrigger value="critical" className="flex-1 text-xs text-red-600 h-8 px-3 rounded-lg bg-red-50/50 data-[state=active]:bg-red-100 data-[state=active]:text-red-700">Críticos</TabsTrigger>
                            <TabsTrigger value="low" className="flex-1 text-xs text-amber-600 h-8 px-3 rounded-lg bg-amber-50/50 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">Bajos</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <CreateIngredientDialog open={createOpen} onOpenChange={setCreateOpen} />

            {/* Main Data Table */}
            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-4 h-10">Ingrediente</TableHead>
                            <TableHead className="h-10">Stock</TableHead>
                            <TableHead className="text-right h-10">Costo</TableHead>
                            <TableHead className="text-center h-10">Estado</TableHead>
                            <TableHead className="w-[50px] h-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></TableCell>
                            </TableRow>
                        ) : filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No se encontraron ingredientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => {
                                const status = getStockStatus(Number(item.currentStock), Number(item.minStock));
                                return (
                                    <TableRow key={item.id} className="hover:bg-muted/50">
                                        <TableCell className="pl-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.name}</span>
                                                <Badge variant="secondary" className="w-fit font-normal text-[10px] mt-0.5 px-1.5 h-5">
                                                    {item.category || "General"}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex flex-col gap-1 max-w-[140px]">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-sm font-medium font-mono">
                                                        {Number(item.currentStock).toFixed(2)} <span className="text-xs text-muted-foreground pb-0.5">{item.unit}</span>
                                                    </span>
                                                </div>
                                                <StockLevelBar current={Number(item.currentStock)} min={Number(item.minStock)} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm py-3">
                                            {formatCurrency(Number(item.avgCost))}
                                        </TableCell>
                                        <TableCell className="text-center py-3">
                                            {status === "critical" && <Badge variant="destructive" className="h-5 px-2 text-[10px]">Crítico</Badge>}
                                            {status === "low" && <Badge className="bg-amber-100 text-amber-800 border-amber-200 h-5 px-2 text-[10px] hover:bg-amber-100">Bajo</Badge>}
                                            {status === "ok" && <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 h-5 px-2 text-[10px]">Normal</Badge>}
                                        </TableCell>
                                        <TableCell className="text-right pr-4 py-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDemo}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setAdjustmentItem(item)}>
                                                        <Package className="mr-2 h-3.5 w-3.5" /> Ajustar Stock
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {/* Future: Edit/Delete */}
                                                    <DropdownMenuItem className="text-destructive" onClick={() => {
                                                        if (confirm("¿Eliminar ingrediente?")) deleteMutation.mutate(item.id);
                                                    }}>
                                                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Adjust Dialog */}
            {adjustmentItem && (
                <StockAdjustmentDialog
                    ingredient={adjustmentItem}
                    open={!!adjustmentItem}
                    onOpenChange={(v) => !v && setAdjustmentItem(null)}
                />
            )}
        </div>

    );
}
