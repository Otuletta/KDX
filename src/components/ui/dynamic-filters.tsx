"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterConfig {
    key: string;
    label: string;
    type: "text" | "select" | "date" | "dateRange" | "number";
    placeholder?: string;
    options?: { label: string; value: string }[];
}

export interface FilterValues {
    [key: string]: string;
}

interface DynamicFiltersProps {
    filters: FilterConfig[];
    values: FilterValues;
    onChange: (values: FilterValues) => void;
    className?: string;
}

export function DynamicFilters({ filters, values, onChange, className }: DynamicFiltersProps) {
    const [expanded, setExpanded] = useState(false);

    const activeCount = Object.values(values).filter(Boolean).length;

    const handleChange = (key: string, value: string) => {
        onChange({ ...values, [key]: value });
    };

    const handleClear = () => {
        const cleared: FilterValues = {};
        filters.forEach((f) => (cleared[f.key] = ""));
        onChange(cleared);
    };

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                        expanded || activeCount > 0
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            : "bg-[#1E2130] border-[#2A2D36] text-[#94A3B8] hover:text-white"
                    )}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                    {activeCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-xs font-bold">
                            {activeCount}
                        </span>
                    )}
                </button>
                {activeCount > 0 && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-[#94A3B8] hover:text-red-400 transition-colors"
                    >
                        <X className="h-3 w-3" />
                        Limpiar
                    </button>
                )}
            </div>

            {expanded && (
                <div className="flex flex-wrap gap-3 p-4 rounded-xl surface-card animate-fade-in">
                    {filters.map((filter) => {
                        switch (filter.type) {
                            case "text":
                                return (
                                    <div key={filter.key} className="flex-1 min-w-[180px]">
                                        <label className="text-xs font-medium text-[#64748B] mb-1 block">
                                            {filter.label}
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B]" />
                                            <input
                                                type="text"
                                                placeholder={filter.placeholder || `Buscar...`}
                                                value={values[filter.key] || ""}
                                                onChange={(e) => handleChange(filter.key, e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0F1117] border border-[#2A2D36] text-sm text-white placeholder:text-[#475569] focus:border-indigo-500 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                );
                            case "select":
                                return (
                                    <div key={filter.key} className="flex-1 min-w-[160px]">
                                        <label className="text-xs font-medium text-[#64748B] mb-1 block">
                                            {filter.label}
                                        </label>
                                        <select
                                            value={values[filter.key] || ""}
                                            onChange={(e) => handleChange(filter.key, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-[#0F1117] border border-[#2A2D36] text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                        >
                                            <option value="">Todos</option>
                                            {filter.options?.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            case "date":
                            case "dateRange":
                                return (
                                    <div key={filter.key} className="flex-1 min-w-[160px]">
                                        <label className="text-xs font-medium text-[#64748B] mb-1 block">
                                            {filter.label}
                                        </label>
                                        <input
                                            type="date"
                                            value={values[filter.key] || ""}
                                            onChange={(e) => handleChange(filter.key, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-[#0F1117] border border-[#2A2D36] text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                );
                            case "number":
                                return (
                                    <div key={filter.key} className="flex-1 min-w-[120px]">
                                        <label className="text-xs font-medium text-[#64748B] mb-1 block">
                                            {filter.label}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder={filter.placeholder || "0"}
                                            value={values[filter.key] || ""}
                                            onChange={(e) => handleChange(filter.key, e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-[#0F1117] border border-[#2A2D36] text-sm text-white focus:border-indigo-500 focus:outline-none transition-colors"
                                        />
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>
            )}
        </div>
    );
}
