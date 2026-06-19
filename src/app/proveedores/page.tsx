"use client";

import { useState, useMemo } from "react";
import {
    useSuppliers,
    useCreateSupplier,
    useUpdateSupplier,
    useDeleteSupplier,
    type Supplier,
} from "@/hooks/use-suppliers";
import {
    usePurchaseOrders,
    useCreatePurchaseOrder,
} from "@/hooks/use-purchase-orders";
import {
    Truck,
    Plus,
    Phone,
    Mail,
    MapPin,
    MoreHorizontal,
    Pencil,
    Trash2,
    FileText,
    Loader2,
    Search,
    ShoppingCart,
    Clock,
    Zap,
    PenTool,
    Building2,
    PackageSearch,
    ChevronRight,
    ArrowUpRight,
    CheckCircle2,
    Globe,
    Layers,
    Filter,
    Activity,
    User,
    ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ComprasDialog } from "@/components/compras-dialog";
import { cn } from "@/lib/utils";

// Dialog crear proveedor
function CreateSupplierDialog() {
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
    });

    const createMutation = useCreateSupplier();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createMutation.mutateAsync({
            name: formData.name.toUpperCase(),
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            address: formData.address || undefined,
            notes: formData.notes || undefined,
        });
        setOpen(false);
        setFormData({ name: "", phone: "", email: "", address: "", notes: "" });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="aura-pill bg-indigo-600 text-white hover:bg-indigo-700 shadow-[0_4px_12px_rgba(79,70,229,0.3)] gap-2 h-10 px-6">
                    <Plus className="w-4 h-4" /> Nuevo Proveedor
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-8 gap-8 surface-card border-none shadow-2xl font-sans">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Nuevo Proveedor</DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-500">Alta de socio estratégico en la cadena de suministros.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nombre del Proveedor</Label>
                        <Input
                            placeholder="EJ: DISTRIBUIDORA NACIONAL"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                            required
                            className="h-11 rounded-lg border-slate-200 bg-white font-semibold"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Teléfono</Label>
                            <Input
                                type="tel"
                                placeholder="+1 809-xxx-xxxx"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="h-11 rounded-lg border-slate-200 font-semibold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</Label>
                            <Input
                                type="email"
                                placeholder="ventas@empresa.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-11 rounded-lg border-slate-200 font-semibold"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Dirección Operativa</Label>
                        <Input
                            placeholder="Calle Principal #45..."
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="h-11 rounded-lg border-slate-200 font-semibold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notas de Gestión</Label>
                        <Textarea
                            placeholder="Condiciones de pago, horarios..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="rounded-lg border-slate-200 font-medium text-sm"
                        />
                    </div>
                    <DialogFooter className="gap-3">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-11 px-6 font-bold text-xs uppercase tracking-widest text-slate-500">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending} className="h-11 flex-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-800">
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Proveedor
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Suplier Item
function SupplierListItem({ supplier }: { supplier: Supplier }) {
    const [editOpen, setEditOpen] = useState(false);
    const [createOrderOpen, setCreateOrderOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const deleteMutation = useDeleteSupplier();

    return (
        <>
            <div className="bg-white rounded-[32px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="flex items-center gap-5 md:w-[35%] min-w-0 px-2">
                    <div className="h-12 w-12 rounded-xl border-2 border-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Truck className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 pr-4">
                        <h3 className="font-black text-[16px] text-[#1e3a5f] tracking-tight">{supplier.name}</h3>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                             {supplier._count?.ingredients || 0} Ingredientes
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 md:w-[30%]">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 bg-slate-50 rounded-full px-4 py-2 w-fit">
                        <Mail className="w-3 h-3 text-indigo-400" /> {supplier.email || "SIN CORREO REGISTRADO"}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 bg-slate-50 rounded-full px-4 py-2 w-fit">
                        <Phone className="w-3 h-3 text-indigo-400" /> {supplier.phone || "TELÉFONO NO DISPONIBLE"}
                    </div>
                </div>

                <div className="flex flex-col md:w-[20%] text-center">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{supplier.address ? "DIRECCIÓN REGISTRADA" : "SIN DIRECCIÓN REGISTRADA"}</span>
                </div>

                <div className="flex items-center justify-end gap-3 md:w-[15%] pr-2">
                     <button 
                        onClick={() => setCreateOrderOpen(true)}
                        className="aura-pill bg-teal-50 text-teal-600 border border-teal-100 hover:bg-teal-100 hover:scale-105 transition-all text-[9px]"
                    >
                         + Nueva Orden
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all">
                                <FileText className="h-3 w-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-[20px] shadow-2xl border-none">
                            <DropdownMenuItem onClick={() => setHistoryOpen(true)} className="text-[10px] font-black uppercase tracking-widest py-3 rounded-xl"><FileText className="w-4 h-4 mr-3" /> Historial</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setEditOpen(true)} className="text-[10px] font-black uppercase tracking-widest py-3 rounded-xl"><Pencil className="w-4 h-4 mr-3" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { if(confirm("¿Eliminar?")) deleteMutation.mutate(supplier.id); }} className="text-[10px] font-black uppercase tracking-widest py-3 rounded-xl text-red-600"><Trash2 className="w-4 h-4 mr-3" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Dialogs placeholders */}
            <OrdersHistoryDialog supplier={supplier} open={historyOpen} onOpenChange={setHistoryOpen} />
            <CreateOrderWizard supplier={supplier} open={createOrderOpen} onOpenChange={setCreateOrderOpen} />
        </>
    );
}

// Dialog Historico
function OrdersHistoryDialog({ supplier, open, onOpenChange }: { supplier: Supplier; open: boolean; onOpenChange: (open: boolean) => void; }) {
    const { data: orders, isLoading } = usePurchaseOrders({ supplierId: supplier.id });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] p-0 surface-card border-none shadow-2xl overflow-hidden font-sans">
                <div className="p-8 space-y-6">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Historial Comercial</DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-500">Registros de compras con <span className="text-slate-900 font-bold">{supplier.name}</span>.</DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[380px] pr-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="animate-spin text-slate-400 w-6 h-6" />
                            <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Consultando registros...</p>
                        </div>
                    ) : !orders?.length ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            <ClipboardList className="w-8 h-8 text-slate-200 mb-3" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sin historial transaccional</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                             {orders?.map((order) => (
                                <div key={order.id} className="p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-all flex items-center justify-between group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-slate-100 px-1.5">{order.status}</Badge>
                                            <span className="text-[10px] font-medium text-slate-400">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 uppercase">Orden #{order.id.slice(-6).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{formatCurrency(Number(order.totalAmount))}</p>
                                        <p className="text-[10px] font-medium text-slate-400">{order.items.length} Referencias</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full h-11 font-bold text-xs uppercase tracking-widest text-slate-500">Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Order Wizard
function CreateOrderWizard({ supplier, open, onOpenChange }: { supplier: Supplier; open: boolean; onOpenChange: (open: boolean) => void; }) {
    const [orderType, setOrderType] = useState<"REPEAT" | "SMART" | "MANUAL">("REPEAT");
    const [comprasOpen, setComprasOpen] = useState(false);
    const createOrderMutation = useCreatePurchaseOrder();

    const handleConfirm = async () => {
        if (orderType === "REPEAT") {
            await createOrderMutation.mutateAsync({ supplierId: supplier.id, repeatLast: true });
            onOpenChange(false);
        } else if (orderType === "SMART") {
            await createOrderMutation.mutateAsync({ supplierId: supplier.id, autoGenerate: true });
            onOpenChange(false);
        } else if (orderType === "MANUAL") {
            onOpenChange(false);
            setTimeout(() => setComprasOpen(true), 200);
        }
    };

    const options = [
        { value: "REPEAT" as const, label: "Reposición Rutinaria", desc: "Clona la última transacción realizada con éxito.", icon: Clock },
        { value: "SMART" as const, label: "Generación Inteligente", desc: "Calcula el déficit de stock e insumos críticos.", icon: Zap },
        { value: "MANUAL" as const, label: "Inyección Manual", desc: "Configura una orden a medida desde cero.", icon: PenTool },
    ];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[450px] p-8 gap-8 surface-card border-none shadow-2xl font-sans text-center">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Protocolo de Compra</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-slate-500">Ejecutar orden de abastecimiento para <span className="text-slate-900 font-bold">{supplier.name}</span>.</DialogDescription>
                    </DialogHeader>

                    <RadioGroup value={orderType} onValueChange={(val: any) => setOrderType(val)} className="grid grid-cols-1 gap-2 pt-2">
                        {options.map((opt) => {
                             const Icon = opt.icon;
                             const isActive = orderType === opt.value;
                             return (
                                <button
                                    key={opt.value}
                                    onClick={() => setOrderType(opt.value)}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                                        isActive ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                                    )}
                                >
                                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", isActive ? "bg-white/20" : "bg-slate-50")}>
                                        <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500")} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-bold uppercase tracking-wider block leading-none mb-1">{opt.label}</p>
                                        <p className={cn("text-[10px] font-medium leading-normal", isActive ? "text-slate-300" : "text-slate-400")}>{opt.desc}</p>
                                    </div>
                                    <RadioGroupItem value={opt.value} className="sr-only" />
                                </button>
                             );
                        })}
                    </RadioGroup>

                    <DialogFooter className="gap-3 pt-4">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="h-11 px-6 font-bold text-xs uppercase tracking-widest text-slate-500">Abortar</Button>
                        <Button onClick={handleConfirm} disabled={createOrderMutation.isPending} className="h-11 flex-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-800">
                            {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Iniciar Proceso
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ComprasDialog open={comprasOpen} onOpenChange={setComprasOpen} defaultSupplierId={supplier.id} />
        </>
    );
}

// Final Page
export default function ProveedoresPage() {
    const [search, setSearch] = useState("");
    const { data: suppliers, isLoading, error } = useSuppliers({ search });

    const stats = useMemo(() => {
        if (!suppliers) return { total: 0, items: 0, active: 0 };
        return {
            total: suppliers.length,
            items: suppliers.reduce((sum, s) => sum + (s._count?.ingredients || 0), 0),
            active: suppliers.filter(s => (s._count?.purchaseOrders || 0) > 0).length
        };
    }, [suppliers]);

    return (
        <div className="space-y-6 animate-enter">
             {/* Huge Aura Header Card */}
             <div className="aura-header-card">
                 <div className="flex-1 flex gap-12 items-center flex-wrap">
                    <div>
                        <h1 className="aura-page-title text-[#1e3a5f] -ml-1">DIRECTORIO PROVEEDORES</h1>
                        <p className="aura-page-subtitle text-[#1e3a5f]/60 flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Red de Suministro y Contactos
                        </p>
                    </div>

                    <div className="flex items-center gap-8 md:gap-12 ml-auto lg:ml-0 px-4 md:border-l md:border-l-slate-200 pl-4 py-2">
                        <div className="text-center">
                            <p className="text-3xl font-black text-indigo-600 leading-none">{stats.total}</p>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1 block">Total</span>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-black text-emerald-600 leading-none">{stats.items}</p>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1 block">Ingredientes</span>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-black text-rose-600 leading-none">-</p>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-1 block">Órdenes</span>
                        </div>
                    </div>
                 </div>
                
                 <div className="md:border-l border-slate-100 md:pl-8">
                     <CreateSupplierDialog />
                 </div>
            </div>

            {/* Pill Search Area */}
            <div className="bg-slate-200/50 p-2 rounded-full flex items-center">
                <Search className="h-5 w-5 text-slate-400 ml-4 mr-2" />
                <input
                    type="text"
                    placeholder="Buscar en el directorio de proveedores..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 h-10 bg-transparent outline-none text-[11px] font-bold text-slate-600 placeholder:text-slate-400 tracking-wider"
                />
            </div>

            <div className="flex flex-col gap-5 pb-32">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 bg-white border border-slate-100/50 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] animate-pulse">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-200" />
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] animate-pulse">Escaneando Red...</p>
                    </div>
                ) : suppliers?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200/60 text-center animate-enter">
                        <div className="h-24 w-24 rounded-[40px] bg-white flex items-center justify-center shadow-2xl shadow-slate-200 mb-8">
                            <PackageSearch className="w-10 h-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2">Red Desierta</h3>
                        <p className="text-sm font-medium text-slate-400 max-w-xs mx-auto px-10 leading-relaxed">No se han detectado proveedores en la red comercial.</p>
                    </div>
                ) : (
                    suppliers?.map((supplier, idx) => (
                        <div key={supplier.id} className={cn("animate-enter", idx < 10 ? `animate-stagger-${(idx % 4) + 1}` : "")}>
                            <SupplierListItem supplier={supplier} />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Edit dialog dummy for theme consistency
function EditSupplierDialog({ supplier, open, onOpenChange }: { supplier: Supplier; open: boolean; onOpenChange: (open: boolean) => void; }) {
    const [formData, setFormData] = useState({
        name: supplier.name,
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
        notes: supplier.notes || "",
    });

    const updateMutation = useUpdateSupplier();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await updateMutation.mutateAsync({
            id: supplier.id,
            data: { ...formData, name: formData.name.toUpperCase() },
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
             <DialogContent className="sm:max-w-[480px] p-8 gap-8 surface-card border-none shadow-2xl font-sans">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">Editar Proveedor</DialogTitle>
                    <DialogDescription className="text-sm font-medium text-slate-500">Actualizar información de contacto.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Nombre</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })} required className="h-11 rounded-lg border-slate-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Teléfono</Label>
                                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11 rounded-lg border-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email</Label>
                                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-11 rounded-lg border-slate-200" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Dirección</Label>
                            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-11 rounded-lg border-slate-200" />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-11 px-6 font-bold text-xs uppercase tracking-widest text-slate-500">Cancelar</Button>
                        <Button type="submit" disabled={updateMutation.isPending} className="h-11 flex-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-slate-800">Guardar Cambios</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

