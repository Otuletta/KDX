"use client";

import { useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/calculations";

export interface InvoiceData {
    invoiceNumber: string;
    date: string;
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessRNC: string;
    customerName: string;
    items: {
        quantity: number;
        description: string;
        unitPrice: number;
        subtotal: number;
    }[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    notes?: string;
}

export function InvoicePrinter({
    data,
    onPrintComplete,
}: {
    data: InvoiceData | null;
    onPrintComplete: () => void;
}) {
    const printRef = useRef<HTMLDivElement>(null);
    const hasPrinted = useRef(false);

    useEffect(() => {
        if (data && !hasPrinted.current) {
            hasPrinted.current = true;
            // Allow DOM to render
            setTimeout(() => {
                window.print();
                setTimeout(() => {
                    hasPrinted.current = false;
                    onPrintComplete();
                }, 500);
            }, 300);
        }
    }, [data, onPrintComplete]);

    if (!data) return null;

    const paymentLabels: Record<string, string> = {
        EFECTIVO: "Efectivo",
        TARJETA: "Tarjeta",
        TRANSFERENCIA: "Transferencia",
    };

    return (
        <div
            id="printable-invoice"
            ref={printRef}
            className="fixed -top-[9999px] left-0 bg-white text-black p-10 w-[210mm]"
            style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", borderBottom: "2px solid #000", paddingBottom: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{data.businessName}</h1>
                    <p style={{ fontSize: "12px", color: "#555", margin: "4px 0 0" }}>{data.businessAddress}</p>
                    <p style={{ fontSize: "12px", color: "#555", margin: "2px 0 0" }}>Tel: {data.businessPhone}</p>
                    <p style={{ fontSize: "12px", color: "#555", margin: "2px 0 0" }}>RNC: {data.businessRNC}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0, color: "#333" }}>FACTURA</h2>
                    <p style={{ fontSize: "13px", margin: "4px 0 0", fontWeight: 600 }}>{data.invoiceNumber}</p>
                    <p style={{ fontSize: "12px", color: "#555", margin: "4px 0 0" }}>
                        Fecha: {new Date(data.date).toLocaleDateString("es-DO")}
                    </p>
                </div>
            </div>

            {/* Customer */}
            <div style={{ marginBottom: "24px", background: "#f5f5f5", padding: "12px 16px", borderRadius: "4px" }}>
                <p style={{ fontSize: "12px", color: "#777", margin: 0 }}>FACTURADO A:</p>
                <p style={{ fontSize: "14px", fontWeight: 600, margin: "4px 0 0" }}>{data.customerName}</p>
            </div>

            {/* Items Table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "24px" }}>
                <thead>
                    <tr style={{ borderBottom: "2px solid #ddd" }}>
                        <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "11px", fontWeight: 600, color: "#555", textTransform: "uppercase" }}>Cant.</th>
                        <th style={{ textAlign: "left", padding: "10px 8px", fontSize: "11px", fontWeight: 600, color: "#555", textTransform: "uppercase" }}>Descripción</th>
                        <th style={{ textAlign: "right", padding: "10px 8px", fontSize: "11px", fontWeight: 600, color: "#555", textTransform: "uppercase" }}>P. Unit.</th>
                        <th style={{ textAlign: "right", padding: "10px 8px", fontSize: "11px", fontWeight: 600, color: "#555", textTransform: "uppercase" }}>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {data.items.map((item, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "10px 8px", fontSize: "13px" }}>{item.quantity}</td>
                            <td style={{ padding: "10px 8px", fontSize: "13px" }}>{item.description}</td>
                            <td style={{ padding: "10px 8px", fontSize: "13px", textAlign: "right" }}>{formatCurrency(item.unitPrice)}</td>
                            <td style={{ padding: "10px 8px", fontSize: "13px", textAlign: "right", fontWeight: 500 }}>{formatCurrency(item.subtotal)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ width: "260px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px" }}>
                        <span style={{ color: "#555" }}>Subtotal:</span>
                        <span>{formatCurrency(data.subtotal)}</span>
                    </div>
                    {data.discount > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px" }}>
                            <span style={{ color: "#555" }}>Descuento:</span>
                            <span style={{ color: "#ef4444" }}>-{formatCurrency(data.discount)}</span>
                        </div>
                    )}
                    {data.tax > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px" }}>
                            <span style={{ color: "#555" }}>ITBIS (18%):</span>
                            <span>{formatCurrency(data.tax)}</span>
                        </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "16px", fontWeight: "bold", borderTop: "2px solid #000", marginTop: "8px" }}>
                        <span>TOTAL:</span>
                        <span>{formatCurrency(data.total)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "12px", color: "#555" }}>
                        <span>Método de pago:</span>
                        <span>{paymentLabels[data.paymentMethod] || data.paymentMethod}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: "40px", borderTop: "1px solid #ddd", paddingTop: "16px", textAlign: "center" }}>
                {data.notes && (
                    <p style={{ fontSize: "12px", color: "#777", margin: "0 0 8px" }}>{data.notes}</p>
                )}
                <p style={{ fontSize: "11px", color: "#999", margin: 0 }}>
                    Este documento fue generado electrónicamente por KDX Core
                </p>
            </div>
        </div>
    );
}
