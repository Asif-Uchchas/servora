"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Loader2, Mail, Phone, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, PageHeader, StatusBadge } from "@/components/shared";
import { useWorkspace } from "@/components/workspace-provider";
import { api, getJson } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { Reservation, ReservationStatus } from "@/types";

const EMPTY_FORM = { customerName: "", phone: "", email: "", guests: "2", date: "", time: "19:00", tableNumber: "", notes: "" };

export function ReservationsView() {
    const { restaurant } = useWorkspace();
    const queryClient = useQueryClient();
    const [day, setDay] = useState(() => startOfDay(new Date()));
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const { data: all = [], isLoading } = useQuery({
        queryKey: ["/api/reservations"],
        queryFn: getJson<Reservation[]>("/api/reservations"),
        refetchInterval: 30_000,
    });

    const pending = all.filter((r) => r.status === "PENDING" && new Date(r.reservationTime) >= startOfDay(new Date()));
    const forDay = useMemo(() => all.filter((r) => isSameDay(new Date(r.reservationTime), day)), [all, day]);
    const covers = forDay.filter((r) => r.status !== "CANCELLED").reduce((s, r) => s + r.guests, 0);

    const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });

    const setStatus = async (r: Reservation, status: ReservationStatus) => {
        try {
            await api(`/api/reservations/${r.id}`, { method: "PATCH", json: { status } });
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't update the reservation");
        }
    };

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api("/api/reservations", {
                method: "POST",
                json: {
                    customerName: form.customerName,
                    phone: form.phone,
                    email: form.email,
                    guests: form.guests,
                    tableNumber: form.tableNumber,
                    notes: form.notes,
                    reservationTime: new Date(`${form.date}T${form.time}`).toISOString(),
                },
            });
            toast.success("Reservation added");
            setOpen(false);
            setForm(EMPTY_FORM);
            setDay(startOfDay(new Date(`${form.date}T${form.time}`)));
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save the reservation");
        } finally {
            setSaving(false);
        }
    };

    const bookingUrl = typeof window !== "undefined" ? `${window.location.origin}/r/${restaurant.slug}#book` : "";

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Reservations"
                description="Bookings you take by phone plus requests guests send from your public menu page."
                actions={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => {
                                navigator.clipboard.writeText(bookingUrl);
                                toast.success("Booking link copied");
                            }}
                        >
                            <Copy /> Copy booking link
                        </Button>
                        <Button
                            onClick={() => {
                                setForm({ ...EMPTY_FORM, date: format(day, "yyyy-MM-dd") });
                                setOpen(true);
                            }}
                        >
                            <Plus /> New reservation
                        </Button>
                    </>
                }
            />

            {pending.length > 0 && (
                <section aria-label="Requests waiting for confirmation" className="rounded-xl border border-brand/40 bg-brand-soft p-4">
                    <h2 className="mb-3 font-semibold text-brand-ink">
                        {pending.length} booking request{pending.length > 1 ? "s" : ""} waiting
                    </h2>
                    <ul className="flex flex-col gap-2">
                        {pending.map((r) => (
                            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card px-4 py-3">
                                <span className="text-sm">
                                    <span className="font-medium">{r.customerName}</span> · {r.guests} guests ·{" "}
                                    {format(new Date(r.reservationTime), "EEE d MMM, HH:mm")}
                                    {r.phone && <span className="text-muted-foreground"> · {r.phone}</span>}
                                </span>
                                <span className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(r, "CANCELLED")}>
                                        Decline
                                    </Button>
                                    <Button size="sm" onClick={() => setStatus(r, "CONFIRMED")}>
                                        Confirm
                                    </Button>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-10" aria-label="Previous day" onClick={() => setDay((d) => addDays(d, -1))}>
                        <ChevronLeft />
                    </Button>
                    <Button variant="outline" className="h-10" onClick={() => setDay(startOfDay(new Date()))}>
                        Today
                    </Button>
                    <Button variant="outline" size="icon" className="size-10" aria-label="Next day" onClick={() => setDay((d) => addDays(d, 1))}>
                        <ChevronRight />
                    </Button>
                </div>
                <h2 className="font-display text-xl font-bold">{format(day, "EEEE d MMMM")}</h2>
                <span className="font-mono text-sm text-muted-foreground">
                    {forDay.length} bookings · {covers} covers
                </span>
            </div>

            {isLoading ? (
                <Skeleton className="h-64 rounded-xl" />
            ) : forDay.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No bookings this day" description="Add one, or share your booking link with guests." />
            ) : (
                <ul className="flex flex-col gap-2">
                    {forDay.map((r) => (
                        <li
                            key={r.id}
                            className={cn("flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border bg-card px-4 py-3.5", r.status === "CANCELLED" && "opacity-60")}
                        >
                            <span className="w-14 font-mono text-lg font-medium">{format(new Date(r.reservationTime), "HH:mm")}</span>
                            <div className="min-w-48 flex-1">
                                <p className="font-medium">{r.customerName}</p>
                                <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                                    <span className="inline-flex items-center gap-1"><Users className="size-3.5" /> {r.guests}</span>
                                    {r.tableNumber && <span>Table {r.tableNumber}</span>}
                                    {r.phone && <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="size-3.5" /> {r.phone}</a>}
                                    {r.email && <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="size-3.5" /> {r.email}</a>}
                                </p>
                                {r.notes && <p className="mt-1 text-sm">{r.notes}</p>}
                            </div>
                            <StatusBadge status={r.status} kind="reservation" />
                            <div className="flex gap-2">
                                {r.status === "PENDING" && <Button size="sm" variant="outline" onClick={() => setStatus(r, "CONFIRMED")}>Confirm</Button>}
                                {(r.status === "CONFIRMED" || r.status === "PENDING") && (
                                    <>
                                        <Button size="sm" onClick={() => setStatus(r, "COMPLETED")}>Seat</Button>
                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setStatus(r, "CANCELLED")}>Cancel</Button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <form onSubmit={create} className="flex flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>New reservation</DialogTitle>
                            <DialogDescription>Added as confirmed.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-2 sm:col-span-2">
                                <Label htmlFor="r-name">Guest name</Label>
                                <Input id="r-name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="r-date">Date</Label>
                                <Input id="r-date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="r-time">Time</Label>
                                <Input id="r-time" type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="r-guests">Guests</Label>
                                <Input id="r-guests" type="number" min={1} max={100} required value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="r-table">Table (optional)</Label>
                                <Input id="r-table" value={form.tableNumber} onChange={(e) => setForm({ ...form, tableNumber: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="r-phone">Phone</Label>
                                <Input id="r-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="r-email">Email</Label>
                                <Input id="r-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="flex flex-col gap-2 sm:col-span-2">
                                <Label htmlFor="r-notes">Notes</Label>
                                <Textarea id="r-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Birthday, high chair, allergies…" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="animate-spin" />} Save reservation
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
