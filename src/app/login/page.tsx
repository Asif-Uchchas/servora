import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
    const demo =
        process.env.NEXT_PUBLIC_DEMO_EMAIL && process.env.NEXT_PUBLIC_DEMO_PASSWORD
            ? { email: process.env.NEXT_PUBLIC_DEMO_EMAIL, password: process.env.NEXT_PUBLIC_DEMO_PASSWORD }
            : null;

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Sign in to your restaurant workspace."
            footer={
                <>
                    New to Servora?{" "}
                    <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
                        Create a workspace
                    </Link>
                </>
            }
        >
            <Suspense>
                <LoginForm demo={demo} />
            </Suspense>
        </AuthShell>
    );
}
