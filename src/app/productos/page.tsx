"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
    useProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    type Product,
} from "@/hooks/use-products";
import { useDemo } from "@/hooks/use-demo";
import { useRecipes } from "@/hooks/use-recipes";
import { useDebounce } from "@/hooks/use-debounce";
import {
    Plus,
    Search,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
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
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/calculations";
import { cn } from "@/lib/utils";

// --- Categories Config ---
const CATEGORIES = [
    { id: "all", label: "Todos" },
    { id: "Platos Principales", label: "Platos" },
    { id: "Bebidas", label: "Bebidas" },
    { id: "Postres", label: "Postres" },
    { id: "Otros", label: "Otros" },
];

// --- Dialog Component ---
function ProductDialog({
    product,
    open,
    onOpenChange,
}: {
    product?: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [formData, setFormData] = useState({
        name: product?.name || "",
        description: product?.description || "",
        sellingPrice: product?.sellingPrice ? String(product.sellingPrice) : "",
        currentStock: product?.currentStock ? String(product.currentStock) : "0",
        category: product?.category || "Platos Principales",
        sku: product?.sku || "",
        recipeId: product?.recipeId || "none",
    });

    const { data: recipes } = useRecipes();
    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();

    const isEditing = !!product;
    const isLoading = createMutation.isPending || updateMutation.isPending;



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure price is a valid number, fallback to 0
        const price = parseFloat(formData.sellingPrice);
        const stock = parseFloat(formData.currentStock);

        const data = {
            name: formData.name,
            description: formData.description || undefined,
            sellingPrice: isNaN(price) ? 0 : price,
            currentStock: isNaN(stock) ? 0 : stock,
            category: formData.category,
            sku: formData.sku || undefined,
            recipeId: formData.recipeId === "none" ? null : formData.recipeId,
        };

        try {
            if (isEditing) {
                await updateMutation.mutateAsync({ id: product.id, data });
            } else {
                await createMutation.mutateAsync(data);
            }
            onOpenChange(false);
            if (!isEditing) resetForm();
        } catch (error) {
            console.error("Failed to save product", error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            sellingPrice: "",
            currentStock: "0",
            category: "Platos Principales",
            sku: "",
            recipeId: "none",
        });
    };

    // Auto-fill details from linked recipe
    const handleRecipeChange = (recipeId: string) => {
        setFormData((prev) => ({ ...prev, recipeId }));
        if (!isEditing && recipeId !== "none") {
            const recipe = recipes?.find((r) => r.id === recipeId);
            if (recipe) {
                setFormData((prev) => ({
                    ...prev,
                    name: prev.name || recipe.name,
                    sellingPrice: prev.sellingPrice ? String(Number(prev.sellingPrice) || Number(recipe.suggestedPrice)) : (recipe.suggestedPrice ? String(Number(recipe.suggestedPrice)) : ""),
                    category: prev.category === "Platos Principales" ? (recipe.category || "Platos Principales") : prev.category,
                }));
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar Producto" : "Nuevo Producto"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifica los detalles del item." : "Agrega un nuevo item al menú."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Categoría</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Precio (RD$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.sellingPrice}
                                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                    className="font-mono text-lg"
                                    placeholder="0.00"
                                    required
                                />
                            </div>


                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-primary font-medium">Receta Vinculada</Label>
                                <Select
                                    value={formData.recipeId}
                                    onValueChange={handleRecipeChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Sin receta --</SelectItem>
                                        {recipes?.map((recipe) => (
                                            <SelectItem key={recipe.id} value={recipe.id}>
                                                {recipe.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Stock</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.currentStock}
                                        onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>SKU</Label>
                                    <Input
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="OPCIONAL"
                                        className="text-xs uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Guardar" : "Crear"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Page ---
export default function ProductosPage() {
    const { isDemo } = useDemo();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 500); // Debounce
    const [createOpen, setCreateOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeProduct, setActiveProduct] = useState<Product | undefined>(undefined);
    const [editOpen, setEditOpen] = useState(false);

    // Use debounced search
    const { data: products, isLoading, error } = useProducts({ search: debouncedSearch });
    const deleteMutation = useDeleteProduct();

    const handleEdit = (product: Product) => {
        setActiveProduct(product);
        setEditOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Estás seguro de eliminar este producto?")) {
            deleteMutation.mutate(id);
        }
    };

    // Derived state for filtered products (Client side category filter)
    const filteredProducts = products?.filter(p => {
        if (activeCategory !== "all" && p.category !== activeCategory) return false;
        return true;
    }) || [];

    return (
        <div className="space-y-4 lg:space-y-6 animate-fade-in relative z-10 w-full overflow-x-hidden">
            {/* Mobile Responsive Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-border shadow-sm">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">Menú y Productos</h1>
                    <p className="text-sm text-muted-foreground mt-1">Catálogo de venta</p>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    disabled={isDemo}
                    className={cn("w-full sm:w-auto bg-salsa hover:bg-salsa/90 text-white shadow-md shadow-salsa/20 rounded-xl", isDemo && "opacity-50 cursor-not-allowed")}
                >
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 bg-muted/20 p-2 lg:p-4 rounded-xl border border-border">

                {/* Search & Filter Row */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar productos..."
                            className="pl-9 bg-white border-border rounded-xl h-10 lg:h-11"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="overflow-x-auto pb-2 -mx-2 px-2 lg:mx-0 lg:px-0">
                    <div className="flex gap-2 min-w-max">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs lg:text-sm font-medium transition-all border",
                                    activeCategory === cat.id
                                        ? "bg-foreground text-background border-foreground shadow-sm"
                                        : "bg-white text-muted-foreground border-border hover:bg-muted/50"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table View */}
            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Producto</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Precio</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-destructive">
                                    Error al cargar datos
                                </TableCell>
                            </TableRow>
                        ) : filteredProducts?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No se encontraron productos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProducts?.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="font-medium">{product.name}</div>
                                        {product.recipeId && (
                                            <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                Receta Vinculada
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-medium">
                                            {product.category || "General"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-medium">
                                        {formatCurrency(Number(product.sellingPrice) || 0)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={cn(
                                            "font-mono font-medium",
                                            Number(product.currentStock) <= 2 ? "text-destructive" : "text-muted-foreground"
                                        )}>
                                            {Number(product.currentStock) || 0}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDemo}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(product)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create/Edit Dialogs */}
            <ProductDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
            />

            {activeProduct && (
                <ProductDialog
                    product={activeProduct}
                    open={editOpen}
                    onOpenChange={(open) => {
                        setEditOpen(open);
                        if (!open) setActiveProduct(undefined);
                    }}
                />
            )}
        </div>
    );
}
