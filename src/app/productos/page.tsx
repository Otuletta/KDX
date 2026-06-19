"use client";

import { useState, useMemo } from "react";
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
    ArrowUpRight,
    Trash2,
    Loader2,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatCurrency } from "@/lib/calculations";
import { cn } from "@/lib/utils";

// --- Dialog Component ---
function ProductDialog({
    product,
    open,
    onOpenChange,
    onDelete,
    existingCategories
}: {
    product?: Product;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete?: (id: string) => void;
    existingCategories: string[];
}) {
    const [isNewCategory, setIsNewCategory] = useState(false);
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
        const price = parseFloat(formData.sellingPrice);
        const stock = parseFloat(formData.currentStock);

        const data = {
            name: formData.name.toUpperCase(),
            description: formData.description || undefined,
            sellingPrice: isNaN(price) ? 0 : price,
            currentStock: isNaN(stock) ? 0 : stock,
            category: formData.category ? formData.category : undefined,
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
        setIsNewCategory(false);
    };

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
            <DialogContent className="sm:max-w-[520px] p-8 gap-8 bg-white border border-slate-200 rounded-[32px] shadow-2xl font-sans">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-black tracking-tight text-[#1e3a5f]">
                        {isEditing ? "EDITAR PRODUCTO" : "REGISTRAR PRODUCTO"}
                    </DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        {isEditing ? "Actualizar ficha técnica." : "Añadir un nuevo ítem al catálogo."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Producto</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                placeholder="EJ. CANNOLI SICILIANO"
                                required
                                className="h-12 rounded-xl border border-slate-200 bg-slate-50 font-black text-[#1e3a5f]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</Label>
                                {isNewCategory ? (
                                    <div className="flex gap-2">
                                        <Input 
                                            value={formData.category} 
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })} 
                                            required 
                                            placeholder="Nueva..." 
                                            className="h-12 rounded-xl border border-slate-200 font-black text-[#1e3a5f] flex-1"
                                            autoFocus
                                        />
                                        <Button type="button" variant="outline" onClick={() => setIsNewCategory(false)} className="h-12 w-12 rounded-xl">×</Button>
                                    </div>
                                ) : (
                                    <Select 
                                        value={formData.category} 
                                        onValueChange={(v: string) => v === "NEW" ? setIsNewCategory(true) : setFormData({ ...formData, category: v })}
                                    >
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
                                <Label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Precio Venta (RD$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.sellingPrice}
                                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                                    placeholder="0.00"
                                    required
                                    className="h-12 rounded-xl border-emerald-200 bg-emerald-50 font-black text-emerald-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enlace Receta</Label>
                            <Select value={formData.recipeId} onValueChange={handleRecipeChange}>
                                <SelectTrigger className="h-12 rounded-xl border border-slate-200 text-[#1e3a5f] font-black">
                                    <SelectValue placeholder="Sin receta..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="none" className="font-bold text-xs">-- Sin Enlace --</SelectItem>
                                    {recipes?.map((recipe) => (
                                        <SelectItem key={recipe.id} value={recipe.id} className="font-bold text-xs">{recipe.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Stock Inicial (Und)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.currentStock}
                                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                                    className="h-12 rounded-xl border border-slate-200 font-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Código SKU</Label>
                                <Input
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                                    placeholder="AUTO"
                                    className="h-12 rounded-xl border border-slate-200 font-black uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        {isEditing && onDelete && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onDelete(product.id)}
                                className="mr-auto text-red-500 font-black uppercase text-[10px] hover:bg-red-50 rounded-xl px-4"
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-12 px-6 font-black text-[10px] uppercase tracking-widest text-[#1e3a5f] rounded-xl hover:bg-slate-100"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 flex-1 bg-[#0f172a] text-white font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 rounded-xl"
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            {isEditing ? "Guardar" : "Registar"}
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
    const debouncedSearch = useDebounce(search, 500);
    const [createOpen, setCreateOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeProduct, setActiveProduct] = useState<Product | undefined>(undefined);
    const [editOpen, setEditOpen] = useState(false);

    const { data: products, isLoading } = useProducts({ search: debouncedSearch });
    const deleteMutation = useDeleteProduct();

    const handleEdit = (product: Product) => {
        setActiveProduct(product);
        setEditOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("¿ELIMINAR PRODUCTO?")) {
            deleteMutation.mutate(id);
            setEditOpen(false);
        }
    };

    const dynamicCats = useMemo(() => {
        if (!products) return [];
        const cats = new Set<string>();
        products.forEach(p => { if (p.category) cats.add(p.category); });
        return Array.from(cats).sort();
    }, [products]);

    const filteredProducts = products?.filter(p => {
        if (activeCategory !== "all" && p.category !== activeCategory) return false;
        return true;
    }) || [];

    return (
        <div className="space-y-8 font-sans bg-[#f4f6f8] min-h-screen px-4 md:px-8 py-8 animate-enter">
            {/* Header Block 1: The 'CATÁLOGO MENÚ' Box */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm relative pt-1 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-100">
                 {/* Top Red Gradient Line */}
                 <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 via-red-500 to-orange-400" />
                 
                 <div>
                      <h1 className="text-4xl md:text-5xl font-black text-[#1e3a5f] tracking-tighter uppercase">CATÁLOGO MENÚ</h1>
                      <div className="flex items-center gap-2 mt-2">
                           {/* Using crossed tools or tiny cog icon to mimic the icon */}
                           <span className="text-rose-500 font-bold">✖</span>
                           <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#1e3a5f]/60">GESTIÓN MASTER DE PLATOS Y PRODUCTOS</p>
                      </div>
                 </div>

                 <div className="flex flex-col items-end gap-3 text-right">
                      <div className="flex flex-col">
                           <span className="text-4xl font-black text-rose-500 leading-none">{products?.length || 0}</span>
                           <span className="text-[9px] font-black tracking-widest uppercase text-[#1e3a5f]/60 mt-1">TOTAL ÍTEMS</span>
                      </div>
                      <Button
                          onClick={() => setCreateOpen(true)}
                          disabled={isDemo}
                          className="h-12 px-8 bg-rose-500 hover:bg-rose-600 text-white font-black text-[12px] uppercase tracking-widest rounded-full shadow-[0_4px_14px_rgba(244,63,94,0.3)] transition-all"
                      >
                           + NUEVO PRODUCTO
                      </Button>
                 </div>
            </div>

            {/* Header Block 2: Title & Line Stats (Gestión de Menú) */}
            <div className="space-y-6 pt-4">
                 <div>
                      <h2 className="text-3xl font-black text-[#1e3a5f] tracking-tight">Gestión de Menú</h2>
                      <p className="text-sm font-bold text-slate-500">Administración de productos, ingeniería de precios y visibilidad de venta.</p>
                 </div>

                 {/* The Linear Stats Section directly replicating Image 1 */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 pb-4">
                      {/* Oferta Activa */}
                      <div>
                           <span className="text-[12px] font-black text-[#1e3a5f] block mb-2">Oferta Activa</span>
                           <p className="text-[20px] font-black text-indigo-600 mb-2">{products?.length || 0}</p>
                           <div className="flex items-center gap-2">
                                <div className="h-[2px] w-8 bg-indigo-500" />
                                <span className="text-[9px] font-black text-slate-400/80 uppercase tracking-widest">Productos en menú</span>
                           </div>
                      </div>
                      
                      {/* Categorías */}
                      <div>
                           <span className="text-[12px] font-black text-[#1e3a5f] block mb-2">Categorías</span>
                           <p className="text-[20px] font-black text-emerald-500 mb-2">{dynamicCats.length}</p>
                           <div className="flex items-center gap-2">
                                <div className="h-[2px] w-8 bg-emerald-500" />
                                <span className="text-[9px] font-black text-slate-400/80 uppercase tracking-widest">Secciones de Venta</span>
                           </div>
                      </div>
                      
                      {/* Ticket Promedio */}
                      <div>
                           <span className="text-[12px] font-black text-[#1e3a5f] block mb-2">Ticket Promedio</span>
                           <p className="text-[20px] font-black text-rose-600 mb-2">
                               RD${formatCurrency(products && products.length > 0 ? (products.reduce((acc, p) => acc + Number(p.sellingPrice), 0) / products.length) : 0)}
                           </p>
                           <div className="flex items-center gap-2">
                                <div className="h-[2px] w-8 bg-rose-500" />
                                <span className="text-[9px] font-black text-slate-400/80 uppercase tracking-widest">Estimado global</span>
                           </div>
                      </div>
                      
                      {/* Optimización */}
                      <div>
                           <span className="text-[12px] font-black text-[#1e3a5f] block mb-2">Optimización</span>
                           <p className="text-[20px] font-black text-amber-500 mb-2">88%</p>
                           <div className="flex items-center gap-2">
                                <div className="h-[2px] w-8 bg-amber-500" />
                                <span className="text-[9px] font-black text-slate-400/80 uppercase tracking-widest">Costo vs Precio</span>
                           </div>
                      </div>
                 </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveCategory("all")} className={cn("px-6 h-10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all", activeCategory === "all" ? "bg-white text-[#1e3a5f] shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-900")}>Todos</button>
                    {dynamicCats.map(cat => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={cn("px-6 h-10 rounded-full text-[11px] font-black uppercase tracking-widest transition-all", activeCategory === cat ? "bg-white text-[#1e3a5f] shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-900")}>{cat}</button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96">
                    <Input
                        placeholder="Buscar producto por nombre o SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 pl-6 rounded-full border-slate-200 bg-white shadow-sm focus-visible:ring-0 text-[11px] font-bold placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 bg-transparent animate-pulse">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1e3a5f]" />
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 text-center animate-enter">
                    <Package className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-black text-slate-500">Catálogo Vacío</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
                    {filteredProducts.map((product, idx) => (
                        <div
                            key={product.id}
                            onClick={() => handleEdit(product)}
                            className={cn(
                                "group bg-white p-6 flex flex-col justify-between cursor-pointer border border-transparent rounded-[32px] hover:border-slate-200 hover:shadow-lg transition-all duration-300 relative",
                                idx < 12 ? `animate-stagger-${(idx % 4) + 1}` : ""
                            )}
                        >
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {product.category || "General"}
                                     </span>
                                     <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                </div>
                                <h3 className="text-[16px] font-black text-[#1e3a5f] leading-snug line-clamp-2 min-h-[44px]">{product.name}</h3>
                                
                                <div className="flex items-center gap-3 mt-4">
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md">
                                         SKU: {product.sku || "AUTO"}
                                     </span>
                                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                         {product.currentStock} UNIDADES
                                     </span>
                                </div>
                            </div>

                            <div className="mt-8 flex items-end justify-between">
                                <span className="text-[22px] font-black text-[#1e3a5f] tracking-tighter">
                                    RD${formatCurrency(Number(product.sellingPrice) || 0)}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-[#1e3a5f] group-hover:text-white transition-all">
                                    <ArrowUpRight className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProductDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                existingCategories={dynamicCats}
            />

            {activeProduct && (
                <ProductDialog
                    product={activeProduct}
                    open={editOpen}
                    onOpenChange={(open) => { setEditOpen(open); if(!open) setActiveProduct(undefined); }}
                    onDelete={isDemo ? undefined : handleDelete}
                    existingCategories={dynamicCats}
                />
            )}
        </div>
    );
}
