"use client";

import { useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/calculations";

export interface ReceiptData {
    saleId: string;
    date: string;
    cashRegister: string;
    customerName: string;
    items: {
        quantity: number;
        name: string;
        unitPrice: number;
        subtotal: number;
    }[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
}

export function ReceiptPrinter({
    data,
    onPrintComplete,
}: {
    data: ReceiptData | null;
    onPrintComplete: () => void;
}) {
    const printRef = useRef<HTMLDivElement>(null);
    const hasPrinted = useRef(false);

    useEffect(() => {
        if (data && !hasPrinted.current) {
            hasPrinted.current = true;
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
            id="printable-receipt"
            ref={printRef}
            className="fixed -top-[9999px] left-0 bg-white text-black"
            style={{ width: "80mm", fontFamily: "monospace", fontSize: "12px", padding: "10px" }}
        >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
                <p style={{ fontSize: "16px", fontWeight: "bold", margin: 0 }}>KDX Core</p>
                <p style={{ fontSize: "10px", color: "#555", margin: "2px 0" }}>Sistema de Gestión</p>
                <div style={{ borderTop: "1px dashed #999", marginTop: "8px" }} />
            </div>

            {/* Info */}
            <div style={{ marginBottom: "8px" }}>
                <p style={{ margin: "2px 0" }}>Orden: #{data.saleId.slice(-6).toUpperCase()}</p>
                <p style={{ margin: "2px 0" }}>Fecha: {new Date(data.date).toLocaleString("es-DO")}</p>
                <p style={{ margin: "2px 0" }}>Caja: {data.cashRegister}</p>
                {data.customerName && data.customerName !== "Consumidor Final" && (
                    <p style={{ margin: "2px 0" }}>Cliente: {data.customerName}</p>
                )}
            </div>

            <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

            {/* Items */}
            <table style={{ width: "100%", fontSize: "11px" }}>
                <tbody>
                    {data.items.map((item, i) => (
                        <tr key={i}>
                            <td style={{ padding: "3px 0", verticalAlign: "top" }}>
                                {item.quantity}x {item.name}
                            </td>
                            <td style={{ padding: "3px 0", textAlign: "right", whiteSpace: "nowrap" }}>
                                {formatCurrency(item.subtotal)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderTop: "1px dashed #999", margin: "8px 0" }} />

            {/* Totals */}
            <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(data.subtotal)}</span>
                </div>
                {data.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
                        <span>Descuento:</span>
                        <span>-{formatCurrency(data.discount)}</span>
                    </div>
                )}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: "bold",
                    borderTop: "1px dashed #999",
                    marginTop: "6px",
                    paddingTop: "6px",
                }}>
                    <span>TOTAL:</span>
                    <span>{formatCurrency(data.total)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginTop: "4px" }}>
                    <span>Pago:</span>
                    <span>{paymentLabels[data.paymentMethod] || data.paymentMethod}</span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: "center", marginTop: "16px", borderTop: "1px dashed #999", paddingTop: "8px" }}>
                <p style={{ fontSize: "10px", margin: 0 }}>Gracias por su compra</p>
                <p style={{ fontSize: "9px", margin: "4px 0 0", color: "#777" }}>KDX Core — Sistema de Gestión</p>
            </div>
        </div>
    );
}
