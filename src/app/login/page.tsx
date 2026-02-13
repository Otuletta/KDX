"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ChefHat, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const [state, formAction, isPending] = useActionState(login, null);

    useEffect(() => {
        if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center relative overflow-hidden">
            {/* Animated Gradient Background - WARM LIGHT */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100"></div>

            {/* Floating Pattern Overlays */}
            <div className="absolute inset-0 pattern-dots opacity-5"></div>

            {/* Gradient Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fire/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-salsa/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            {/* Main Login Card */}
            <div className="z-10 w-full max-w-md p-8 animate-bounce-in">
                <div className="bg-white overflow-hidden rounded-[2rem] border-4 border-fire/20 shadow-2xl">
                    {/* Header */}
                    <div className="flex flex-col items-center justify-center p-10 pb-6 text-center bg-gradient-to-b from-orange-50 to-transparent">
                        <div className="relative mb-8 animate-pulse-glow">
                            <div className="absolute inset-0 bg-fire/20 rounded-3xl blur-3xl"></div>
                            <div className="relative flex h-40 w-40 items-center justify-center">
                                <Image
                                    src="/logo-transparent.png"
                                    alt="Salséalo Logo"
                                    width={160}
                                    height={160}
                                    className="h-full w-full object-contain drop-shadow-2xl"
                                    priority
                                />
                            </div>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3 drop-shadow-sm">
                            Salséalo
                        </h1>
                        <div className="flex items-center gap-2 text-gray-700 text-sm font-semibold">
                            <ChefHat className="h-4 w-4 text-fire" />
                            <p>Sistema de Gestión Gastronómica</p>
                        </div>
                        <div className="mt-4 h-1 w-20 bg-gradient-to-r from-salsa via-fire to-spice rounded-full"></div>
                    </div>

                    <div className="p-8 pt-6">
                        <form action={formAction} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-900 font-semibold text-sm">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    required
                                    className="bg-orange-50 border-orange-200 text-gray-900 placeholder:text-gray-400 focus:border-fire focus:ring-fire/50 h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-900 font-semibold text-sm">Contraseña</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="bg-orange-50 border-orange-200 text-gray-900 placeholder:text-gray-400 focus:border-fire focus:ring-fire/50 h-12 rounded-xl"
                                />
                            </div>

                            {state?.error && (
                                <div className="flex items-center gap-2 rounded-xl bg-red-100 p-3 text-sm text-red-800 border-2 border-red-300 animate-fade-in">
                                    <AlertCircle className="h-4 w-4" />
                                    <p>{state.error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full gradient-fire hover:scale-105 text-white font-bold h-12 shadow-2xl shadow-salsa/30 transition-all mt-6 rounded-xl text-base relative overflow-hidden group"
                                disabled={isPending}
                            >
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                {isPending ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Iniciando...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 relative z-10">
                                        <Sparkles className="h-5 w-5" />
                                        <span>Iniciar Sesión</span>
                                    </div>
                                )}
                            </Button>
                        </form>

                        <form action={async () => {
                            const { loginDemo } = await import("@/app/actions/auth");
                            await loginDemo();
                        }}>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full mt-4 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-bold h-12 rounded-xl transition-all"
                            >
                                Ingresar como Demo
                            </Button>
                        </form>
                    </div>

                    <div className="bg-orange-50 p-4 text-center text-xs text-gray-600 border-t border-fire/20">
                        © 2026 Salsealo Manager v1.0 🔥
                    </div>
                </div>

                {/* Floating Badge */}
                <div className="mt-6 flex justify-center">
                    <div className="bg-white px-4 py-2 rounded-full border-2 border-fire/20 text-xs text-gray-700 flex items-center gap-2 shadow-lg">
                        <div className="h-2 w-2 rounded-full bg-fresh animate-pulse"></div>
                        <span className="font-semibold">Sistema Activo</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
