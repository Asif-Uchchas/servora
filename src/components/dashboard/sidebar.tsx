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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed },
    { title: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
    { title: "Reservations", href: "/dashboard/reservations", icon: CalendarDays },
    { title: "Inventory", href: "/dashboard/inventory", icon: Package },
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
            className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-zinc-950 border-r border-zinc-800/50"
        >
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-zinc-800/50">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/10">
                        <ChefHat className="w-5 h-5 text-white" />
                    </div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-xl font-bold text-white tracking-tight"
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
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                            Main Menu
                        </span>
                    )}
                </div>

                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-400 shadow-sm"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 flex-shrink-0",
                                    isActive
                                        ? "bg-orange-500/10 text-orange-400"
                                        : "text-zinc-500 group-hover:text-white group-hover:bg-zinc-800"
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
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400" />
                            )}
                        </Link>
                    );

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href} delayDuration={0}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" className="bg-zinc-800 text-white border-zinc-700">
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
                <Separator className="bg-zinc-800/50 mb-3" />

                {/* Bottom nav items */}
                {bottomNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200",
                                collapsed && "justify-center px-0"
                            )}
                        >
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-500 flex-shrink-0">
                                <Icon className="w-5 h-5" />
                            </div>
                            {!collapsed && <span>{item.title}</span>}
                        </Link>
                    );
                })}

                {/* User Profile */}
                <div className={cn(
                    "flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50",
                    collapsed && "justify-center p-2"
                )}>
                    <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-xs font-bold">
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {session?.user?.name || "User"}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                                {(session?.user as any)?.role || "Staff"}
                            </p>
                        </div>
                    )}
                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 flex-shrink-0"
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
                    className="w-full h-9 text-zinc-500 hover:text-white hover:bg-zinc-800/50"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
                </Button>
            </div>
        </motion.aside>
    );
}
