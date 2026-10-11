"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/fetcher";

export function BookingForm({ slug }: { slug: string }) {
    const [form, setForm] = useState({ customerName: "", phone: "", email: "", guests: "2", date: "", time: "19:00", notes: "" });
    const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
    const [error, setError] = useState("");
    const today = new Date().toISOString().slice(0, 10);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setState("sending");
        setError("");
        try {
            await api(`/api/public/${slug}/reservations`, {
                method: "POST",
                json: {
                    customerName: form.customerName,
                    phone: form.phone,
                    email: form.email,
                    guests: form.guests,
                    notes: form.notes,
                    reservationTime: new Date(`${form.date}T${form.time}`).toISOString(),
                },
            });
            setState("sent");
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong. Please call us instead.");
            setState("idle");
        }
    };

    if (state === "sent") {
        return (
            <div role="status" className="mt-5 flex items-start gap-3 rounded-xl bg-success-soft p-4 text-success">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                <p>
                    Request sent for {form.guests} on {new Date(`${form.date}T${form.time}`).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}. We&apos;ll be
                    in touch to confirm.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
                <Label htmlFor="b-date">Date</Label>
                <Input id="b-date" type="date" min={today} required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="b-time">Time</Label>
                    <Input id="b-time" type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-11" />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="b-guests">Guests</Label>
                    <Input id="b-guests" type="number" min={1} max={20} required value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} className="h-11" />
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="b-name">Your name</Label>
                <Input id="b-name" autoComplete="name" required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="h-11" />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="b-phone">Phone</Label>
                <Input id="b-phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="b-email">Email (optional)</Label>
                <Input id="b-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="b-notes">Anything we should know?</Label>
                <Textarea id="b-notes" rows={2} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Allergies, birthday, high chair…" />
            </div>
            {error && (
                <p role="alert" className="text-sm text-destructive sm:col-span-2">
                    {error}
                </p>
            )}
            <Button type="submit" size="lg" disabled={state === "sending"} className="h-12 bg-brand text-brand-foreground hover:bg-brand/90 sm:col-span-2">
                {state === "sending" && <Loader2 className="animate-spin" />} Request booking
            </Button>
        </form>
    );
}
