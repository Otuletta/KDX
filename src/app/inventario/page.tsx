"use client";

import { useState, useMemo } from "react";
import {
    useIngredients,
    useCreateIngredient,
    useUpdateIngredient,
    useDeleteIngredient,
    useStockMovement,
    useIngredientMovements,
    getStockStatus,
    type Ingredient,
} from "@/hooks/use-ingredients";
import { useUpdateProduct, type Product } from "@/hooks/use-products";
import { useProducts } from "@/hooks/use-products";
import { useDemo } from "@/hooks/use-demo";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCurrency } from "@/lib/calculations";
import {
    Plus,
    MoreHorizontal,
    Trash2,
    Loader2,
    Package,
    History,
    Activity,
    ArrowDownToLine,
    ArrowUpFromLine,
    Utensils,
    PackageSearch,
    Pencil,
    ChevronDown,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

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

type InventoryItem = Ingredient | Product;

function StockLevelBar({ current, min, status }: { current: number, min: number, status: string }) {
    const maxScale = min > 0 ? min * 3 : 15;
    const percentage = Math.min(100, Math.max(0, (current / maxScale) * 100));

    let colorClass = "bg-emerald-500";
    if (status === "critical") colorClass = "bg-red-500";
    else if (status === "low") colorClass = "bg-amber-500";

    return (
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
            <div className={cn("h-full transition-all duration-700 ease-out", colorClass)} style={{ width: `${percentage}%` }} />
        </div>
    );
}

function CreateIngredientDialog({ open, onOpenChange, existingCategories }: { open: boolean, onOpenChange: (open: boolean) => void, existingCategories: string[] }) {
    const [isNewCategory, setIsNewCategory] = useState(false);
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
        setIsNewCategory(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-8 gap-8 bg-white border border-slate-200 rounded-[32px] shadow-2xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-black tracking-tight text-[#1e3a5f]">REGISTRAR INSUMO</DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Añada materiales de producción al inventario maestro.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Material</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="EJ. QUESO MOZZARELLA" className="h-12 rounded-xl border border-slate-200 bg-slate-50 font-black text-[#1e3a5f]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</Label>
                            {isNewCategory ? (
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                        placeholder="Nueva..."
                                        className="h-12 rounded-xl border border-slate-200 font-black text-[#1e3a5f] flex-1"
                                        autoFocus
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={() => setIsNewCategory(false)} className="h-12 w-12 rounded-xl border-slate-200">×</Button>
                                </div>
                            ) : (
                                <Select value={formData.category} onValueChange={(v) => v === "NEW" ? setIsNewCategory(true) : setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="h-12 rounded-xl border border-slate-200 text-[#1e3a5f] font-black">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {existingCategories.map(c => <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>)}
                                        {existingCategories.length > 0 && <SelectSeparator />}
                                        <SelectItem value="NEW" className="text-indigo-600 font-bold text-xs">+ Crear Nueva</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad</Label>
                            <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                                <SelectTrigger className="h-12 rounded-xl border border-slate-200 text-[#1e3a5f] font-black">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {UNITS.map(u => <SelectItem key={u.value} value={u.value} className="font-bold text-xs">{u.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Stock Inicial</Label>
                            <Input type="number" step="0.01" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })} placeholder="0.00" className="h-10 rounded-lg border border-slate-200 text-center font-black" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Mínimo</Label>
                            <Input type="number" step="0.01" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} placeholder="0.00" className="h-10 rounded-lg border border-slate-200 text-center font-black" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Costo Prom.</Label>
                            <Input type="number" step="0.01" value={formData.avgCost} onChange={(e) => setFormData({ ...formData, avgCost: e.target.value })} placeholder="0.00" className="h-10 rounded-lg border border-slate-200 text-center font-black text-emerald-600" />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="h-12 px-6 font-black text-[10px] uppercase tracking-widest text-slate-500 rounded-xl">Cancelar</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="h-12 flex-1 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 rounded-xl">
                            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Registrar Insumo
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditInventoryItemDialog({
    item,
    isIngredient,
    open,
    onOpenChange,
    existingCategories,
}: {
    item: InventoryItem;
    isIngredient: boolean;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existingCategories: string[];
}) {
    const ingredient = isIngredient ? item as Ingredient : null;
    const product = !isIngredient ? item as Product : null;
    const updateIngredient = useUpdateIngredient();
    const updateProduct = useUpdateProduct();
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [formData, setFormData] = useState({
        name: item.name || "",
        unit: ingredient?.unit || "unidad",
        currentStock: String(item.currentStock ?? 0),
        minStock: ingredient ? String(ingredient.minStock ?? 0) : "0",
        avgCost: ingredient ? String(ingredient.avgCost ?? 0) : "0",
        sellingPrice: product ? String(product.sellingPrice ?? 0) : "0",
        category: item.category || "",
        sku: product?.sku || "",
    });

    const isLoading = updateIngredient.isPending || updateProduct.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isIngredient) {
            await updateIngredient.mutateAsync({
                id: item.id,
                data: {
                    name: formData.name,
                    unit: formData.unit,
                    currentStock: parseFloat(formData.currentStock) || 0,
                    minStock: parseFloat(formData.minStock) || 0,
                    avgCost: parseFloat(formData.avgCost) || 0,
                    category: formData.category || undefined,
                },
            });
        } else {
            await updateProduct.mutateAsync({
                id: item.id,
                data: {
                    name: formData.name,
                    currentStock: parseFloat(formData.currentStock) || 0,
                    sellingPrice: parseFloat(formData.sellingPrice) || 0,
                    category: formData.category || undefined,
                    sku: formData.sku || undefined,
                },
            });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-8 gap-8 bg-white border border-slate-200 rounded-[32px] shadow-2xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-black tracking-tight text-[#1e3a5f]">
                        {isIngredient ? "EDITAR INSUMO" : "EDITAR PRODUCTO"}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Actualizar ficha de inventario.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-12 rounded-xl border border-slate-200 bg-slate-50 font-black text-[#1e3a5f]" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria</Label>
                            {isNewCategory ? (
                                <div className="flex gap-2">
                                    <Input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required placeholder="Nueva..." className="h-12 rounded-xl border border-slate-200 font-black text-[#1e3a5f] flex-1" autoFocus />
                                    <Button type="button" variant="outline" size="icon" onClick={() => setIsNewCategory(false)} className="h-12 w-12 rounded-xl border-slate-200">x</Button>
                                </div>
                            ) : (
                                <Select value={formData.category} onValueChange={(v) => v === "NEW" ? setIsNewCategory(true) : setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="h-12 rounded-xl border border-slate-200 text-[#1e3a5f] font-black">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent className="z-[90] rounded-xl border border-slate-200 bg-white p-2 text-[#1e3a5f] shadow-[0_18px_50px_rgba(30,58,95,0.18)]">
                                        {existingCategories.map(c => <SelectItem key={c} value={c} className="rounded-lg font-bold text-xs focus:bg-slate-100 focus:text-[#1e3a5f]">{c}</SelectItem>)}
                                        {existingCategories.length > 0 && <SelectSeparator className="bg-slate-100" />}
                                        <SelectItem value="NEW" className="rounded-lg text-indigo-600 font-bold text-xs focus:bg-indigo-50 focus:text-indigo-600">+ Crear Nueva</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {isIngredient ? (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unidad</Label>
                                <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                                    <SelectTrigger className="h-12 rounded-xl border border-slate-200 text-[#1e3a5f] font-black">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="z-[90] rounded-xl border border-slate-200 bg-white p-2 text-[#1e3a5f] shadow-[0_18px_50px_rgba(30,58,95,0.18)]">
                                        {UNITS.map(u => <SelectItem key={u.value} value={u.value} className="rounded-lg font-bold text-xs focus:bg-slate-100 focus:text-[#1e3a5f]">{u.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU</Label>
                                <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })} placeholder="AUTO" className="h-12 rounded-xl border border-slate-200 font-black uppercase text-[#1e3a5f]" />
                            </div>
                        )}
                    </div>

                    <div className={cn("grid gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100", isIngredient ? "grid-cols-3" : "grid-cols-2")}>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Stock</Label>
                            <Input type="number" step="0.01" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })} className="h-10 rounded-lg border border-slate-200 text-center font-black" />
                        </div>
                        {isIngredient ? (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Minimo</Label>
                                    <Input type="number" step="0.01" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} className="h-10 rounded-lg border border-slate-200 text-center font-black" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Costo</Label>
                                    <Input type="number" step="0.01" value={formData.avgCost} onChange={(e) => setFormData({ ...formData, avgCost: e.target.value })} className="h-10 rounded-lg border border-slate-200 text-center font-black text-emerald-600" />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center block">Precio</Label>
                                <Input type="number" step="0.01" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })} className="h-10 rounded-lg border border-emerald-200 text-center font-black text-emerald-600" />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-3">
                        <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} className="h-12 px-6 font-black text-[10px] uppercase tracking-widest text-slate-500 rounded-xl">Cancelar</Button>
                        <Button type="submit" disabled={isLoading} className="h-12 flex-1 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 rounded-xl">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />} Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function StockAdjustmentDialog({ ingredient, open, onOpenChange }: { ingredient: Ingredient, open: boolean, onOpenChange: (open: boolean) => void }) {
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
            <DialogContent className="sm:max-w-[420px] p-8 gap-8 bg-white border border-slate-200 rounded-[32px] shadow-2xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-black tracking-tight text-[#1e3a5f]">AJUSTE DE KARDEX</DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Actualizar disponibilidad para <span className="text-slate-900 font-bold">{ingredient.name}</span>.</DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <button type="button" onClick={() => setType("IN")} className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", type === "IN" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
                        <ArrowDownToLine className="w-4 h-4" /> Entrada
                    </button>
                    <button type="button" onClick={() => setType("OUT")} className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", type === "OUT" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
                        <ArrowUpFromLine className="w-4 h-4" /> Salida
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Cantidad en {ingredient.unit}</Label>
                        <Input type="number" step="0.01" autoFocus value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="0.00" className={cn("h-20 text-[40px] font-black text-center border bg-slate-50 focus-visible:ring-0 rounded-[20px]", type === "IN" ? "text-emerald-600 border-emerald-100" : "text-red-600 border-red-100")} />
                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Stock Actual: <span className="text-slate-900 font-black">{Number(ingredient.currentStock).toFixed(2)}</span></p>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Concepto o Razón</Label>
                        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Compra directa, Merma..." className="h-12 rounded-xl border-slate-200 font-bold" />
                    </div>
                    <Button type="submit" disabled={stockMutation.isPending || !quantity} className={cn("w-full h-14 font-black text-xs uppercase tracking-widest text-white shadow-sm transition-all rounded-xl", type === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
                        {stockMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />} Confirmar Ajuste
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ProductStockAdjustmentDialog({ product, open, onOpenChange }: { product: Product, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [type, setType] = useState<"IN" | "OUT">("IN");
    const [quantity, setQuantity] = useState("");
    const updateProduct = useUpdateProduct();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) return;
        const newStock = type === "IN" ? Number(product.currentStock) + qty : Number(product.currentStock) - qty;
        await updateProduct.mutateAsync({ id: product.id, data: { currentStock: Math.max(0, newStock) } });
        onOpenChange(false);
        setQuantity("");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-8 gap-8 bg-white border border-slate-200 rounded-[32px] shadow-2xl">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-black tracking-tight text-[#1e3a5f]">STOCK DE PRODUCTO</DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ajuste de inventario para <span className="text-slate-900 font-bold">{product.name}</span>.</DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    <button type="button" onClick={() => setType("IN")} className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", type === "IN" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
                        <ArrowDownToLine className="w-4 h-4" /> Entrada
                    </button>
                    <button type="button" onClick={() => setType("OUT")} className={cn("flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", type === "OUT" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
                        <ArrowUpFromLine className="w-4 h-4" /> Salida
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Unidades a procesar</Label>
                        <Input type="number" step="1" autoFocus value={quantity} onChange={(e) => setQuantity(e.target.value)} required placeholder="0" className={cn("h-20 text-[40px] font-black text-center border bg-slate-50 focus-visible:ring-0 rounded-[20px]", type === "IN" ? "text-emerald-600 border-emerald-100" : "text-red-600 border-red-100")} />
                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Existencia: <span className="text-slate-900 font-black">{Number(product.currentStock)}</span></p>
                    </div>
                    <Button type="submit" disabled={updateProduct.isPending || !quantity} className={cn("w-full h-14 font-black text-xs uppercase tracking-widest text-white shadow-sm transition-all rounded-xl", type === "IN" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700")}>
                        {updateProduct.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} Actualizar Stock
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function StockMovementsDialog({ ingredient, open, onOpenChange }: { ingredient: Ingredient, open: boolean, onOpenChange: (open: boolean) => void }) {
    const { data: movements, isLoading } = useIngredientMovements(ingredient.id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] p-0 bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl">
                <div className="p-8 space-y-6">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-black tracking-tight text-[#1e3a5f]">HISTORIAL KARDEX</DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">{ingredient.name} — Trazabilidad de movimientos.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin text-slate-400 w-6 h-6" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Cargando registros...</p>
                        </div>
                    ) : !movements?.length ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Activity className="w-8 h-8 text-slate-300 mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sin movimientos registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {movements.map((mov) => {
                                const isEntry = mov.type === "IN";
                                return (
                                    <div key={mov.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[20px] hover:border-slate-200 transition-all gap-4">
                                        <div className="flex gap-4 items-center min-w-0">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", isEntry ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                                                {isEntry ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("font-black text-[14px]", isEntry ? "text-emerald-700" : "text-red-700")}>
                                                        {isEntry ? "+" : "-"}{Number(mov.quantity).toFixed(2)} {ingredient.unit}
                                                    </span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 rounded-md">
                                                        {isEntry ? "Entrada" : "Salida"}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] font-bold text-slate-500 truncate mt-1">{mov.reason || "Ajuste Operativo"}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] font-black text-[#1e3a5f]">{new Date(mov.createdAt).toLocaleDateString("es-DO", { dateStyle: "short" })}</p>
                                            <p className="text-[9px] font-bold text-slate-400">{new Date(mov.createdAt).toLocaleTimeString("es-DO", { timeStyle: "short" })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                <div className="pt-4 border-t border-slate-100">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-12 font-black text-[10px] uppercase tracking-widest text-[#1e3a5f] rounded-xl hover:bg-slate-100">Cerrar</Button>
                </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function InventarioListItem({
    item,
    isIngredient,
    onAdjust,
    onHistory,
    onEdit,
    onDelete
}: {
    item: InventoryItem;
    isIngredient: boolean;
    onAdjust?: (item: InventoryItem) => void;
    onHistory?: (item: InventoryItem) => void;
    onEdit?: (item: InventoryItem) => void;
    onDelete?: (item: InventoryItem) => void;
}) {
    const ingredient = isIngredient ? item as Ingredient : null;
    const product = !isIngredient ? item as Product : null;
    const status = isIngredient
        ? getStockStatus(Number(item.currentStock), Number(ingredient?.minStock))
        : (Number(item.currentStock) <= 0 ? "critical" : Number(item.currentStock) <= 5 ? "low" : "ok");

    const categoryText = item.category || (isIngredient ? "GENERAL" : "VENTA");
    const formattedCost = formatCurrency(Number(isIngredient ? ingredient?.avgCost : product?.sellingPrice));

    return (
        <div className="group flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-white border border-slate-200 rounded-[24px] hover:shadow-lg transition-all mb-4">
            {/* Info Name-Cat */}
            <div className="flex items-center gap-6 md:w-[35%] min-w-0">
                <div className={cn("w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 transition-colors bg-slate-50 border border-slate-100", isIngredient ? "text-slate-400" : "text-amber-400")}>
                    {isIngredient ? <Utensils className="w-8 h-8" /> : <Package className="w-8 h-8" />}
                </div>
                <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate block mb-1">{categoryText}</span>
                    <h3 className="font-black text-[16px] text-[#1e3a5f] tracking-tight truncate pr-4 leading-tight">{item.name}</h3>
                </div>
            </div>

            {/* Stock Level Bar & Value */}
            <div className="md:w-[35%] flex flex-col gap-2">
                <div className="flex items-baseline gap-1.5">
                    <span className={cn("font-black text-[22px] tracking-tighter", status === "critical" ? "text-red-500" : status === "low" ? "text-amber-500" : "text-[#1e3a5f]")}>
                        {Number(item.currentStock).toFixed(2)}
                    </span>
                    <span className="text-[12px] font-black text-slate-400 uppercase">{isIngredient ? ingredient?.unit : "und"}</span>
                </div>
                <StockLevelBar current={Number(item.currentStock)} min={isIngredient ? Number(ingredient?.minStock) : 5} status={status} />
            </div>

            {/* Price/Cost, Actions Wrapper */}
            <div className="md:w-[25%] flex items-center justify-between gap-4">
                 {/* Price/Cost */}
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">{isIngredient ? "Costo" : "Precio"}</span>
                    <span className={cn("font-black text-[16px]", isIngredient ? "text-emerald-500" : "text-[#1e3a5f]")}>RD${formattedCost}</span>
                </div>

                {/* Actions Menu */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onAdjust && onAdjust(item)} className="h-10 px-4 rounded-full text-[10px] font-black bg-white border border-slate-200 hover:bg-slate-50 hover:text-[#1e3a5f] text-slate-500 uppercase tracking-widest hidden lg:flex">
                        AJUSTAR
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border border-slate-200 hover:bg-slate-50 transition-all bg-white">
                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-slate-100 shadow-xl bg-white">
                            <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-2">Opciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onHistory && onHistory(item)} className="rounded-xl cursor-pointer py-3 px-3 text-[11px] font-bold text-[#1e3a5f] focus:bg-slate-50 transition-colors uppercase tracking-wider">
                                <History className="w-4 h-4 mr-3 text-slate-400" /> Kardex
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAdjust && onAdjust(item)} className="lg:hidden rounded-xl cursor-pointer py-3 px-3 text-[11px] font-bold text-[#1e3a5f] focus:bg-slate-50 transition-colors uppercase tracking-wider">
                                <Activity className="w-4 h-4 mr-3 text-emerald-500" /> Ajustar Inventario
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit && onEdit(item)} className="rounded-xl cursor-pointer py-3 px-3 text-[11px] font-bold text-[#1e3a5f] focus:bg-slate-50 transition-colors uppercase tracking-wider">
                                <Pencil className="w-4 h-4 mr-3 text-slate-400" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-100 mx-2 my-1" />
                            <DropdownMenuItem onClick={() => onDelete && onDelete(item)} className="text-red-600 rounded-xl cursor-pointer py-3 px-3 text-[11px] font-bold focus:bg-red-50 focus:text-red-700 transition-all uppercase tracking-wider">
                                <Trash2 className="w-4 h-4 mr-3" /> Eliminar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

export default function InventarioPage() {
    const { isDemo } = useDemo();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500);
    const [createOpen, setCreateOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [activeCategory, setActiveCategory] = useState("all");
    const [adjustmentItem, setAdjustmentItem] = useState<Ingredient | null>(null);
    const [productAdjustmentItem, setProductAdjustmentItem] = useState<Product | null>(null);
    const [movementsItem, setMovementsItem] = useState<Ingredient | null>(null);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [editItemIsIngredient, setEditItemIsIngredient] = useState(true);
    const [viewTab] = useState<"ingredients" | "products">("ingredients");

    const { data: ingredients, isLoading: loadingIng } = useIngredients({ search: debouncedSearch });
    const { data: products, isLoading: loadingProd } = useProducts({ search: debouncedSearch });
    const deleteMutation = useDeleteIngredient();

    const filteredData = useMemo(() => {
        if (viewTab === "ingredients") {
            if (!ingredients) return [];
            return ingredients.filter(item => {
                const status = getStockStatus(Number(item.currentStock), Number(item.minStock));
                if (statusFilter !== "all" && status !== statusFilter) return false;
                if (activeCategory !== "all" && item.category !== activeCategory) return false;
                return true;
            });
        } else {
            if (!products) return [];
            return products.filter(item => {
                const status = Number(item.currentStock) <= 0 ? "critical" : Number(item.currentStock) <= 5 ? "low" : "ok";
                if (statusFilter !== "all" && status !== statusFilter) return false;
                if (activeCategory !== "all" && item.category !== activeCategory) return false;
                return true;
            });
        }
    }, [ingredients, products, viewTab, statusFilter, activeCategory]);

    const dynamicCats = useMemo(() => {
        const cats = new Set<string>();
        if (viewTab === "ingredients" && ingredients) {
            ingredients.forEach(i => { if (i.category) cats.add(i.category); });
        } else if (viewTab === "products" && products) {
            products.forEach(p => { if (p.category) cats.add(p.category); });
        }
        return Array.from(cats).sort();
    }, [viewTab, ingredients, products]);

    const stats = useMemo(() => {
        if (viewTab === "ingredients") {
            if (!ingredients) return { total: 0, critical: 0, low: 0, ok: 0, totalVal: 0 };
            return {
                total: ingredients.length,
                critical: ingredients.filter(i => getStockStatus(Number(i.currentStock), Number(i.minStock)) === "critical").length,
                low: ingredients.filter(i => getStockStatus(Number(i.currentStock), Number(i.minStock)) === "low").length,
                ok: ingredients.filter(i => getStockStatus(Number(i.currentStock), Number(i.minStock)) === "ok").length,
                totalVal: ingredients.reduce((sum, i) => sum + (Number(i.currentStock) * Number(i.avgCost)), 0)
            };
        } else {
            if (!products) return { total: 0, critical: 0, low: 0, ok: 0, totalVal: 0 };
            return {
                total: products.length,
                critical: products.filter(i => Number(i.currentStock) <= 0).length,
                low: products.filter(i => Number(i.currentStock) > 0 && Number(i.currentStock) <= 5).length,
                ok: products.filter(i => Number(i.currentStock) > 5).length,
                totalVal: products.reduce((sum, p) => sum + (Number(p.currentStock) * Number(p.sellingPrice)), 0)
            };
        }
    }, [ingredients, products, viewTab]);

    const isLoading = viewTab === "ingredients" ? loadingIng : loadingProd;

    return (
        <div className="space-y-12 font-sans bg-[#eef1f5] min-h-screen px-4 md:px-8 py-8 animate-enter">
            {/* 1. Page Header Card (Inventario) */}
            <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-end justify-between gap-6 relative overflow-hidden mb-8">
                 <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400" />
                 
                 <div className="relative z-10 flex flex-col pt-1">
                     <h1 className="text-[32px] font-black text-[#1e3a5f] tracking-tight uppercase leading-none mb-3">INVENTARIO</h1>
                     <p className="text-[13px] font-bold text-slate-400 tracking-wide">Control de Stock y Materia Prima</p>
                 </div>
                 
                 <div className="relative z-10 flex items-center gap-4">
                     <Button onClick={() => setCreateOpen(true)} disabled={isDemo} className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white rounded-xl h-12 px-8 font-black uppercase text-[11px] tracking-widest shadow-[0_4px_14px_0_rgba(30,58,95,0.39)] hover:shadow-[0_6px_20px_rgba(30,58,95,0.23)] hover:-translate-y-0.5 transition-all duration-200 shrink-0">
                         <Plus className="w-4 h-4 mr-2" /> Nuevo Insumo
                     </Button>
                 </div>
            </div>

            {/* 2. Big KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 {/* Inventario Total */}
                 <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-[6px] bg-[#1e3a5f] transition-transform group-hover:scale-105" />
                     <div className="flex items-center justify-between mt-2 mb-6">
                          <span className="text-[12px] font-black text-[#1e3a5f] uppercase tracking-widest">Inventario Total</span>
                          <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                               <Package className="w-5 h-5 text-[#1e3a5f]" />
                          </div>
                     </div>
                     <div>
                         <p className="text-[42px] font-black text-[#1e3a5f] leading-none mb-3">{stats.total}</p>
                         <div className="flex items-center gap-2">
                             <div className="h-[3px] w-8 bg-[#1e3a5f] rounded-full" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ÍTEMS REGISTRADOS</span>
                         </div>
                     </div>
                 </div>

                 {/* Estado Crítico */}
                 <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-[6px] bg-rose-500 transition-transform group-hover:scale-105" />
                     <div className="flex items-center justify-between mt-2 mb-6">
                          <span className="text-[12px] font-black text-[#1e3a5f] uppercase tracking-widest">Estado Crítico</span>
                          <div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                               <span className="font-black w-5 h-5 rounded-full border-2 border-rose-500 text-rose-500 flex items-center justify-center text-[10px]">!</span>
                          </div>
                     </div>
                     <div>
                         <p className="text-[42px] font-black text-rose-500 leading-none mb-3">{stats.critical}</p>
                         <div className="flex items-center gap-2">
                             <div className="h-[3px] w-8 bg-rose-500 rounded-full" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ÍTEMS BAJO STOCK MÍNIMO</span>
                         </div>
                     </div>
                 </div>

                 {/* Valorización Neto */}
                 <div className="flex flex-col bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 relative group transition-all hover:shadow-md overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-[6px] bg-emerald-500 transition-transform group-hover:scale-105" />
                     <div className="flex items-center justify-between mt-2 mb-6">
                          <span className="text-[12px] font-black text-[#1e3a5f] uppercase tracking-widest">Valorización Neta</span>
                          <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                               <TrendingUp className="w-5 h-5 text-emerald-500" />
                          </div>
                     </div>
                     <div>
                         <p className="text-[32px] font-black text-emerald-500 tracking-tighter leading-none mb-3">{formatCurrency(stats.totalVal)}</p>
                         <div className="flex items-center gap-2">
                             <div className="h-[3px] w-8 bg-emerald-500 rounded-full" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CAPITAL INMOVILIZADO</span>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Search & Dynamic Filters bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                    <button onClick={() => setStatusFilter("all")} className={cn("px-6 h-10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all", statusFilter === "all" ? "bg-white text-[#1e3a5f] shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-900")}>Todos</button>
                    <button onClick={() => setStatusFilter("critical")} className={cn("px-6 h-10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all", statusFilter === "critical" ? "bg-white text-red-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-red-600")}>Agotados</button>
                    <button onClick={() => setStatusFilter("low")} className={cn("px-6 h-10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all", statusFilter === "low" ? "bg-white text-amber-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-amber-600")}>Alarma</button>
                    
                    {dynamicCats.length > 0 && (
                        <div className="flex items-center gap-3 ml-2 border-l border-slate-200 pl-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-10 px-0 hover:bg-transparent text-[11px] font-black text-slate-500 uppercase tracking-widest group">
                                        {activeCategory === "all" ? "Filtrar por Categoría" : activeCategory}
                                        <ChevronDown className="w-4 h-4 ml-2 group-hover:rotate-180 transition-transform" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 p-2 rounded-2xl border-slate-100 shadow-xl bg-white">
                                    <DropdownMenuLabel className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-3 py-3">Maestro Categorías</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setActiveCategory("all")} className="rounded-xl cursor-pointer py-3 px-3 text-[11px] font-bold uppercase transition-all focus:bg-slate-50">Todas</DropdownMenuItem>
                                    {dynamicCats.map(cat => (
                                        <DropdownMenuItem key={cat} onClick={() => setActiveCategory(cat)} className="rounded-xl cursor-pointer py-3 px-3 text-[11px] font-bold uppercase transition-all focus:bg-slate-50">{cat}</DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                <div className="relative w-full lg:w-96">
                    <Input
                        placeholder="Buscar en el catálogo maestro..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 pl-6 rounded-full border-slate-200 bg-white shadow-sm focus-visible:ring-0 text-[11px] font-bold placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Main Content List */}
            <div className="space-y-4 pb-24">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <PackageSearch className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-black text-slate-500">Sin Coincidencias</h3>
                    </div>
                ) : (
                    filteredData.map((item, idx) => (
                        <div key={item.id} className={cn("animate-enter", idx < 10 ? `animate-stagger-${(idx % 4) + 1}` : "")}>
                            <InventarioListItem
                                item={item}
                                isIngredient={viewTab === "ingredients"}
                                onAdjust={(i) => viewTab === "ingredients" ? setAdjustmentItem(i as Ingredient) : setProductAdjustmentItem(i as Product)}
                                onHistory={(i) => viewTab === "ingredients" && setMovementsItem(i as Ingredient)}
                                onEdit={(i) => {
                                    setEditItem(i);
                                    setEditItemIsIngredient(viewTab === "ingredients");
                                }}
                                onDelete={(i) => {
                                    if (confirm(`¿ELIMINAR ${i.name.toUpperCase()} DEL INVENTARIO?`)) deleteMutation.mutate(i.id);
                                }}
                            />
                        </div>
                    ))
                )}
            </div>

            <CreateIngredientDialog open={createOpen} onOpenChange={setCreateOpen} existingCategories={dynamicCats} />
            {adjustmentItem && (
                <StockAdjustmentDialog ingredient={adjustmentItem!} open={!!adjustmentItem} onOpenChange={(v) => !v && setAdjustmentItem(null)} />
            )}
            {productAdjustmentItem && (
                <ProductStockAdjustmentDialog product={productAdjustmentItem!} open={!!productAdjustmentItem} onOpenChange={(v) => !v && setProductAdjustmentItem(null)} />
            )}
            {editItem && (
                <EditInventoryItemDialog
                    item={editItem}
                    isIngredient={editItemIsIngredient}
                    open={!!editItem}
                    onOpenChange={(v) => !v && setEditItem(null)}
                    existingCategories={dynamicCats}
                />
            )}
            {movementsItem && (
                <StockMovementsDialog ingredient={movementsItem!} open={!!movementsItem} onOpenChange={(v) => !v && setMovementsItem(null)} />
            )}
        </div>
    );
}
