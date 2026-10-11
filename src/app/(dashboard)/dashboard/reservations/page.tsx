import type { Metadata } from "next";
import { FeatureGate } from "@/components/feature-gate";
import { ReservationsView } from "@/components/reservations/reservations-view";

export const metadata: Metadata = { title: "Reservations" };

export default function ReservationsPage() {
    return (
        <FeatureGate feature="reservations" label="Reservations">
            <ReservationsView />
        </FeatureGate>
    );
}
