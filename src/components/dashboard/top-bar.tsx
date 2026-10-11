"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, CalendarDays, LogOut, Menu, Package, ReceiptText, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useWorkspace } from "@/components/workspace-provider";
import { getJson } from "@/lib/fetcher";
import { getInitials } from "@/lib/utils";
import type { NotificationItem } from "@/types";
import { SidebarContent } from "./sidebar";
import { CommandPalette } from "./command-palette";

const KIND_ICON = { order: ReceiptText, reservation: CalendarDays, stock: Package };

function Notifications() {
    const { data } = useQuery({
        queryKey: ["/api/notifications"],
        queryFn: getJson<{ items: NotificationItem[]; count: number }>("/api/notifications"),
        refetchInterval: 30_000,
    });
    const count = data?.count ?? 0;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-10 rounded-lg" aria-label={`Notifications (${count})`}>
                    <Bell className="size-5" />
                    {count > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 font-mono text-[10px] font-semibold text-brand-foreground">
                            {count > 9 ? "9+" : count}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b px-4 py-3 text-sm font-semibold">Needs attention</div>
                {count === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">All caught up.</p>
                ) : (
                    <ul className="max-h-96 overflow-y-auto">
                        {data!.items.map((n) => {
                            const Icon = KIND_ICON[n.kind];
                            return (
                                <li key={n.id}>
                                    <Link href={n.href} className="flex gap-3 px-4 py-3 hover:bg-muted">
                                        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium">{n.title}</span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {n.kind === "reservation" ? n.detail.split(" · ")[0] : n.detail} ·{" "}
                                                {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </PopoverContent>
        </Popover>
    );
}

export function TopBar() {
    const { user, restaurant } = useWorkspace();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);

    return (
        <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 lg:hidden"
                    aria-label="Open navigation"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="size-5" />
                </Button>
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetContent side="left" className="w-72 border-0 p-0" showCloseButton={false}>
                        <SheetTitle className="sr-only">Navigation</SheetTitle>
                        <SidebarContent onNavigate={() => setMobileOpen(false)} />
                    </SheetContent>
                </Sheet>

                <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-lg border bg-card px-3 text-sm text-muted-foreground transition-colors hover:border-input"
                >
                    <Search className="size-4" />
                    <span className="flex-1 text-left">Search or jump to…</span>
                    <kbd className="hidden rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] sm:inline">Ctrl K</kbd>
                </button>
                <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

                <div className="ml-auto flex items-center gap-1">
                    <ThemeToggle />
                    <Notifications />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 gap-2.5 rounded-lg px-2" aria-label="Account menu">
                                <Avatar className="size-8">
                                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden text-left md:block">
                                    <span className="block text-sm leading-tight font-medium">{user.name}</span>
                                    <span className="block text-xs leading-tight text-muted-foreground capitalize">
                                        {user.role.toLowerCase()}
                                    </span>
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-60">
                            <DropdownMenuLabel className="font-normal">
                                <span className="block truncate text-sm font-medium">{user.email}</span>
                                <span className="block truncate text-xs text-muted-foreground">{restaurant.name}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings">
                                    <Settings /> Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => signOut({ callbackUrl: "/login" })}>
                                <LogOut /> Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
