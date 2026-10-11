import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { TRIAL_DAYS } from "@/lib/plans";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create your workspace" };

export default function RegisterPage() {
    return (
        <AuthShell
            title="Create your workspace"
            subtitle={`Free to start. Pro features are on for ${TRIAL_DAYS} days — no card needed.`}
            footer={
                <>
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                        Sign in
                    </Link>
                </>
            }
        >
            <RegisterForm />
        </AuthShell>
    );
}
