import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getWorkspace } from "@/lib/session";
import { UpgradeGate } from "@/components/shared";
import { KitchenBoard } from "@/components/kitchen/kitchen-board";

export const metadata: Metadata = { title: "Kitchen" };

export default async function KitchenPage() {
    const { entitlements } = await getWorkspace();

    if (!entitlements.features.kitchen) {
        return (
            <div className="p-6">
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="size-4" /> Dashboard
                </Link>
                <UpgradeGate feature="Kitchen display" />
            </div>
        );
    }
    return <KitchenBoard />;
}
