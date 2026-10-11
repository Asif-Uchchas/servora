"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loader2, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/shared";
import { useCan } from "@/components/workspace-provider";
import { api, getJson } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "BDT", "AED", "SGD", "JPY"];

interface RestaurantSettings {
    name: string;
    slug: string;
    description: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    openingHours: string | null;
    currency: string;
    timezone: string;
    taxRate: number;
    acceptReservations: boolean;
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="grid gap-6 border-b pb-8 last:border-0 lg:grid-cols-[280px_1fr]">
            <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">{children}</div>
        </section>
    );
}

function Field({ id, label, hint, children, className }: { id: string; label: string; hint?: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Label htmlFor={id}>{label}</Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    );
}

function ProfileSection() {
    const router = useRouter();
    const { update } = useSession();
    const profile = useQuery({ queryKey: ["/api/settings/profile"], queryFn: getJson<{ name: string; email: string; phone: string | null }>("/api/settings/profile") });
    const [form, setForm] = useState({ name: "", phone: "" });
    const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });
    const [saving, setSaving] = useState<"profile" | "password" | null>(null);

    useEffect(() => {
        if (profile.data) setForm({ name: profile.data.name, phone: profile.data.phone ?? "" });
    }, [profile.data]);

    const saveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving("profile");
        try {
            await api("/api/settings/profile", { method: "PATCH", json: form });
            await update({ name: form.name });
            router.refresh();
            toast.success("Profile saved");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save your profile");
        } finally {
            setSaving(null);
        }
    };

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving("password");
        try {
            await api("/api/settings/password", { method: "POST", json: pw });
            setPw({ currentPassword: "", newPassword: "" });
            toast.success("Password changed");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't change your password");
        } finally {
            setSaving(null);
        }
    };

    return (
        <Section title="Your profile" description="How you appear to your team.">
            {profile.isLoading ? (
                <Skeleton className="h-40" />
            ) : (
                <>
                    <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
                        <Field id="p-name" label="Name">
                            <Input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </Field>
                        <Field id="p-email" label="Email" hint="Contact an admin to change your sign-in email.">
                            <Input id="p-email" value={profile.data?.email ?? ""} disabled />
                        </Field>
                        <Field id="p-phone" label="Phone">
                            <Input id="p-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </Field>
                        <div className="flex items-end justify-end sm:col-span-2">
                            <Button type="submit" disabled={saving === "profile"}>
                                {saving === "profile" && <Loader2 className="animate-spin" />} Save profile
                            </Button>
                        </div>
                    </form>
                    <form onSubmit={savePassword} className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                        <Field id="pw-current" label="Current password">
                            <Input id="pw-current" type="password" autoComplete="current-password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
                        </Field>
                        <Field id="pw-new" label="New password" hint="At least 8 characters.">
                            <Input id="pw-new" type="password" autoComplete="new-password" required minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
                        </Field>
                        <div className="flex justify-end sm:col-span-2">
                            <Button type="submit" variant="outline" disabled={saving === "password"}>
                                {saving === "password" && <Loader2 className="animate-spin" />} Change password
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </Section>
    );
}

function RestaurantSection() {
    const router = useRouter();
    const { update } = useSession();
    const settings = useQuery({ queryKey: ["/api/settings/restaurant"], queryFn: getJson<RestaurantSettings>("/api/settings/restaurant") });
    const [form, setForm] = useState<RestaurantSettings | null>(null);
    const [saving, setSaving] = useState(false);
    const timezones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];

    useEffect(() => {
        if (settings.data) setForm(settings.data);
    }, [settings.data]);

    if (!form) return <Skeleton className="h-96 rounded-xl" />;
    const set = <K extends keyof RestaurantSettings>(k: K, v: RestaurantSettings[K]) => setForm({ ...form, [k]: v });

    const save = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const saved = await api<RestaurantSettings>("/api/settings/restaurant", { method: "PATCH", json: form });
            await update({ restaurantName: saved.name, restaurantSlug: saved.slug });
            router.refresh();
            toast.success("Restaurant settings saved");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={save} className="flex flex-col gap-8">
            <Section title="Restaurant" description="Shown on your public menu, booking page and receipts.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="r-name" label="Restaurant name">
                        <Input id="r-name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
                    </Field>
                    <Field id="r-slug" label="Menu address" hint={`Guests visit /r/${form.slug}`}>
                        <Input id="r-slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={(e) => set("slug", e.target.value.toLowerCase())} className="font-mono" />
                    </Field>
                    <Field id="r-desc" label="Short description" className="sm:col-span-2">
                        <Textarea id="r-desc" rows={2} maxLength={500} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
                    </Field>
                    <Field id="r-email" label="Contact email">
                        <Input id="r-email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
                    </Field>
                    <Field id="r-phone" label="Phone">
                        <Input id="r-phone" type="tel" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
                    </Field>
                    <Field id="r-address" label="Address">
                        <Input id="r-address" value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
                    </Field>
                    <Field id="r-hours" label="Opening hours">
                        <Input id="r-hours" value={form.openingHours ?? ""} onChange={(e) => set("openingHours", e.target.value)} placeholder="Tue–Sun · 12:00–23:00" />
                    </Field>
                </div>
            </Section>

            <Section title="Money & time" description="Used for prices, tax on every order and your reports.">
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field id="r-currency" label="Currency">
                        <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
                            <SelectTrigger id="r-currency" className="h-10 w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCIES.map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {c}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field id="r-tax" label="Sales tax (%)" hint="Added to every order. 0 if prices include tax.">
                        <Input id="r-tax" type="number" min={0} max={50} step="0.001" value={form.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
                    </Field>
                    <Field id="r-tz" label="Time zone">
                        <Select value={form.timezone} onValueChange={(v) => set("timezone", v)}>
                            <SelectTrigger id="r-tz" className="h-10 w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                                {timezones.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
                <div className="flex items-center justify-between gap-4 border-t pt-4">
                    <div>
                        <p className="font-medium">Online booking requests</p>
                        <p className="text-sm text-muted-foreground">Let guests request a table from your public menu page.</p>
                    </div>
                    <Switch checked={form.acceptReservations} onCheckedChange={(v) => set("acceptReservations", v)} aria-label="Accept online booking requests" />
                </div>
            </Section>

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={saving}>
                    {saving && <Loader2 className="animate-spin" />} Save restaurant settings
                </Button>
            </div>
        </form>
    );
}

function AppearanceSection() {
    const { theme, setTheme } = useTheme();
    const options = [
        { id: "light", label: "Light", icon: Sun },
        { id: "dark", label: "Dark", icon: Moon },
        { id: "system", label: "System", icon: Monitor },
    ];
    return (
        <Section title="Appearance" description="The POS and kitchen display always use dark mode.">
            <div className="grid grid-cols-3 gap-2">
                {options.map((o) => (
                    <button
                        key={o.id}
                        type="button"
                        aria-pressed={theme === o.id}
                        onClick={() => setTheme(o.id)}
                        className={cn("flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border text-sm", theme === o.id ? "border-brand bg-brand-soft font-medium" : "hover:bg-muted")}
                    >
                        <o.icon className="size-5" /> {o.label}
                    </button>
                ))}
            </div>
        </Section>
    );
}

export default function SettingsPage() {
    const can = useCan();
    return (
        <div className="flex flex-col gap-8">
            <PageHeader title="Settings" />
            <ProfileSection />
            {can.admin && <RestaurantSection />}
            <AppearanceSection />
        </div>
    );
}
