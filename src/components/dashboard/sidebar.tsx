"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    UtensilsCrossed,
    ShoppingBag,
    CalendarDays,
    Package,
    ChevronLeft,
    ChevronRight,
    LogOut,
    ChefHat,
    Settings,
    DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { title: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed, roles: ["ADMIN", "MANAGER"] },
    { title: "Orders", href: "/dashboard/orders", icon: ShoppingBag, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { title: "Point of Sale", href: "/pos", icon: DollarSign, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { title: "Reservations", href: "/dashboard/reservations", icon: CalendarDays, roles: ["ADMIN", "MANAGER", "STAFF"] },
    { title: "Inventory", href: "/dashboard/inventory", icon: Package, roles: ["ADMIN", "MANAGER"] },
];

const bottomNavItems = [
    { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    return (
        <motion.aside
            animate={{ width: collapsed ? 80 : 280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-card border-r"
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-[#B8962E] flex items-center justify-center flex-shrink-0 shadow-lg">
                        <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xl font-bold tracking-tight"
                            >
                                Servora
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <div className={cn("mb-3", collapsed ? "px-0" : "px-3")}>
                    {!collapsed && (
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Main Menu
                        </span>
                    )}
                </div>

                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const userRole = session?.user?.role || "STAFF";
                    const hasAccess = !item.roles || item.roles.includes(userRole);
                    
                    if (!hasAccess) return null;
                    
                    const Icon = item.icon;

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-primary/10 text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover-lift",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 flex-shrink-0",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground group-hover:text-foreground group-hover:bg-muted"
                                )}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {item.title}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            {isActive && !collapsed && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right">
                                    {item.title}
                                </TooltipContent>
                            </Tooltip>
                        );
                    }

                    return <div key={item.href}>{linkContent}</div>;
                })}
            </nav>

            {/* Bottom Section */}
            <div className="px-3 pb-4 space-y-2">
                <Separator className="mb-3" />

                {/* Bottom nav items */}
                {bottomNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 hover-lift",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground flex-shrink-0">
                                <Icon className="w-5 h-5" />
                            </div>
                            {!collapsed && <span>{item.title}</span>}
                        </Link>
                    );
                })}

                {/* User Profile */}
                <div className={cn(
                    "flex items-center gap-3 p-3 rounded-xl bg-muted/30 border",
                    collapsed && "justify-center p-2"
                )}>
                    <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-[#B8962E] text-white text-xs font-bold">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {session?.user?.name || "User"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {(session?.user as any)?.role || "Staff"}
                            </p>
                        </div>
                    )}
                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {/* Collapse Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full h-9 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
                </Button>
            </div>
        </motion.aside>
    );
}
