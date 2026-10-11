import { getWorkspace } from "@/lib/session";
import { UpgradeGate } from "@/components/shared";
import type { Feature } from "@/lib/plans";

/** Server component: renders children only when the restaurant's plan includes `feature`. */
export async function FeatureGate({ feature, label, children }: { feature: Feature; label: string; children: React.ReactNode }) {
    const { entitlements } = await getWorkspace();
    if (!entitlements.features[feature]) {
        return <UpgradeGate feature={label} plan={feature === "analytics" ? "Business" : "Pro"} />;
    }
    return <>{children}</>;
}
