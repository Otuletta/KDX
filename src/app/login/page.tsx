"use client";

import { useState, useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, { error: "" });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative">
      {/* Immersive Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      />
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[8px]" />

      {/* Central Login Card */}
      <div className="relative z-10 w-full max-w-[420px] px-6">
        <div className="bg-white/95 backdrop-blur-3xl border border-white/40 p-8 sm:p-10 rounded-[24px] shadow-2xl">
          
          <div className="flex flex-col items-center text-center space-y-6 mb-8">
            <Logo 
              className="scale-125" 
              iconClassName="w-10 h-10 text-[var(--primary)]" 
              textClassName="hidden" 
              showText={false} 
            />
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                KDX
              </h1>
              <p className="text-sm font-medium text-slate-500 max-w-[250px] mx-auto leading-relaxed">
                Plataforma integral para operaciones gastronómicas.
              </p>
            </div>
          </div>

          {state?.error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 text-sm font-medium text-red-600 flex items-center gap-2 border border-red-100">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700" htmlFor="email">
                Correo Electrónico
              </label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required
                placeholder="usuario@restaurante.com"
                className="h-11 text-sm bg-white border-slate-200 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 shadow-sm transition-all rounded-xl"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700" htmlFor="password">
                  Contraseña
                </label>
                <a href="#" className="text-[11px] font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors uppercase tracking-wider">
                  ¿Olvidaste?
                </a>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  autoComplete="current-password" 
                  required
                  placeholder="••••••••"
                  className="h-11 text-sm bg-white border-slate-200 focus:border-[var(--primary)] focus:ring-[var(--primary)]/20 shadow-sm pr-10 transition-all rounded-xl"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={pending} 
                className="w-full h-11 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm shadow-md transition-all rounded-xl cursor-pointer"
              >
                  {pending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null} 
                  Iniciar Sesión
              </Button>
            </div>
          </form>

        </div>

        {/* Footer outside the card */}
        <div className="text-center mt-6">
            <p className="text-[11px] font-semibold text-white/60 tracking-wider">
              © 2025 KDX · Acceso Seguro
            </p>
        </div>
      </div>
    </div>
  );
}
