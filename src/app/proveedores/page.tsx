"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
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
    type PurchaseOrder,
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
    Calendar,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";

// Dialog para crear proveedor
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
            name: formData.name,
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
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Proveedor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Agregar Proveedor</DialogTitle>
                    <DialogDescription>
                        Registra un nuevo proveedor para tu negocio
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre del Proveedor *</Label>
                        <Input
                            placeholder="Ej: Distribuidora La Vega"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input
                                type="tel"
                                placeholder="809-555-1234"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="ventas@proveedor.com"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Dirección</Label>
                        <Input
                            placeholder="Calle, Ciudad"
                            value={formData.address}
                            onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notas</Label>
                        <Textarea
                            placeholder="Información adicional..."
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Dialog para editar proveedor
function EditSupplierDialog({
    supplier,
    open,
    onOpenChange,
}: {
    supplier: Supplier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
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
            data: {
                name: formData.name,
                phone: formData.phone || undefined,
                email: formData.email || undefined,
                address: formData.address || undefined,
                notes: formData.notes || undefined,
            },
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Proveedor</DialogTitle>
                    <DialogDescription>Modifica los datos del proveedor</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Dirección</Label>
                        <Input
                            value={formData.address}
                            onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                            }
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notas</Label>
                        <Textarea
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Dialog para generar orden de compra
function CreateOrderDialog({
    supplier,
    open,
    onOpenChange,
}: {
    supplier: Supplier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [autoGenerate, setAutoGenerate] = useState(true);
    const createOrderMutation = useCreatePurchaseOrder();

    const handleSubmit = async () => {
        await createOrderMutation.mutateAsync({
            supplierId: supplier.id,
            autoGenerate,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Generar Orden de Compra</DialogTitle>
                    <DialogDescription>
                        Crea una nueva orden para <strong>{supplier.name}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                        <Switch
                            id="auto-generate"
                            checked={autoGenerate}
                            onCheckedChange={setAutoGenerate}
                        />
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="auto-generate" className="font-medium">
                                Autogenerar Inteligente
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Analiza el stock bajo de este proveedor y sugiere cantidades automáticamente.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={createOrderMutation.isPending}>
                        {createOrderMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Crear Orden
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Dialog historial de órdenes
function OrdersHistoryDialog({
    supplier,
    open,
    onOpenChange,
}: {
    supplier: Supplier;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data: orders, isLoading } = usePurchaseOrders({
        supplierId: supplier.id,
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Historial de Órdenes</DialogTitle>
                    <DialogDescription>{supplier.name}</DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : orders?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                            <FileText className="mb-2 h-8 w-8 opacity-50" />
                            <p>No hay órdenes registradas</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders?.map((order) => (
                                <div
                                    key={order.id}
                                    className="rounded-lg border bg-card p-4 transition-all hover:bg-muted/50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{order.status}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {formatDate(order.createdAt)}
                                            </span>
                                        </div>
                                        <span className="font-mono font-bold">
                                            {formatCurrency(Number(order.totalAmount))}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {order.items.length} items solicitados
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function SupplierCard({ supplier }: { supplier: Supplier }) {
    const [editOpen, setEditOpen] = useState(false);
    const [createOrderOpen, setCreateOrderOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    const deleteMutation = useDeleteSupplier();

    return (
        <>
            <Card className="group transition-all hover:border-primary/50">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <Truck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{supplier.name}</h3>
                                {supplier._count && (
                                    <Badge variant="secondary" className="mt-1">
                                        {supplier._count.ingredients} ingredientes
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="opacity-0 group-hover:opacity-100"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setCreateOrderOpen(true)}>
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Nueva Orden
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setHistoryOpen(true)}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver Historial
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => deleteMutation.mutate(supplier.id)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-2">
                        {supplier.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <a
                                    href={`tel:${supplier.phone}`}
                                    className="hover:text-primary hover:underline"
                                >
                                    {supplier.phone}
                                </a>
                            </div>
                        )}
                        {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <a
                                    href={`mailto:${supplier.email}`}
                                    className="hover:text-primary hover:underline"
                                >
                                    {supplier.email}
                                </a>
                            </div>
                        )}
                        {supplier.address && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{supplier.address}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2"
                            onClick={() => setCreateOrderOpen(true)}
                        >
                            <ShoppingCart className="h-4 w-4" />
                            Generar Orden
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setHistoryOpen(true)}
                            title="Ver Historial"
                        >
                            <FileText className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <EditSupplierDialog
                supplier={supplier}
                open={editOpen}
                onOpenChange={setEditOpen}
            />
            <CreateOrderDialog
                supplier={supplier}
                open={createOrderOpen}
                onOpenChange={setCreateOrderOpen}
            />
            <OrdersHistoryDialog
                supplier={supplier}
                open={historyOpen}
                onOpenChange={setHistoryOpen}
            />
        </>
    );
}

export default function ProveedoresPage() {
    const [search, setSearch] = useState("");

    const { data: suppliers, isLoading, error } = useSuppliers({ search });

    // Calculate stats
    const totalIngredients =
        suppliers?.reduce((sum, s) => sum + (s._count?.ingredients || 0), 0) || 0;

    // Note: pendingOrders logic might be slightly off if we don't query order counts, but for now we removed it from list query to fix 500 error.
    // We can re-enable status fetching or just remove that card. I'll replace it with "Total Suppliers" or similar if needed, or keep it generic.

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Proveedores
                    </h1>
                    <p className="text-muted-foreground">
                        Directorio de proveedores y gestión de compras
                    </p>
                </div>
                <CreateSupplierDialog />
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Truck className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{suppliers?.length || 0}</p>
                            <p className="text-xs text-muted-foreground">
                                Proveedores Activos
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                            <ShoppingCart className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">-</p>
                            <p className="text-xs text-muted-foreground">
                                Sistema de Compras
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                            <Truck className="h-6 w-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalIngredients}</p>
                            <p className="text-xs text-muted-foreground">
                                Ingredientes Enlazados
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar proveedores..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Suppliers Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-muted-foreground">
                            Error al cargar proveedores
                        </p>
                    </CardContent>
                </Card>
            ) : suppliers?.length === 0 ? (
                <Card className="border-dashed border-2 border-muted-foreground/25">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                            <Truck className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="mb-2 text-xl font-semibold">
                            Agrega tu primer proveedor
                        </h3>
                        <p className="mb-6 max-w-md text-muted-foreground">
                            Registra tus proveedores para generar órdenes de compra
                            automáticas
                        </p>
                        <CreateSupplierDialog />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {suppliers?.map((supplier) => (
                        <SupplierCard key={supplier.id} supplier={supplier} />
                    ))}
                </div>
            )}
        </div>
    );
}
