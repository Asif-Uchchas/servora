import {
    BookOpen,
    CalendarDays,
    ChefHat,
    CreditCard,
    LayoutDashboard,
    MonitorSmartphone,
    Package,
    QrCode,
    ReceiptText,
    Settings,
    Users,
} from "lucide-react";
import type { Feature } from "@/lib/plans";

export interface NavItem {
    title: string;
    href: string;
    icon: React.ElementType;
    roles?: ("ADMIN" | "MANAGER" | "STAFF")[];
    feature?: Feature;
}

export const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
    {
        label: "Service",
        items: [
            { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
            { title: "Point of sale", href: "/pos", icon: MonitorSmartphone },
            { title: "Kitchen", href: "/kitchen", icon: ChefHat, feature: "kitchen" },
            { title: "Orders", href: "/dashboard/orders", icon: ReceiptText },
            { title: "Reservations", href: "/dashboard/reservations", icon: CalendarDays, feature: "reservations" },
        ],
    },
    {
        label: "Manage",
        items: [
            { title: "Menu", href: "/dashboard/menu", icon: BookOpen, roles: ["ADMIN", "MANAGER"] },
            { title: "Tables & QR", href: "/dashboard/tables", icon: QrCode },
            { title: "Inventory", href: "/dashboard/inventory", icon: Package, roles: ["ADMIN", "MANAGER"], feature: "inventory" },
            { title: "Team", href: "/dashboard/team", icon: Users, roles: ["ADMIN", "MANAGER"] },
            { title: "Settings", href: "/dashboard/settings", icon: Settings },
            { title: "Billing", href: "/dashboard/billing", icon: CreditCard, roles: ["ADMIN"] },
        ],
    },
];

export function isActive(pathname: string, href: string) {
    return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
