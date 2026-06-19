"use client";

import { Store, Bell, Shield, Palette, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    return (

        <div className="flex flex-col gap-6 max-w-4xl mx-auto py-6 relative z-10 w-full animate-fade-in">
            {/* Header Cockpit */}
            <div className="bg-card w-full rounded-[2.5rem] p-8 md:p-12 border border-border shadow-[0_20px_60px_rgb(0,0,0,0.05)] mb-6 relative overflow-hidden flex flex-col md:flex-row gap-8 justify-between items-center group">
                <div className="absolute top-0 left-0 w-full h-[8px] bg-gradient-to-r from-slate-500 via-gray-500 to-zinc-500 opacity-80" />
                <div className="absolute -inset-1 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-overlay" />
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-foreground/5 rounded-full blur-[60px] pointer-events-none" />
                
                <div className="flex-1 relative z-10 text-center md:text-left">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground uppercase drop-shadow-sm mb-4 animate-in slide-in-from-left-8 fade-in duration-700">
                        Sistema
                    </h1>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 animate-in slide-in-from-left-4 fade-in duration-700 delay-150 fill-mode-both">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        Configuración y Preferencias
                    </p>
                </div>
                
                <div className="relative z-10 flex flex-col items-center md:items-end gap-6">
                    <div className="flex gap-8 text-center md:text-right">
                        <div>
                            <p className="text-[3rem] font-black text-primary font-mono tracking-tighter leading-none">V2.4</p>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Versión Salsealo OS</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Settings Sidebar */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-4 h-fit">
                    <nav className="flex flex-col gap-2">
                        <Button variant="ghost" className="justify-start gap-3 bg-muted text-foreground hover:bg-muted/80 rounded-xl">
                            <Store className="h-4 w-4" /> General
                        </Button>
                        <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                            <Palette className="h-4 w-4" /> Apariencia
                        </Button>
                        <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                            <Bell className="h-4 w-4" /> Notificaciones
                        </Button>
                        <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                            <Smartphone className="h-4 w-4" /> Dispositivos (POS)
                        </Button>
                        <Button variant="ghost" className="justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/50">
                            <Shield className="h-4 w-4" /> Seguridad
                        </Button>
                    </nav>
                </div>

                {/* Settings Content */}
                <div className="bg-card border border-border shadow-sm rounded-2xl p-8 md:col-span-2 space-y-8">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Store className="h-5 w-5 text-primary" />
                            Información General
                        </h2>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Nombre del Restaurante</label>
                                <input
                                    className="w-full bg-background border border-input rounded-lg py-2 px-3 text-sm text-foreground focus:border-brand-primary/50 focus:outline-none transition-colors"
                                    defaultValue="Salséalo"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Ubicación</label>
                                <input
                                    className="w-full bg-background border border-input rounded-lg py-2 px-3 text-sm text-foreground focus:border-brand-primary/50 focus:outline-none transition-colors"
                                    defaultValue="Santo Domingo, RD"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            Preferencias del Sistema
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Efectos de Sonido</p>
                                    <p className="text-xs text-muted-foreground">Reproducir sonidos al recibir pedidos.</p>
                                </div>
                                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Auto-Imprimir Recibos</p>
                                    <p className="text-xs text-muted-foreground">Imprimir inmediatamente después del pago.</p>
                                </div>
                                <div className="w-10 h-6 bg-muted rounded-full relative cursor-pointer border border-border">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-muted-foreground rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 px-8 font-medium shadow-sm transition-all">
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
