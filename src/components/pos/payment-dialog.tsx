"use client";

import { useState } from "react";
import { Banknote, CreditCard, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { roundMoney } from "@/lib/pricing";
import type { PaymentMethod } from "@/types";

const METHODS: { id: PaymentMethod; label: string; icon: React.ElementType }[] = [
    { id: "CARD", label: "Card", icon: CreditCard },
    { id: "CASH", label: "Cash", icon: Banknote },
    { id: "OTHER", label: "Other", icon: Wallet },
];
const TIP_PRESETS = [0, 10, 15, 20];

export interface PaymentResult {
    method: PaymentMethod;
    tip: number;
}

export function PaymentDialog({
    open,
    onOpenChange,
    title,
    subtotal,
    amountDue,
    money,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    /** Pre-tax subtotal: tips are suggested as a percentage of this. */
    subtotal: number;
    /** Subtotal + tax, before tip. */
    amountDue: number;
    money: (n: number) => string;
    onConfirm: (result: PaymentResult) => Promise<void>;
}) {
    const [method, setMethod] = useState<PaymentMethod>("CARD");
    const [tipPct, setTipPct] = useState<number | "custom">(0);
    const [customTip, setCustomTip] = useState("");
    const [tendered, setTendered] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const tip = tipPct === "custom" ? Math.max(0, Number(customTip) || 0) : roundMoney((subtotal * tipPct) / 100);
    const total = roundMoney(amountDue + tip);
    const tenderedNum = Number(tendered) || 0;
    const change = roundMoney(tenderedNum - total);
    const cashShort = method === "CASH" && tendered !== "" && change < 0;
    const quickCash = [...new Set([total, Math.ceil(total), Math.ceil(total / 10) * 10, Math.ceil(total / 20) * 20, Math.ceil(total / 50) * 50])].slice(0, 4);

    const reset = () => {
        setMethod("CARD");
        setTipPct(0);
        setCustomTip("");
        setTendered("");
    };

    const confirm = async () => {
        setSubmitting(true);
        try {
            await onConfirm({ method, tip });
            reset();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) reset();
                onOpenChange(o);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Amount due before tip: {money(amountDue)}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5">
                    <fieldset className="flex flex-col gap-2">
                        <legend className="mb-2 text-sm font-medium">Payment method</legend>
                        <div className="grid grid-cols-3 gap-2">
                            {METHODS.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMethod(m.id)}
                                    aria-pressed={method === m.id}
                                    className={cn(
                                        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm font-medium transition-colors",
                                        method === m.id ? "border-brand bg-brand-soft text-foreground" : "hover:bg-muted"
                                    )}
                                >
                                    <m.icon className="size-5" />
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset className="flex flex-col gap-2">
                        <legend className="mb-2 text-sm font-medium">Tip</legend>
                        <div className="grid grid-cols-5 gap-2">
                            {TIP_PRESETS.map((pct) => (
                                <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setTipPct(pct)}
                                    aria-pressed={tipPct === pct}
                                    className={cn(
                                        "min-h-11 rounded-lg border font-mono text-sm",
                                        tipPct === pct ? "border-brand bg-brand-soft" : "hover:bg-muted"
                                    )}
                                >
                                    {pct === 0 ? "None" : `${pct}%`}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setTipPct("custom")}
                                aria-pressed={tipPct === "custom"}
                                className={cn("min-h-11 rounded-lg border text-sm", tipPct === "custom" ? "border-brand bg-brand-soft" : "hover:bg-muted")}
                            >
                                Other
                            </button>
                        </div>
                        {tipPct === "custom" && (
                            <Input
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                placeholder="Tip amount"
                                aria-label="Custom tip amount"
                                value={customTip}
                                onChange={(e) => setCustomTip(e.target.value)}
                                className="h-11"
                                autoFocus
                            />
                        )}
                    </fieldset>

                    {method === "CASH" && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="tendered">Cash received</Label>
                            <Input
                                id="tendered"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                value={tendered}
                                onChange={(e) => setTendered(e.target.value)}
                                className="h-11 font-mono"
                            />
                            <div className="flex flex-wrap gap-2">
                                {quickCash.map((amt) => (
                                    <Button key={amt} type="button" variant="outline" size="sm" className="font-mono" onClick={() => setTendered(String(amt))}>
                                        {money(amt)}
                                    </Button>
                                ))}
                            </div>
                            {tendered !== "" && (
                                <p className={cn("font-mono text-sm", cashShort ? "text-destructive" : "text-success")}>
                                    {cashShort ? `Short by ${money(-change)}` : `Change: ${money(change)}`}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                        <span className="font-medium">Total</span>
                        <span className="font-mono text-xl font-semibold">{money(total)}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        size="lg"
                        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                        disabled={submitting || cashShort}
                        onClick={confirm}
                    >
                        {submitting && <Loader2 className="animate-spin" />}
                        Confirm {money(total)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
