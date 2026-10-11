"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/shared";
import { useCan, useWorkspace } from "@/components/workspace-provider";
import { api, getJson } from "@/lib/fetcher";
import { getInitials } from "@/lib/utils";
import type { Role, TeamMember } from "@/types";

const ROLE_HELP: Record<Role, string> = {
    ADMIN: "Everything, including billing and team",
    MANAGER: "Menu, inventory, reports and service",
    STAFF: "POS, kitchen, orders and reservations",
};

function tempPassword() {
    const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export default function TeamPage() {
    const { user } = useWorkspace();
    const can = useCan();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", role: "STAFF" as Role, password: "" });
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

    const { data: members = [], isLoading } = useQuery({ queryKey: ["/api/team"], queryFn: getJson<TeamMember[]>("/api/team") });
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/team"] });

    const add = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api("/api/team", { method: "POST", json: form });
            setCreated({ email: form.email, password: form.password });
            setOpen(false);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't add the team member");
        } finally {
            setSaving(false);
        }
    };

    const changeRole = async (m: TeamMember, role: Role) => {
        try {
            await api(`/api/team/${m.id}`, { method: "PATCH", json: { role } });
            toast.success(`${m.name} is now ${role.toLowerCase()}`);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't change the role");
        }
    };

    const remove = async (m: TeamMember) => {
        if (!confirm(`Remove ${m.name}? They'll be signed out and lose access immediately.`)) return;
        try {
            await api(`/api/team/${m.id}`, { method: "DELETE" });
            toast.success(`${m.name} removed`);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't remove the team member");
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Team"
                description="Everyone who can sign in to your workspace."
                actions={
                    can.admin && (
                        <Button
                            onClick={() => {
                                setForm({ name: "", email: "", role: "STAFF", password: tempPassword() });
                                setOpen(true);
                            }}
                        >
                            <Plus /> Add team member
                        </Button>
                    )
                }
            />

            {isLoading ? (
                <Skeleton className="h-64 rounded-xl" />
            ) : members.length === 0 ? (
                <EmptyState icon={Users} title="No team members" />
            ) : (
                <ul className="divide-y rounded-xl border bg-card">
                    {members.map((m) => (
                        <li key={m.id} className="flex flex-wrap items-center gap-4 px-4 py-3.5">
                            <Avatar className="size-10">
                                <AvatarFallback className="bg-secondary text-sm font-semibold">{getInitials(m.name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-48 flex-1">
                                <p className="font-medium">
                                    {m.name} {m.id === user.id && <span className="text-sm font-normal text-muted-foreground">(you)</span>}
                                </p>
                                <p className="text-sm text-muted-foreground">{m.email}</p>
                            </div>
                            {can.admin && m.id !== user.id ? (
                                <>
                                    <Select value={m.role} onValueChange={(v) => changeRole(m, v as Role)}>
                                        <SelectTrigger className="h-10 w-36" aria-label={`Role for ${m.name}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(Object.keys(ROLE_HELP) as Role[]).map((r) => (
                                                <SelectItem key={r} value={r} className="capitalize">
                                                    {r.toLowerCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="icon" aria-label={`Remove ${m.name}`} onClick={() => remove(m)}>
                                        <Trash2 />
                                    </Button>
                                </>
                            ) : (
                                <span className="rounded-full bg-secondary px-3 py-1 text-sm capitalize">{m.role.toLowerCase()}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
                {(Object.entries(ROLE_HELP) as [Role, string][]).map(([role, help]) => (
                    <div key={role} className="rounded-xl border p-4">
                        <p className="font-medium capitalize">{role.toLowerCase()}</p>
                        <p className="text-sm text-muted-foreground">{help}</p>
                    </div>
                ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md">
                    <form onSubmit={add} className="flex flex-col gap-4">
                        <DialogHeader>
                            <DialogTitle>Add team member</DialogTitle>
                            <DialogDescription>They sign in with this email and the temporary password, then change it in Settings.</DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="m-name">Name</Label>
                            <Input id="m-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="m-email">Email</Label>
                            <Input id="m-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>Role</Label>
                            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                                <SelectTrigger className="h-10 w-full" aria-label="Role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.entries(ROLE_HELP) as [Role, string][]).map(([r, help]) => (
                                        <SelectItem key={r} value={r}>
                                            <span className="capitalize">{r.toLowerCase()}</span> — <span className="text-muted-foreground">{help}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="m-pass">Temporary password</Label>
                            <div className="flex gap-2">
                                <Input id="m-pass" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="font-mono" />
                                <Button type="button" variant="outline" size="icon" aria-label="Generate a new password" onClick={() => setForm({ ...form, password: tempPassword() })}>
                                    <RefreshCw />
                                </Button>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="animate-spin" />} Add member
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!created} onOpenChange={(o) => !o && setCreated(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Share these sign-in details</DialogTitle>
                        <DialogDescription>This is the only time the password is shown.</DialogDescription>
                    </DialogHeader>
                    <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                        <p>{created?.email}</p>
                        <p>{created?.password}</p>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(`Email: ${created?.email}\nPassword: ${created?.password}\nSign in: ${window.location.origin}/login`);
                                toast.success("Copied");
                            }}
                        >
                            Copy details
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
