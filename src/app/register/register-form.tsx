"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/fetcher";
import { registerSchema } from "@/lib/validations";
import type { z } from "zod";

type Values = z.input<typeof registerSchema>;

const FIELDS: { name: keyof Values; label: string; type: string; autoComplete: string }[] = [
    { name: "restaurantName", label: "Restaurant name", type: "text", autoComplete: "organization" },
    { name: "name", label: "Your name", type: "text", autoComplete: "name" },
    { name: "email", label: "Work email", type: "email", autoComplete: "email" },
    { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
];

export function RegisterForm() {
    const router = useRouter();
    const [error, setError] = useState("");
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<Values>({ resolver: zodResolver(registerSchema) });

    const onSubmit = async (values: Values) => {
        setError("");
        try {
            await api("/api/auth/register", { method: "POST", json: values });
        } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't create your workspace");
            return;
        }
        const result = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
        if (result?.error) {
            router.push("/login?registered=1");
            return;
        }
        router.replace("/dashboard?welcome=1");
        router.refresh();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            {error && (
                <p role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-destructive">
                    {error}
                </p>
            )}
            {FIELDS.map((f) => (
                <div key={f.name} className="flex flex-col gap-2">
                    <Label htmlFor={f.name}>{f.label}</Label>
                    <Input
                        id={f.name}
                        type={f.type}
                        autoComplete={f.autoComplete}
                        aria-invalid={!!errors[f.name]}
                        aria-describedby={errors[f.name] ? `${f.name}-error` : undefined}
                        className="h-11"
                        {...register(f.name)}
                    />
                    {errors[f.name] && (
                        <p id={`${f.name}-error`} className="text-sm text-destructive">
                            {errors[f.name]?.message}
                        </p>
                    )}
                </div>
            ))}
            <Button type="submit" size="lg" className="mt-1 h-11 bg-brand text-brand-foreground hover:bg-brand/90" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />} Create workspace
            </Button>
            <p className="text-center text-xs text-muted-foreground">
                By continuing you agree to the{" "}
                <Link href="/legal/terms" className="underline">
                    Terms
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" className="underline">
                    Privacy Policy
                </Link>
                .
            </p>
        </form>
    );
}
