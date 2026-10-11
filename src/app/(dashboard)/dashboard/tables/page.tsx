"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Download, Loader2, Pencil, Plus, Printer, QrCode, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/shared";
import { useCan, useWorkspace } from "@/components/workspace-provider";
import { api, getJson } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { DiningTable, TableStatus } from "@/types";

const STATUS_STYLE: Record<TableStatus, string> = {
    AVAILABLE: "bg-success-soft text-success",
    OCCUPIED: "bg-brand-soft text-brand-ink",
    RESERVED: "bg-info-soft text-info",
    CLEANING: "bg-secondary text-muted-foreground",
};
const EMPTY = { label: "", capacity: "4", area: "" };

function useQr(url: string) {
    const [src, setSrc] = useState("");
    useEffect(() => {
        if (!url) return;
        QRCode.toDataURL(url, { margin: 1, width: 512, color: { dark: "#16150f", light: "#ffffff" } }).then(setSrc);
    }, [url]);
    return src;
}

function QrCard({ title, subtitle, url }: { title: string; subtitle: string; url: string }) {
    const src = useQr(url);
    return (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-white p-5 text-center text-[#16150f]">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
            {src ? <img src={src} alt={`QR code for ${title}`} className="size-44" /> : <Skeleton className="size-44" />}
            <div>
                <p className="font-display text-xl font-bold">{title}</p>
                <p className="text-sm text-[#55544d]">{subtitle}</p>
            </div>
        </div>
    );
}

export default function TablesPage() {
    const { restaurant } = useWorkspace();
    const can = useCan();
    const queryClient = useQueryClient();
    const [origin, setOrigin] = useState("");
    const [form, setForm] = useState<typeof EMPTY & { id?: string }>(EMPTY);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [qrFor, setQrFor] = useState<DiningTable | "menu" | null>(null);

    useEffect(() => setOrigin(window.location.origin), []);
    const menuUrl = origin ? `${origin}/r/${restaurant.slug}` : "";
    const menuQr = useQr(menuUrl);

    const { data: tables = [], isLoading } = useQuery({
        queryKey: ["/api/tables"],
        queryFn: getJson<DiningTable[]>("/api/tables"),
        refetchInterval: 20_000,
    });
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/tables"] });

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { id, ...body } = form;
            await api(id ? `/api/tables/${id}` : "/api/tables", { method: id ? "PATCH" : "POST", json: body });
            toast.success(id ? "Table updated" : "Table added");
            setOpen(false);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save the table");
        } finally {
            setSaving(false);
        }
    };

    const setStatus = async (t: DiningTable, status: TableStatus) => {
        try {
            await api(`/api/tables/${t.id}`, { method: "PATCH", json: { status } });
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't update the table");
        }
    };

    const remove = async (t: DiningTable) => {
        if (!confirm(`Delete table ${t.label}? Past orders keep their table label.`)) return;
        try {
            await api(`/api/tables/${t.id}`, { method: "DELETE" });
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't delete the table");
        }
    };

    const areas = [...new Set(tables.map((t) => t.area || "Main room"))];

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Tables & QR"
                description="Your floor layout, live table status and the QR codes guests scan to see your menu."
                actions={
                    can.manage && (
                        <Button
                            onClick={() => {
                                setForm(EMPTY);
                                setOpen(true);
                            }}
                        >
                            <Plus /> Add table
                        </Button>
                    )
                }
            />

            <section className="flex flex-col gap-5 rounded-2xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                {menuQr ? <img src={menuQr} alt="QR code for your public menu" className="size-28 rounded-lg bg-white p-1.5" /> : <Skeleton className="size-28" />}
                <div className="flex-1">
                    <h2 className="font-display text-2xl font-bold">Your public menu</h2>
                    <p className="mt-1 font-mono text-sm break-all opacity-70">{menuUrl || "…"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            className="bg-brand text-brand-foreground hover:bg-brand/90"
                            onClick={() => {
                                navigator.clipboard.writeText(menuUrl);
                                toast.success("Link copied");
                            }}
                        >
                            <Copy /> Copy link
                        </Button>
                        <Button size="sm" variant="secondary" asChild>
                            <a href={menuQr} download={`${restaurant.slug}-menu-qr.png`}>
                                <Download /> Download QR
                            </a>
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setQrFor("menu")}>
                            <Printer /> Print table card
                        </Button>
                    </div>
                </div>
            </section>

            {isLoading ? (
                <Skeleton className="h-64 rounded-xl" />
            ) : tables.length === 0 ? (
                <EmptyState icon={QrCode} title="No tables yet" description="Add tables to assign orders and print a QR card for each one." />
            ) : (
                areas.map((area) => (
                    <section key={area} className="flex flex-col gap-3">
                        <h2 className="font-semibold">{area}</h2>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
                            {tables
                                .filter((t) => (t.area || "Main room") === area)
                                .map((t) => (
                                    <div key={t.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-display text-2xl font-bold">{t.label}</p>
                                                <p className="text-sm text-muted-foreground">{t.capacity} seats</p>
                                            </div>
                                            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", STATUS_STYLE[t.status])}>
                                                {t.status.toLowerCase()}
                                            </span>
                                        </div>
                                        <Select value={t.status} onValueChange={(v) => setStatus(t, v as TableStatus)}>
                                            <SelectTrigger className="h-10 w-full" aria-label={`Status of ${t.label}`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(Object.keys(STATUS_STYLE) as TableStatus[]).map((s) => (
                                                    <SelectItem key={s} value={s} className="capitalize">
                                                        {s.toLowerCase()}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <div className="flex gap-1">
                                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setQrFor(t)}>
                                                <QrCode /> QR card
                                            </Button>
                                            {can.manage && (
                                                <>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="size-8"
                                                        aria-label={`Edit ${t.label}`}
                                                        onClick={() => {
                                                            setForm({ id: t.id, label: t.label, capacity: String(t.capacity), area: t.area ?? "" });
                                                            setOpen(true);
                                                        }}
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" className="size-8" aria-label={`Delete ${t.label}`} onClick={() => remove(t)}>
                                                        <Trash2 />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </section>
                ))
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm">
                    <form onSubmit={save} className="flex flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>{form.id ? "Edit table" : "Add table"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="t-label">Name</Label>
                                <Input id="t-label" required maxLength={20} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="T7" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="t-cap">Seats</Label>
                                <Input id="t-cap" type="number" min={1} max={50} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                            </div>
                            <div className="col-span-2 flex flex-col gap-2">
                                <Label htmlFor="t-area">Area</Label>
                                <Input id="t-area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Main room, Patio, Bar…" list="areas" />
                                <datalist id="areas">
                                    {areas.map((a) => (
                                        <option key={a} value={a} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="animate-spin" />} Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Table card</DialogTitle>
                        <DialogDescription>Print it and stand it on the table.</DialogDescription>
                    </DialogHeader>
                    {qrFor && (
                        <div className="print-area">
                            <QrCard
                                title={qrFor === "menu" ? restaurant.name : `Table ${qrFor.label}`}
                                subtitle="Scan to see our menu"
                                url={qrFor === "menu" ? menuUrl : `${menuUrl}?table=${encodeURIComponent(qrFor.label)}`}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => window.print()}>
                            <Printer /> Print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
