"use client";

import { AppShell } from "@/components/app-shell";
import { Settings, Store, Bell, Shield, Palette, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
    return (

        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
                <p className="text-muted-foreground">Configurar preferencias del restaurante.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Settings Sidebar */}
                <div className="glass-card p-4 h-fit">
                    <nav className="flex flex-col gap-1">
                        <Button variant="ghost" className="justify-start gap-3 bg-muted text-foreground hover:bg-muted/80">
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
                <div className="glass-card p-8 md:col-span-2 space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Store className="h-5 w-5 text-salsa" />
                            Información General
                        </h2>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Nombre del Restaurante</label>
                                <input
                                    className="w-full bg-background border border-input rounded-lg py-2 px-3 text-sm text-foreground focus:border-salsa/50 focus:outline-none transition-colors"
                                    defaultValue="Salséalo"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-foreground">Ubicación</label>
                                <input
                                    className="w-full bg-background border border-input rounded-lg py-2 px-3 text-sm text-foreground focus:border-salsa/50 focus:outline-none transition-colors"
                                    defaultValue="Santo Domingo, RD"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-lime" />
                            Preferencias del Sistema
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">Efectos de Sonido</p>
                                    <p className="text-xs text-muted-foreground">Reproducir sonidos al recibir pedidos.</p>
                                </div>
                                <div className="w-10 h-6 bg-salsa rounded-full relative cursor-pointer">
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
                        <Button className="bg-salsa hover:bg-salsa-dark text-white px-8">
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
