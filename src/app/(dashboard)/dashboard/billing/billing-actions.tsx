"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

async function redirectTo(endpoint: string, body?: unknown) {
    const { url } = await api<{ url: string }>(endpoint, { method: "POST", json: body ?? {} });
    window.location.href = url;
}

export function PlanButton({ plan, label, disabled, featured }: { plan: "PRO" | "BUSINESS"; label: string; disabled?: boolean; featured?: boolean }) {
    const [loading, setLoading] = useState(false);
    return (
        <Button
            size="lg"
            className={cn("w-full", featured && "bg-brand text-brand-foreground hover:bg-brand/90")}
            variant={featured ? "default" : "outline"}
            disabled={disabled || loading}
            onClick={async () => {
                setLoading(true);
                try {
                    await redirectTo("/api/billing/checkout", { plan });
                } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Couldn't start checkout");
                    setLoading(false);
                }
            }}
        >
            {loading && <Loader2 className="animate-spin" />} {label}
        </Button>
    );
}

export function BillingActions() {
    const [loading, setLoading] = useState(false);
    return (
        <Button
            variant="secondary"
            className="self-start"
            disabled={loading}
            onClick={async () => {
                setLoading(true);
                try {
                    await redirectTo("/api/billing/portal");
                } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Couldn't open billing");
                    setLoading(false);
                }
            }}
        >
            {loading && <Loader2 className="animate-spin" />} Manage billing & invoices
        </Button>
    );
}
