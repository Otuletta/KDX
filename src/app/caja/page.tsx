"use client";

import "./pos-custom.css";
import { useState, useMemo, useEffect } from "react";
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
    ShoppingBag,
    X,
    User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useProducts, Product } from "@/hooks/use-products";
import { useSales, useCreateSale, useCashRegister } from "@/hooks/use-sales";
import { useDemo } from "@/hooks/use-demo";
import { useDebounce } from "@/hooks/use-debounce";

interface CartItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
        minimumFractionDigits: 2,
    }).format(amount);
};

export default function CajaPage() {
    const { isDemo } = useDemo();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState("0");
    const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");
    const [customerName, setCustomerName] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [mobileCartOpen, setMobileCartOpen] = useState(false);

    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const debouncedSearch = useDebounce(searchTerm, 300);
    const { data: products, isLoading: loadingProducts } = useProducts({ search: debouncedSearch, inStock: true });
    const { data: registerData } = useCashRegister();
    const createMutation = useCreateSale();

    const currentRegisterId = registerData?.current?.id;

    const categories = useMemo(() => {
        if (!products) return ["all"];
        const cats = new Set<string>();
        products.forEach(p => { if (p.category) cats.add(p.category); });
        return ["all", ...Array.from(cats).sort()];
    }, [products]);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => activeCategory === "all" || p.category === activeCategory);
    }, [products, activeCategory]);

    const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discountAmount = parseFloat(discount) || 0;
    const total = Math.max(0, subtotal - discountAmount);

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
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const handleCheckout = async () => {
        if (cart.length === 0 || isCheckingOut) return;
        setIsCheckingOut(true);
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
                cashRegisterId: currentRegisterId
            });
            setCart([]);
            setCustomerName("");
            setDiscount("0");
            setMobileCartOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-100px)] gap-6 p-6 animate-enter antialiased font-sans bg-[#eef1f5]">
            {/* CATALOG SECTION */}
            <div className="flex-1 flex flex-col min-h-0 gap-6">
                
                {/* Header Information Aura POS Classic Style */}
                <div className="aura-header-card rounded-[32px] pt-2">
                    <div className="flex-1 flex items-center justify-between w-full flex-wrap gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-[#1e3a5f] tracking-tighter italic uppercase leading-none">TERMINAL POS</h1>
                            <p className="text-[10px] font-bold text-[#1e3a5f]/60 uppercase tracking-[0.2em] flex items-center gap-1.5 mt-1.5">
                                <ShoppingCart className="w-3.5 h-3.5 text-[#ef4444]" /> TERMINAL ACTIVA DE VENTAS
                            </p>
                        </div>

                        {/* Middle Categories */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar bg-white rounded-full p-1.5 border border-slate-200">
                             {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        "px-6 h-9 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
                                        activeCategory === cat 
                                            ? "bg-[#ef4444] text-white shadow-md shadow-red-500/20" 
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                >
                                    {cat === 'all' ? 'Todos' : cat}
                                </button>
                            ))}
                        </div>

                        {/* Clock */}
                        <div className="text-right">
                             <p className="text-4xl font-black text-[#ef4444] leading-none tracking-tighter">{format(currentTime, "HH:mm")}</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar - Full Width Rounded Box */}
                 <div className="relative w-full bg-white rounded-[24px] shadow-sm border border-slate-100 p-1">
                    <Input
                        placeholder="Busca un producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 pl-6 rounded-[20px] bg-transparent border-none focus-visible:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
                    />
                </div>

                {/* Grid de Productos - Aura Robust Cards */}
                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 pb-20 lg:pb-0 relative">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {loadingProducts ? (
                            [...Array(12)].map((_, i) => (
                                <div key={i} className="h-32 rounded-[24px] bg-white border border-slate-100/50 animate-pulse" />
                            ))
                        ) : filteredProducts.map((product, i) => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className={cn(
                                    "bg-white rounded-[24px] p-5 border border-slate-200/60 shadow-sm hover:border-[#1e3a5f] hover:shadow-xl transition-all text-left flex flex-col justify-between h-[140px] relative overflow-hidden group",
                                    i < 12 ? `animate-stagger-${(i % 4) + 1}` : ""
                                )}
                            >
                                <div className="space-y-1 z-10">
                                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest block">{product.category || "General"}</span>
                                    <h3 className="text-[13px] font-black text-[#1e3a5f] leading-tight line-clamp-2">
                                        {product.name}
                                    </h3>
                                </div>
                                <div className="z-10 mt-auto">
                                    <p className="text-[14px] font-black text-[#ef4444]">
                                        RD${formatCurrency(Number(product.sellingPrice))}
                                    </p>
                                </div>
                                {/* Subtle background icon decor */}
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-black group-hover:scale-110 transition-transform pointer-events-none">
                                    <ShoppingCart className="w-24 h-24" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CART SIDEBAR - Aura Classic White Robust Panel */}
            <div className={cn(
                "fixed inset-0 lg:relative lg:inset-auto z-50 lg:flex w-full lg:w-[350px] flex-col transition-transform duration-500",
                mobileCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
            )}>
                {/* Mobile Backdrop */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md lg:hidden h-screen" onClick={() => setMobileCartOpen(false)} />
                
                <div className="relative mt-[10vh] lg:mt-0 bg-white rounded-t-[40px] lg:rounded-[32px] border border-slate-200 h-full shadow-lg flex flex-col overflow-hidden">
                    {/* Cart Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                         <div className="space-y-0.5">
                            <h2 className="text-[20px] font-black text-[#1e3a5f] tracking-tight uppercase italic leading-none">ORDEN</h2>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TERMINAL ACTIVA</p>
                        </div>
                        <div className="h-10 w-10 bg-[#a5d5d8] rounded-[14px] flex items-center justify-center text-[#1e3a5f]">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <Plus className="w-16 h-16 text-slate-100 mb-4" />
                                <p className="text-[11px] font-black text-slate-200 uppercase tracking-[0.2em]">CARRITO VACÍO</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-2">
                                {cart.map((item, idx) => (
                                    <div key={item.productId} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-[11px] font-black text-[#1e3a5f] uppercase leading-tight pr-4">{item.productName}</h4>
                                            <button onClick={() => removeFromCart(item.productId)} className="text-slate-400 hover:text-red-500">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2 bg-white rounded-md border border-slate-200 p-0.5">
                                                <button onClick={() => updateQuantity(item.productId, -1)} className="h-5 w-5 bg-slate-50 rounded-sm flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                                                <span className="text-[10px] font-black px-1">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.productId, 1)} className="h-5 w-5 bg-slate-50 rounded-sm flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                                            </div>
                                            <div className="text-right">
                                                 <span className="text-[12px] font-black text-[#1e3a5f]">RD${formatCurrency(item.quantity * item.unitPrice)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer / Checkout */}
                    <div className="bg-[#eef5f5] p-6 space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[10px] font-black text-[#1e3a5f] uppercase">
                                <span>SUBTOTAL</span>
                                <span>RD${formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black text-[#1e3a5f] uppercase">
                                <span>DESC.</span>
                                <Input
                                    className="h-7 w-20 bg-transparent border border-slate-300 text-right font-black rounded-lg px-2 shadow-none focus-visible:ring-0"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                />
                            </div>
                            <div className="w-full h-px bg-slate-200 my-2" />
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TOTAL NETO</span>
                                <span className="text-3xl font-black text-[#1e3a5f] tracking-tighter">RD${formatCurrency(total)}</span>
                            </div>
                        </div>

                        {/* Payment Methods Pill style */}
                        <div className="grid grid-cols-3 gap-2">
                             {[
                                { id: "EFECTIVO", icon: Banknote },
                                { id: "TARJETA", icon: CreditCard },
                                { id: "TRANSFERENCIA", icon: QrCode }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setPaymentMethod(m.id)}
                                    className={cn(
                                        "h-12 flex items-center justify-center rounded-[16px] transition-all",
                                        paymentMethod === m.id
                                            ? "bg-[#ef4444] text-white"
                                            : "bg-slate-200/70 text-slate-500 hover:bg-slate-300"
                                    )}
                                >
                                    <m.icon className="h-5 w-5" />
                                </button>
                            ))}
                        </div>

                        {/* Checkout Button - Massive Pale Red */}
                        <Button
                            className="h-14 w-full bg-[#eca3a3] hover:bg-[#e48f8f] text-white font-black text-[14px] uppercase tracking-widest rounded-2xl shadow-none"
                            disabled={cart.length === 0 || isCheckingOut || isDemo}
                            onClick={() => handleCheckout()}
                        >
                            {isCheckingOut ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>COBRAR ↗</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
