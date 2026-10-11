import type { Metadata } from "next";
import { FeatureGate } from "@/components/feature-gate";
import { InventoryView } from "@/components/inventory/inventory-view";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
    return (
        <FeatureGate feature="inventory" label="Inventory">
            <InventoryView />
        </FeatureGate>
    );
}
