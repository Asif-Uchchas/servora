"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BellOff, ChefHat, ChevronLeft, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared";
import { api, getJson } from "@/lib/fetcher";
import { cn, formatOrderNumber } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

const LATE_AFTER_MIN = 15;

const LANE: Record<"PENDING" | "PREPARING" | "READY", { label: string; head: string; accent: string; action: string; next: OrderStatus; button: string }> = {
    PENDING: { label: "New", head: "bg-warning-soft", accent: "text-brand", action: "Start cooking", next: "PREPARING", button: "bg-brand text-brand-foreground hover:bg-brand/90" },
    PREPARING: { label: "Cooking", head: "bg-info-soft", accent: "text-info", action: "Mark ready", next: "READY", button: "bg-info text-background hover:bg-info/90" },
    READY: { label: "Ready", head: "bg-success-soft", accent: "text-success", action: "Bump — served", next: "SERVED", button: "bg-secondary text-foreground hover:bg-accent" },
};

function mmss(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function chime() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch {
        // Audio may be blocked until the user interacts with the page.
    }
}

export function KitchenBoard() {
    const queryClient = useQueryClient();
    const [now, setNow] = useState(() => Date.now());
    const [sound, setSound] = useState(true);
    const seen = useRef<Set<string> | null>(null);

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["/api/orders?scope=kitchen"],
        queryFn: getJson<Order[]>("/api/orders?scope=kitchen"),
        refetchInterval: 5_000,
    });

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    // Chime when a ticket we haven't seen before arrives (not on first load).
    useEffect(() => {
        const ids = new Set(orders.filter((o) => o.status === "PENDING").map((o) => o.id));
        if (seen.current && sound && [...ids].some((id) => !seen.current!.has(id))) chime();
        seen.current = new Set([...(seen.current ?? []), ...ids]);
    }, [orders, sound]);

    const sorted = useMemo(() => {
        const rank = { PENDING: 1, PREPARING: 0, READY: 2 } as Record<OrderStatus, number>;
        return [...orders].sort((a, b) => rank[a.status] - rank[b.status] || a.createdAt.localeCompare(b.createdAt));
    }, [orders]);

    const counts = { PENDING: 0, PREPARING: 0, READY: 0 } as Record<string, number>;
    orders.forEach((o) => (counts[o.status] = (counts[o.status] ?? 0) + 1));
    const active = orders.filter((o) => o.status !== "READY");
    const avgMs = active.length ? active.reduce((s, o) => s + (now - new Date(o.createdAt).getTime()), 0) / active.length : 0;

    const bump = async (order: Order, to: OrderStatus) => {
        queryClient.setQueryData<Order[]>(["/api/orders?scope=kitchen"], (prev) =>
            (prev ?? []).flatMap((o) => (o.id === order.id ? (to === "SERVED" ? [] : [{ ...o, status: to }]) : [o]))
        );
        try {
            await api(`/api/orders/${order.id}`, { method: "PATCH", json: { status: to } });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't update the ticket");
        } finally {
            queryClient.invalidateQueries({ queryKey: ["/api/orders?scope=kitchen"] });
        }
    };

    return (
        <div className="flex min-h-dvh flex-col gap-5 bg-[#0c0c0b] p-4 sm:p-5">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button asChild variant="secondary" size="icon" className="size-11" aria-label="Back to dashboard">
                        <Link href="/dashboard">
                            <ChevronLeft className="size-5" />
                        </Link>
                    </Button>
                    <h1 className="font-display text-2xl font-extrabold">Kitchen</h1>
                    <span className="font-mono text-sm text-muted-foreground">
                        {new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · live
                    </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 font-mono text-sm">
                    <span><span className="text-brand">●</span> New {counts.PENDING}</span>
                    <span><span className="text-info">●</span> Cooking {counts.PREPARING}</span>
                    <span><span className="text-success">●</span> Ready {counts.READY}</span>
                    <span className={cn(avgMs > LATE_AFTER_MIN * 60_000 ? "text-destructive" : "text-muted-foreground")}>
                        Avg open {mmss(avgMs)}
                    </span>
                    <Button variant="secondary" size="icon" className="size-10" aria-label={sound ? "Mute new-ticket chime" : "Unmute new-ticket chime"} onClick={() => setSound((s) => !s)}>
                        {sound ? <Bell /> : <BellOff />}
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-10"
                        aria-label="Full screen"
                        onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
                    >
                        <Maximize />
                    </Button>
                </div>
            </header>

            {isLoading ? null : sorted.length === 0 ? (
                <EmptyState icon={ChefHat} title="No tickets on the rail" description="New orders from the POS appear here instantly." className="flex-1 border-border" />
            ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-3.5">
                    {sorted.map((order) => {
                        const lane = LANE[order.status as keyof typeof LANE];
                        if (!lane) return null;
                        const age = now - new Date(order.createdAt).getTime();
                        const late = order.status !== "READY" && age > LATE_AFTER_MIN * 60_000;
                        return (
                            <article
                                key={order.id}
                                className={cn(
                                    "flex flex-col overflow-hidden rounded-xl bg-card",
                                    late && "outline-2 outline-destructive",
                                    order.status === "READY" && "opacity-85"
                                )}
                            >
                                <div className={cn("flex items-center justify-between px-3.5 py-3", late ? "bg-danger-soft" : lane.head)}>
                                    <span className="font-mono text-lg font-semibold">
                                        {formatOrderNumber(order.orderNumber)} · {order.tableNumber ?? "Takeaway"}
                                    </span>
                                    <span className={cn("font-mono text-lg", late ? "text-destructive" : lane.accent)}>
                                        {order.status === "READY" ? "READY" : mmss(age)}
                                    </span>
                                </div>
                                <ul className="flex flex-col gap-2.5 p-3.5 text-[17px]">
                                    {order.items.map((item) => (
                                        <li key={item.id} className="flex gap-2.5">
                                            <span className="font-mono text-brand">{item.quantity}</span>
                                            <span>
                                                {item.name}
                                                {item.notes && <span className={cn("block text-sm", lane.accent)}>{item.notes}</span>}
                                            </span>
                                        </li>
                                    ))}
                                    {order.notes && <li className="rounded-md bg-secondary px-2.5 py-1.5 text-sm">{order.notes}</li>}
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => bump(order, lane.next)}
                                    className={cn("mt-auto min-h-14 border-t text-base font-semibold transition-colors", lane.button)}
                                >
                                    {lane.action}
                                </button>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
