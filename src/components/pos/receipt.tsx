"use client";

import { formatOrderNumber } from "@/lib/utils";
import type { Order } from "@/types";

/** Thermal-printer style receipt. Rendered inside `.print-area` so window.print() prints only this. */
export function Receipt({ order, restaurantName, money }: { order: Order; restaurantName: string; money: (n: number) => string }) {
    const when = new Date(order.paidAt ?? order.createdAt);
    return (
        <div className="print-area mx-auto w-full max-w-[300px] bg-white p-5 font-mono text-[12px] leading-relaxed text-black">
            <div className="mb-3 text-center">
                <p className="text-base font-bold">{restaurantName}</p>
                <p>{when.toLocaleString()}</p>
            </div>
            <div className="border-y border-dashed border-black/40 py-2">
                <div className="flex justify-between">
                    <span>Order</span>
                    <span className="font-bold">{formatOrderNumber(order.orderNumber)}</span>
                </div>
                {order.tableNumber && (
                    <div className="flex justify-between">
                        <span>Table</span>
                        <span>{order.tableNumber}</span>
                    </div>
                )}
                {order.customerName && (
                    <div className="flex justify-between">
                        <span>Guest</span>
                        <span>{order.customerName}</span>
                    </div>
                )}
                {order.createdBy && (
                    <div className="flex justify-between">
                        <span>Server</span>
                        <span>{order.createdBy}</span>
                    </div>
                )}
            </div>
            <div className="py-2">
                {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-2">
                        <span>
                            {item.quantity}× {item.name}
                        </span>
                        <span>{money(item.price * item.quantity)}</span>
                    </div>
                ))}
            </div>
            <div className="border-t border-dashed border-black/40 pt-2">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{money(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{money(order.taxAmount)}</span>
                </div>
                {order.tipAmount > 0 && (
                    <div className="flex justify-between">
                        <span>Tip</span>
                        <span>{money(order.tipAmount)}</span>
                    </div>
                )}
                <div className="mt-1 flex justify-between text-sm font-bold">
                    <span>TOTAL</span>
                    <span>{money(order.totalAmount)}</span>
                </div>
                {order.paymentMethod && (
                    <div className="flex justify-between">
                        <span>Paid by</span>
                        <span>{order.paymentMethod.toLowerCase()}</span>
                    </div>
                )}
            </div>
            <p className="mt-4 text-center">Thank you — see you soon!</p>
        </div>
    );
}
