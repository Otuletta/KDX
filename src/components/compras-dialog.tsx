"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, X, Loader2, ShoppingCart, Info } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import { useSuppliers, useCreateSupplier } from "@/hooks/use-suppliers";
import { useIngredients, useCreateIngredient } from "@/hooks/use-ingredients";
import {
    useCreatePurchaseOrder,
    useUpdatePurchaseOrderStatus,
} from "@/hooks/use-purchase-orders";
import { useDemo } from "@/hooks/use-demo";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface ItemRow {
    id: string; // temp id
    isNew: boolean;
    ingredientId: string;
    newName: string;
    newUnit: string;
    newMinStock: string;
    quantity: string;
    cost: string; // en moneda de la transacción
}

export function ComprasDialog({
    defaultSupplierId,
    open: externalOpen,
    onOpenChange: externalOnOpenChange,
}: {
    defaultSupplierId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
} = {}) {
    const { isDemo } = useDemo();
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen;

    const { data: suppliers } = useSuppliers();
    const { data: ingredients } = useIngredients();

    const createSupplier = useCreateSupplier();
    const createIngredient = useCreateIngredient();
    const createPurchaseOrder = useCreatePurchaseOrder();
    const updateOrderStatus = useUpdatePurchaseOrderStatus();

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Supplier State
    const [supplierMode, setSupplierMode] = useState<"existing" | "new" | "onetime">("existing");
    const [selectedSupplierId, setSelectedSupplierId] = useState("");

    useEffect(() => {
        if (open && defaultSupplierId) {
            setSupplierMode("existing");
            setSelectedSupplierId(defaultSupplierId);
        }
    }, [open, defaultSupplierId]);
    const [newSupplierName, setNewSupplierName] = useState("");
    const [newSupplierPhone, setNewSupplierPhone] = useState("");
    const [newSupplierEmail, setNewSupplierEmail] = useState("");

    // Currency State
    const [currency, setCurrency] = useState("DOP");
    const [exchangeRate, setExchangeRate] = useState("1");

    // Items State
    const [items, setItems] = useState<ItemRow[]>([]);
    
    // Auto-receive
    const [autoReceive, setAutoReceive] = useState(true);

    const handleAddItem = () => {
        setItems([
            ...items,
            {
                id: Math.random().toString(36).substring(7),
                isNew: false,
                ingredientId: "",
                newName: "",
                newUnit: "unidad",
                newMinStock: "0",
                quantity: "1",
                cost: "0",
            },
        ]);
    };

    const handleRemoveItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const handleItemChange = (id: string, field: keyof ItemRow, value: string | boolean) => {
        setItems(
            items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        );
    };

    const totalTransaction = items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.cost),
        0
    );

    const totalBaseCurrency = totalTransaction * Number(exchangeRate);

    const resetForm = () => {
        setSupplierMode("existing");
        setSelectedSupplierId("");
        setNewSupplierName("");
        setNewSupplierPhone("");
        setNewSupplierEmail("");
        setCurrency("DOP");
        setExchangeRate("1");
        setItems([]);
        setAutoReceive(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;
        setIsSubmitting(true);

        try {
            // 1. Handle Supplier
            let finalSupplierId: string | null = null;
            if (supplierMode === "existing") {
                finalSupplierId = selectedSupplierId;
            } else if (supplierMode === "new") {
                const newSupplier = await createSupplier.mutateAsync({
                    name: newSupplierName,
                    phone: newSupplierPhone || undefined,
                    email: newSupplierEmail || undefined,
                });
                finalSupplierId = newSupplier.id;
            }

            // 2. Handle Ingredients
            const processedItems = await Promise.all(
                items.map(async (item) => {
                    let finalIngredientId = item.ingredientId;
                    const baseUnitCost = Number(item.cost) * Number(exchangeRate);

                    if (item.isNew) {
                        const newIng = await createIngredient.mutateAsync({
                            name: item.newName,
                            unit: item.newUnit,
                            minStock: Number(item.newMinStock),
                            avgCost: baseUnitCost, // init logic cost to the one in this purchase
                            supplierId: finalSupplierId || undefined,
                        });
                        finalIngredientId = newIng.id;
                    }

                    return {
                        ingredientId: finalIngredientId,
                        quantity: Number(item.quantity),
                        estimatedCost: baseUnitCost,
                    };
                })
            );

            // 3. Create Purchase Order
            const notesObject = {
                currency,
                exchangeRate: Number(exchangeRate),
                totalOriginal: totalTransaction,
                originalText: `Compra en ${currency}`,
            };

            const order = await createPurchaseOrder.mutateAsync({
                supplierId: finalSupplierId,
                items: processedItems,
                notes: JSON.stringify(notesObject),
            });

            // 4. Auto Receive
            if (autoReceive) {
                await updateOrderStatus.mutateAsync({
                    id: order.id,
                    status: "RECEIVED",
                });
            }

            setOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error submitting purchase:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetForm();
            setOpen(val);
        }}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button className="gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 px-6 font-bold transition-all w-full md:w-auto uppercase tracking-widest text-xs">
                        <Plus className="h-5 w-5" /> Registrar Compra
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[800px] border border-slate-800 bg-[#0f172a] text-white shadow-2xl rounded-[2rem] custom-scrollbar">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                        <ShoppingCart className="w-6 h-6 text-indigo-400" /> Nueva Compra
                    </DialogTitle>
                    <DialogDescription className="text-white/60 font-medium">
                        Registra una compra manual, un nuevo proveedor o ingresa mercanía al stock directamente.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* SECCIÓN 1: PROVEEDOR */}
                    <div className="space-y-5 rounded-2xl bg-black/20 p-5 border border-white/5 shadow-inner">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Detalles del Proveedor</h3>
                        <RadioGroup
                            value={supplierMode}
                            onValueChange={(val: "existing" | "new" | "onetime") => setSupplierMode(val)}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="existing" id="r1" className="border-white/30 text-indigo-400" />
                                <Label htmlFor="r1" className="text-white/80 cursor-pointer font-medium">Existente</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="new" id="r2" className="border-white/30 text-indigo-400" />
                                <Label htmlFor="r2" className="text-white/80 cursor-pointer font-medium">Crear Nuevo</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="onetime" id="r3" className="border-white/30 text-indigo-400" />
                                <Label htmlFor="r3" className="text-white/80 cursor-pointer font-medium">Compra Única</Label>
                            </div>
                        </RadioGroup>

                        {supplierMode === "existing" && (
                            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} required>
                                <SelectTrigger className="w-full sm:max-w-md bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-white/30">
                                    <SelectValue placeholder="Seleccionar un proveedor..." />
                                </SelectTrigger>
                                <SelectContent className="bg-[#0f172a] border border-slate-700 text-white rounded-xl shadow-2xl">
                                    {suppliers?.map((s) => (
                                        <SelectItem key={s.id} value={s.id} className="focus:bg-white/10 focus:text-white">{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {supplierMode === "new" && (
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-white/70 ml-1">Nombre del Proveedor *</Label>
                                    <Input value={newSupplierName} onChange={(e) => setNewSupplierName(e.target.value)} required className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-white/30" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white/70 ml-1">Teléfono</Label>
                                    <Input value={newSupplierPhone} onChange={(e) => setNewSupplierPhone(e.target.value)} className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-white/30" />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-white/70 ml-1">Correo</Label>
                                    <Input value={newSupplierEmail} onChange={(e) => setNewSupplierEmail(e.target.value)} type="email" className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-white/30" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 2: MONEDA */}
                    <div className="space-y-5 rounded-2xl bg-black/20 p-5 border border-white/5 shadow-inner">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Moneda</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-white/70 ml-1">Moneda de la Transacción</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-white/30">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0f172a] border border-slate-700 text-white rounded-xl shadow-2xl">
                                        <SelectItem value="DOP" className="focus:bg-white/10 focus:text-white">DOP (Base)</SelectItem>
                                        <SelectItem value="USD" className="focus:bg-white/10 focus:text-white">USD</SelectItem>
                                        <SelectItem value="EUR" className="focus:bg-white/10 focus:text-white">EUR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {currency !== "DOP" && (
                                <div className="space-y-2">
                                    <Label className="text-white/70 ml-1">Tasa de Cambio a DOP *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        value={exchangeRate}
                                        onChange={(e) => setExchangeRate(e.target.value)}
                                        required
                                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus-visible:ring-1 focus-visible:ring-white/30"
                                    />
                                    <p className="text-xs text-white/40 flex items-center gap-1 font-medium mt-1">
                                        <Info className="w-3.5 h-3.5" /> Las finanzas se registrarán en DOP multiplicando por {exchangeRate}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SECCIÓN 3: ÍTEMS */}
                    <div className="space-y-5 rounded-2xl bg-black/20 p-5 border border-white/5 shadow-inner">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest">Productos a Comprar</h3>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white">
                                <Plus className="w-4 h-4 mr-1.5" /> Añadir Ítem
                            </Button>
                        </div>
                        
                        {items.length === 0 ? (
                            <div className="text-center p-8 border border-white/5 border-dashed rounded-xl bg-white/5 text-white/40 font-medium font-mono text-sm">
                                No has agreado productos. Haz clic en &quot;Añadir Ítem&quot;.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={item.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl shadow-sm space-y-5 hover:border-white/20 transition-colors">
                                        <div className="flex justify-between items-center bg-black/20 -mx-5 -mt-5 px-5 py-3 rounded-t-2xl border-b border-white/10">
                                            <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Ítem #{index + 1}</span>
                                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10" onClick={() => handleRemoveItem(item.id)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        
                                        <RadioGroup
                                            value={item.isNew ? "new" : "existing"}
                                            onValueChange={(val) => handleItemChange(item.id, "isNew", val === "new")}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="existing" id={`e-${item.id}`} className="border-white/30 text-indigo-400" />
                                                <Label htmlFor={`e-${item.id}`} className="text-white/80 cursor-pointer">Existente</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="new" id={`n-${item.id}`} className="border-white/30 text-indigo-400" />
                                                <Label htmlFor={`n-${item.id}`} className="text-white/80 cursor-pointer">Crear Nuevo Producto/Ingrediente</Label>
                                            </div>
                                        </RadioGroup>

                                        {!item.isNew ? (
                                            <div className="space-y-2">
                                                <Select value={item.ingredientId} onValueChange={(val) => handleItemChange(item.id, "ingredientId", val)} required>
                                                    <SelectTrigger className="bg-black/20 border-white/10 text-white rounded-xl h-11 focus:ring-white/30">
                                                        <SelectValue placeholder="Busca ingrediente existente..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#0f172a] border border-slate-700 text-white rounded-xl shadow-2xl">
                                                        {ingredients?.map((ing) => (
                                                            <SelectItem key={ing.id} value={ing.id} className="focus:bg-white/10 focus:text-white font-medium">{ing.name} <span className="text-white/40 font-mono ml-2">(Stock: {ing.currentStock} {ing.unit})</span></SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <div className="grid gap-3 sm:grid-cols-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-white/70">Nombre</Label>
                                                    <Input value={item.newName} onChange={(e) => handleItemChange(item.id, "newName", e.target.value)} required className="bg-black/20 border-white/10 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-white/30" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-white/70">Unidad (kg, unids)</Label>
                                                    <Input value={item.newUnit} onChange={(e) => handleItemChange(item.id, "newUnit", e.target.value)} required className="bg-black/20 border-white/10 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-white/30" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-white/70">Stock Mínimo</Label>
                                                    <Input type="number" min="0" step="0.1" value={item.newMinStock} onChange={(e) => handleItemChange(item.id, "newMinStock", e.target.value)} required className="bg-black/20 border-white/10 text-white rounded-xl h-10 focus-visible:ring-1 focus-visible:ring-white/30" />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid gap-4 sm:grid-cols-2 bg-black/20 p-4 rounded-xl border border-white/5 border-dashed">
                                            <div className="space-y-2">
                                                <Label className="text-white/70 ml-1">Cantidad Comprada</Label>
                                                <Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)} required className="bg-white/5 border-white/10 text-white rounded-xl h-12 text-lg font-mono focus-visible:ring-1 focus-visible:ring-white/30" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-white/70 ml-1">Costo Unitario (en {currency})</Label>
                                                <Input type="number" min="0" step="0.01" value={item.cost} onChange={(e) => handleItemChange(item.id, "cost", e.target.value)} required className="bg-white/5 border-white/10 text-white rounded-xl h-12 text-lg font-mono focus-visible:ring-1 focus-visible:ring-white/30" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* SECCIÓN 4: RESUMEN Y ACCIONES */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center space-x-3 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                            <Checkbox id="autoReceive" checked={autoReceive} onCheckedChange={(val) => setAutoReceive(!!val)} className="border-emerald-500/50 data-[state=checked]:bg-emerald-500 rounded-md shadow-inner" />
                            <Label htmlFor="autoReceive" className="flex flex-col cursor-pointer mt-0.5">
                                <span className="font-bold text-emerald-300">Marcar como Recibida (Inmediato)</span>
                                <span className="font-medium text-xs text-emerald-400/60 mt-0.5">Automáticamente se sumarán estos productos al stock del inventario.</span>
                            </Label>
                        </div>
                        
                        <div className="bg-black/40 border border-white/5 text-white p-5 rounded-2xl flex items-center justify-between shadow-inner">
                            <div>
                                <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">Costo Total Compra</p>
                                <p className="text-3xl font-black font-mono tracking-tighter drop-shadow-sm">{currency === "DOP" ? formatCurrency(totalTransaction) : `${currency} ${totalTransaction.toFixed(2)}`}</p>
                            </div>
                            {currency !== "DOP" && (
                                <div className="text-right">
                                    <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">Equivalente Base</p>
                                    <p className="text-xl font-bold font-mono text-white/80">{formatCurrency(totalBaseCurrency)} DOP</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl h-12 text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 px-6 font-bold">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isSubmitting || isDemo || items.length === 0} className="w-full sm:w-auto rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 shadow-[0_0_15px_rgba(5,150,105,0.4)] disabled:opacity-50">
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Transacción
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
