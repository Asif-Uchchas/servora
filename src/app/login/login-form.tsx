"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Only allow same-site relative redirects after sign-in. */
function safeCallback(url: string | null) {
    return url && url.startsWith("/") && !url.startsWith("//") ? url : "/dashboard";
}

export function LoginForm({ demo }: { demo: { email: string; password: string } | null }) {
    const router = useRouter();
    const params = useSearchParams();
    const prefill = params.get("demo") && demo ? demo : null;
    const [email, setEmail] = useState(prefill?.email ?? "");
    const [password, setPassword] = useState(prefill?.password ?? "");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const result = await signIn("credentials", { email, password, redirect: false });
        if (result?.error) {
            setError("That email and password don't match.");
            setLoading(false);
            return;
        }
        router.replace(safeCallback(params.get("callbackUrl")));
        router.refresh();
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            {params.get("registered") && !error && (
                <p role="status" className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
                    Workspace created — sign in to continue.
                </p>
            )}
            {error && (
                <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-destructive">
                    {error}
                </p>
            )}
            <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={show ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 pr-11"
                    />
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        aria-label={show ? "Hide password" : "Show password"}
                        className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                    >
                        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                </div>
            </div>
            <Button type="submit" size="lg" className="h-11" disabled={loading}>
                {loading && <Loader2 className="animate-spin" />} Sign in
            </Button>
            {demo && (
                <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => {
                        setEmail(demo.email);
                        setPassword(demo.password);
                    }}
                >
                    Use the demo account
                </Button>
            )}
        </form>
    );
}
