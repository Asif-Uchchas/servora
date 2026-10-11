import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/shared";

const DOCS: Record<string, string> = { terms: "Terms of Service", privacy: "Privacy Policy" };

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
    const { doc } = await params;
    return { title: DOCS[doc] ?? "Legal" };
}

// Placeholder until the operator's real legal text is supplied — intentionally not invented here.
export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
    const { doc } = await params;
    const title = DOCS[doc];
    if (!title) notFound();

    return (
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-5 py-10">
            <Link href="/" aria-label="Servora home">
                <Logo inverted />
            </Link>
            <h1 className="font-display text-4xl font-extrabold">{title}</h1>
            <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
                [Your {title.toLowerCase()} goes here. Replace this page with text reviewed by your legal adviser before launch.]
            </p>
        </div>
    );
}
