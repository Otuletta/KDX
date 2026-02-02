"use client";

import "./pos-custom.css";
import { useState, useMemo } from "react"; // Added useMemo
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    ArrowUpRight,
    CreditCard,
    Banknote,
    QrCode,
    Loader2,
    Unlock,
    Lock,
    User,
    ChevronDown,
    LayoutGrid,
    List,
    ChefHat
} from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used for toasts

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useProducts, Product } from "@/hooks/use-products";
import {
    useSales,
    useCreateSale,
    useCashRegister,
    useOpenCashRegister,
    useCloseCashRegister
} from "@/hooks/use-sales";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

// --- Helper Components & Types ---

interface CartItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM, hh:mm a", { locale: es });
};

const paymentMethods = [
    { value: "EFECTIVO", label: "Efectivo", icon: Banknote },
    { value: "TARJETA", label: "Tarjeta", icon: CreditCard },
    { value: "TRANSFERENCIA", label: "Transf.", icon: QrCode },
];

// --- Dialog Components (Inline for simplicity, can be separated) ---

function OpenCashDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const [openingBalance, setOpeningBalance] = useState("");
    const openMutation = useOpenCashRegister();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await openMutation.mutateAsync({ openingBalance: parseFloat(openingBalance) || 0 });
            setOpeningBalance("");
            onOpenChange(false);
        } catch (error) {
            // Toast handled in hook
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Abrir Caja</DialogTitle>
                    <DialogDescription>
                        Ingresa el monto inicial en efectivo para abrir la caja.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="openingBalance" className="text-right">Monto Inicial</Label>
                        <Input
                            id="openingBalance"
                            type="number"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(e.target.value)}
                            className="col-span-3"
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={openMutation.isPending}>
                            {openMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Abrir Turno
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CloseCashDialog({ open, onOpenChange, registerId, expectedCash }: { open: boolean; onOpenChange: (open: boolean) => void; registerId: string; expectedCash: number }) {
    const [actualCash, setActualCash] = useState("");
    const [notes, setNotes] = useState("");
    const closeMutation = useCloseCashRegister();

    const cashValue = parseFloat(actualCash) || 0;
    const difference = cashValue - expectedCash;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await closeMutation.mutateAsync({
                id: registerId,
                actualCash: cashValue,
                notes
            });
            setActualCash("");
            setNotes("");
            onOpenChange(false);
        } catch (error) {
            // Toast handled in hook
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cerrar Caja</DialogTitle>
                    <DialogDescription>
                        Verifica el efectivo total en caja y confirma el cierre.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Esperado en Sistema:</span>
                                <span className="font-mono font-bold">{formatCurrency(expectedCash)}</span>
                            </div>
                            <div className={cn("flex justify-between text-sm font-medium", difference < 0 ? "text-destructive" : "text-green-600")}>
                                <span>Diferencia:</span>
                                <span className="font-mono">{difference > 0 ? "+" : ""}{formatCurrency(difference)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="actualCash" className="text-right">Efectivo Real</Label>
                            <Input
                                id="actualCash"
                                type="number"
                                value={actualCash}
                                onChange={(e) => setActualCash(e.target.value)}
                                className="col-span-3"
                                placeholder="0.00"
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="closeNotes" className="text-right">Notas</Label>
                            <Input
                                id="closeNotes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="col-span-3"
                                placeholder="Opcional..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" variant="destructive" disabled={closeMutation.isPending}>
                            {closeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmar Cierre
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Page Component ---

export default function CajaPage() {
    const [openCashDialog, setOpenCashDialog] = useState(false);
    const [closeCashDialog, setCloseCashDialog] = useState(false);

    // POS State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState("0");
    const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
    const [mobileView, setMobileView] = useState<"menu" | "cart">("menu"); // New mobile state
    const [customerName, setCustomerName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("Todos"); // Category Filter State

    // Debounce search
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Data Hooks
    const { data: registerData, isLoading: loadingRegister } = useCashRegister();
    // Pass search to useProducts for server-side filtering
    const { data: products, isLoading: loadingProducts } = useProducts({
        inStock: true,
        search: debouncedSearch
    });
    const { data: sales } = useSales({ today: true });
    const createMutation = useCreateSale();

    const cashOpen = !!registerData?.current;
    const currentRegister = registerData?.current;

    // Derive Categories from Products dynamically + static common ones
    const categories = useMemo(() => {
        if (!products) return ["Todos"];
        const uniqueCats = new Set<string>();
        products.forEach(p => {
            // Ensure category is a non-empty string
            if (p.category && typeof p.category === 'string' && p.category.trim() !== '') {
                uniqueCats.add(p.category);
            }
        });
        return ["Todos", ...Array.from(uniqueCats).sort()];
    }, [products]);

    // Filter products by category (Client side for now to maintain speed with cached products)
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => {
            const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
            return matchesCategory;
        });
    }, [products, activeCategory]);

    // Cart Calculations
    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = parseFloat(discount) || 0;
    const total = Math.max(0, subtotal - discountAmount);

    // Handlers
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { productId: product.id, productName: product.name, quantity: 1, unitPrice: Number(product.sellingPrice) || 0 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setDiscount("0");
        setCustomerName("");
        setPaymentMethod("EFECTIVO");
    };

    const handleCheckout = async () => {
        if (!currentRegister) return;

        try {
            await createMutation.mutateAsync({
                items: cart.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice
                })),
                discount: discountAmount,
                paymentMethod,
                customerName: customerName || undefined,
                cashRegisterId: currentRegister.id
            });
            clearCart();
        } catch (error) {
            // Error handling
        }
    };

    // Calculate Stats for Header
    const stats = useMemo(() => {
        if (!sales) return { cash: 0, count: 0 };
        const cashSales = sales.filter((s) => s.paymentMethod === "EFECTIVO");
        return {
            count: sales.length,
            cash: cashSales.reduce((sum, s) => sum + Number(s.total), 0),
        };
    }, [sales]);

    const expectedCash = currentRegister
        ? Number(currentRegister.openingBalance) + stats.cash
        : 0;

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4 animate-fade-in-up overflow-hidden relative">
            {/* Background Pattern */}
            <div className="fixed inset-0 pattern-dots opacity-20 pointer-events-none"></div>

            {/* Header / Loading State */}
            {loadingRegister && (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-fire" />
                </div>
            )}

            {!loadingRegister && !cashOpen && (
                <div className="flex flex-col items-center justify-center gap-6 h-full relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 animate-pulse rounded-full bg-fire/30 blur-3xl" />
                        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl gradient-dark shadow-2xl">
                            <Lock className="h-16 w-16 text-spice animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold tracking-tighter text-foreground drop-shadow-lg">La Caja está Cerrada</h1>
                        <p className="text-muted-foreground text-lg">Abre turno para comenzar a vender 🔥</p>
                    </div>
                    <Button
                        size="lg"
                        className="gradient-fire h-14 px-10 rounded-2xl text-lg shadow-2xl shadow-salsa/30 hover:scale-105 transition-all text-white font-bold"
                        onClick={() => setOpenCashDialog(true)}
                    >
                        <Unlock className="mr-2 h-6 w-6" /> Abrir Caja
                    </Button>
                    <OpenCashDialog open={openCashDialog} onOpenChange={setOpenCashDialog} />
                </div>
            )}

            {!loadingRegister && cashOpen && (
                <>
                    {/* Top Status Bar - Compact & Clean */}
                    <div className="shrink-0 glass-card flex items-center justify-between px-4 py-3 z-10">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl gradient-fresh flex items-center justify-center text-white shadow-lg animate-pulse-glow">
                                <Unlock className="h-6 w-6 drop-shadow-lg" />
                            </div>
                            <div>
                                <h1 className="font-bold text-xl leading-tight tracking-tight">Punto de Venta</h1>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> Cajero</span>
                                    <span>•</span>
                                    <span>{formatDate(currentRegister!.openedAt)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right glass px-4 py-2 rounded-xl shadow-lg">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Efectivo</p>
                                <p className="font-mono font-bold text-lg bg-gradient-to-r from-fresh to-fire bg-clip-text text-transparent">{formatCurrency(expectedCash)}</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setCloseCashDialog(true)} className="rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-lg hover:scale-105 transition-all">
                                <Lock className="mr-2 h-4 w-4" /> Cerrar Caja
                            </Button>
                        </div>
                    </div>

                    {/* Main Workspace split */}
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0 relative">

                        {/* LEFT: Product Catalog */}
                        <div className={cn("flex-1 flex flex-col gap-4 min-h-0 transition-opacity duration-300", mobileView === 'cart' ? 'hidden lg:flex' : 'flex')}>

                            {/* Search & Categories */}
                            <div className="shrink-0 space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        className="pl-12 h-12 bg-white dark:bg-card border-none rounded-2xl text-lg shadow-sm ring-1 ring-black/5 dark:ring-white/10 focus-visible:ring-2 focus-visible:ring-salsa/50 transition-all placeholder:text-muted-foreground/70"
                                        placeholder="Buscar producto..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 p-1 overflow-x-auto no-scrollbar mask-fade-right">
                                    {categories.map((cat, idx) => {
                                        const gradients = [
                                            'gradient-fire',
                                            'gradient-sunset',
                                            'gradient-fresh',
                                            'bg-gradient-to-r from-purple-500 to-pink-500'
                                        ];
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveCategory(cat)}
                                                className={cn(
                                                    "whitespace-nowrap px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 shadow-lg",
                                                    activeCategory === cat
                                                        ? `${gradients[idx % gradients.length]} text-white shadow-xl scale-110 animate-pulse-glow`
                                                        : "glass text-foreground hover:scale-105"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Masonry Grid - NOT traditional grid! */}
                            <ScrollArea className="flex-1 -mx-1 px-1">
                                <div className="pos-masonry-grid pb-32 lg:pb-4">
                                    {loadingProducts ? (
                                        [...Array(10)].map((_, i) => (
                                            <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
                                        ))
                                    ) : (
                                        filteredProducts.length > 0 ? (
                                            filteredProducts.map((product, idx) => {
                                                // Variable heights for masonry effect
                                                const heightClasses = ['product-card-tall', 'product-card-medium', 'product-card-short'];
                                                const heightClass = heightClasses[idx % 3];

                                                return (
                                                    <div key={product.id} className="pos-masonry-item">
                                                        <button
                                                            onClick={() => addToCart(product)}
                                                            className={`stagger-item product-card-unique ${heightClass} group w-full flex flex-col items-start justify-between p-0 glass-card hover:shadow-2xl transition-all duration-300 text-left relative overflow-hidden`}
                                                            style={{ animationDelay: `${idx * 0.05}s` }}
                                                        >
                                                            {/* Product Image / Placeholder */}
                                                            <div className="w-full h-32 overflow-hidden relative">
                                                                {product.imageUrl ? (
                                                                    <img
                                                                        src={product.imageUrl}
                                                                        alt={product.name}
                                                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 brightness-95"
                                                                    />
                                                                ) : (
                                                                    <div className="gradient-sunset h-full flex items-center justify-center">
                                                                        <ChefHat className="h-14 w-14 text-white/30 drop-shadow-2xl" />
                                                                    </div>
                                                                )}
                                                                {/* Shine effect */}
                                                                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -translate-x-full group-hover:translate-x-full"></div>
                                                                {/* Stock Badge on Image */}
                                                                <span className={cn(
                                                                    "absolute top-3 right-3 text-xs font-black px-2.5 py-1 rounded-full backdrop-blur-xl shadow-2xl border border-white/30",
                                                                    product.currentStock <= 5
                                                                        ? "bg-red-600/95 text-white"
                                                                        : "bg-emerald-600/95 text-white"
                                                                )}>
                                                                    {product.currentStock}
                                                                </span>
                                                            </div>

                                                            {/* Product Info */}
                                                            <div className="w-full p-4 space-y-2 bg-gradient-to-b from-white/50 to-white/80 dark:from-deep/50 dark:to-deep/80 backdrop-blur-sm">
                                                                <h3 className="font-bold text-base leading-tight text-foreground line-clamp-2 group-hover:text-salsa transition-colors">{product.name}</h3>
                                                                <div className="flex items-end justify-between">
                                                                    <span className="font-mono text-2xl font-black bg-gradient-to-r from-salsa via-fire to-spice bg-clip-text text-transparent drop-shadow-lg">
                                                                        {formatCurrency(Number(product.sellingPrice))}
                                                                    </span>
                                                                    <div className="h-8 w-8 rounded-full gradient-fire flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                                                        <Plus className="h-5 w-5 text-white" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Glow effect */}
                                                            <div className="absolute inset-0 bg-gradient-to-br from-salsa/5 via-fire/10 to-spice/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground">
                                                <Search className="h-12 w-12 mb-4 opacity-20" />
                                                <p className="text-lg font-medium">No se encontraron productos</p>
                                                <p className="text-sm opacity-60">Intenta con otra búsqueda o categoría</p>
                                            </div>
                                        )

                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* RIGHT: Cart Panel - ALWAYS VISIBLE ON DESKTOP */}
                        <div className={cn(
                            "w-[460px] shrink-0 flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-3xl shadow-2xl overflow-hidden relative z-20 border-2 border-fire/20",
                            mobileView === 'cart' ? 'fixed inset-0 flex lg:flex' : 'hidden lg:flex'
                        )}>
                            {/* Mobile Header for Cart */}
                            <div className="lg:hidden p-4 flex items-center gap-2 border-b border-fire/20 bg-orange-100/80 backdrop-blur-md">
                                <Button variant="ghost" size="icon" onClick={() => setMobileView('menu')} className="-ml-2 text-gray-900">
                                    <ChevronDown className="h-6 w-6 rotate-90" />
                                </Button>
                                <span className="font-bold text-lg text-gray-900">Orden Actual</span>
                            </div>

                            {/* Cart Header */}
                            <div className="p-5 border-b border-fire/20 bg-gradient-to-br from-fire/10 to-salsa/10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl gradient-fire flex items-center justify-center text-white shadow-lg animate-pulse-glow">
                                            <ShoppingCart className="h-6 w-6 drop-shadow-lg" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-xl leading-none text-gray-900 drop-shadow-sm">Nueva Orden</h2>
                                            <p className="text-xs text-fire font-semibold mt-1">Items: {cart.reduce((acc, i) => acc + i.quantity, 0)}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-gray-600 hover:text-destructive hover:bg-destructive/20 rounded-xl" onClick={clearCart} disabled={cart.length === 0}>
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                                {/* Customer Input */}
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input
                                        className="pl-9 h-11 bg-white border-orange-200 text-gray-900 placeholder:text-gray-400 focus:border-fire focus:ring-fire/30 rounded-xl"
                                        placeholder="Nombre del Cliente (Opcional)"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Cart Items List */}
                            <ScrollArea className="flex-1 bg-gradient-to-b from-orange-50/50 to-amber-50/50">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none">
                                        <div className="h-24 w-24 rounded-full bg-fire/10 mb-4 flex items-center justify-center">
                                            <ShoppingCart className="h-10 w-10 text-fire/40" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-900">El carrito está vacío</p>
                                        <p className="text-sm max-w-[200px] mt-2 text-gray-600">Agrega productos del menú para comenzar una orden.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 space-y-3">
                                        {cart.map((item) => (
                                            <div key={item.productId} className="group flex items-start justify-between p-3 rounded-2xl bg-white border-2 border-orange-100 hover:border-fire/30 hover:shadow-md transition-all">
                                                <div className="flex-1 min-w-0 pr-3">
                                                    <p className="font-bold text-sm text-gray-900 truncate">{item.productName}</p>
                                                    <p className="text-xs text-fire font-mono mt-0.5 font-semibold">{formatCurrency(item.unitPrice)} c/u</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center bg-orange-50 rounded-lg border-2 border-orange-200 h-8">
                                                        <button
                                                            className="w-8 h-full flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-l-lg transition-colors"
                                                            onClick={() => item.quantity > 1 ? updateQuantity(item.productId, -1) : removeFromCart(item.productId)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </button>
                                                        <span className="w-6 text-center text-xs font-black font-mono text-gray-900">{item.quantity}</span>
                                                        <button
                                                            className="w-8 h-full flex items-center justify-center text-gray-600 hover:text-fire hover:bg-orange-100 rounded-r-lg transition-colors"
                                                            onClick={() => updateQuantity(item.productId, 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                    <p className="font-mono font-black text-sm min-w-[3.5rem] text-right bg-gradient-to-r from-fire to-salsa bg-clip-text text-transparent">{formatCurrency(item.quantity * item.unitPrice)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>


                            {/* Summary & Checkout Section */}
                            <div className="p-5 bg-gradient-to-br from-orange-100/80 via-amber-100/80 to-yellow-100/80 border-t-2 border-fire/20 space-y-5">

                                {/* Discounts & Payment Method */}
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="flex-1 bg-white rounded-xl p-1 shadow-sm border-2 border-orange-200 grid grid-cols-3 gap-1">
                                            {paymentMethods.map(m => {
                                                const Icon = m.icon;
                                                return (
                                                    <button
                                                        key={m.value}
                                                        onClick={() => setPaymentMethod(m.value)}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center py-3 rounded-xl text-xs font-bold gap-2 transition-all duration-300",
                                                            paymentMethod === m.value
                                                                ? "gradient-fire text-white scale-110 shadow-lg"
                                                                : "bg-orange-50 text-gray-700 hover:bg-orange-100 hover:scale-105"
                                                        )}
                                                    >
                                                        <Icon className="h-5 w-5" />
                                                        {m.label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <div className="w-20 shrink-0">
                                            <div className="relative h-full">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-bold">%</span>
                                                <Input
                                                    className="h-full pl-6 text-center font-mono text-sm bg-white border-orange-200 shadow-sm rounded-xl focus:ring-1 focus:ring-fire"
                                                    placeholder="0"
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-fire/20" />

                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-mono">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-fire font-semibold">
                                            <span>Descuento</span>
                                            <span className="font-mono">-{formatCurrency(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-end pt-3 border-t border-fire/20">
                                        <span className="text-base font-bold text-gray-900">Total a Cobrar</span>
                                        <span className="text-4xl font-extrabold bg-gradient-to-r from-fire via-salsa to-spice bg-clip-text text-transparent tracking-tight font-mono">{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl gradient-fire hover:scale-105 text-white font-bold text-lg shadow-xl shadow-fire/40 transition-all relative overflow-hidden group"
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0 || createMutation.isPending}
                                >
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    {createMutation.isPending ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            <ArrowUpRight className="mr-2 h-6 w-6" /> Procesar Pago
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                    </div>

                    {/* Mobile Sticky Footer (Only visible in Menu View) */}
                    <div className={cn("lg:hidden absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent z-50", mobileView === 'menu' ? 'flex' : 'hidden')}>
                        <Button
                            size="lg"
                            className="w-full shadow-2xl bg-foreground text-background hover:bg-foreground/90 rounded-full h-14 text-base font-bold flex justify-between px-6"
                            onClick={() => setMobileView('cart')}
                        >
                            <div className="flex items-center gap-2">
                                <span className="bg-background/20 px-2 py-0.5 rounded-md text-sm">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
                                <span>Ver Orden</span>
                            </div>
                            <span className="font-mono">{formatCurrency(total)}</span>
                        </Button>
                    </div>


                    <CloseCashDialog
                        open={closeCashDialog}
                        onOpenChange={setCloseCashDialog}
                        registerId={currentRegister!.id}
                        expectedCash={expectedCash}
                    />
                </>
            )
            }
        </div >
    );
}
