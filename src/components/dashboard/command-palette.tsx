"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut, Moon, Plus, Sun } from "lucide-react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useWorkspace } from "@/components/workspace-provider";
import { NAV_SECTIONS } from "./nav";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const router = useRouter();
    const { setTheme, resolvedTheme } = useTheme();
    const { user, restaurant } = useWorkspace();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onOpenChange]);

    const run = (fn: () => void) => {
        onOpenChange(false);
        fn();
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange} title="Search Servora" description="Jump to a page or run an action">
            <CommandInput placeholder="Search pages and actions…" />
            <CommandList>
                <CommandEmpty>Nothing matches that.</CommandEmpty>
                <CommandGroup heading="Actions">
                    <CommandItem onSelect={() => run(() => router.push("/pos"))}>
                        <Plus /> New order
                    </CommandItem>
                    {user.role !== "STAFF" && (
                        <CommandItem onSelect={() => run(() => router.push("/dashboard/menu?new=1"))}>
                            <Plus /> Add menu item
                        </CommandItem>
                    )}
                    <CommandItem onSelect={() => run(() => window.open(`/r/${restaurant.slug}`, "_blank"))}>
                        <ExternalLink /> Open public menu
                    </CommandItem>
                    <CommandItem onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
                        {resolvedTheme === "dark" ? <Sun /> : <Moon />} Toggle theme
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                {NAV_SECTIONS.map((section) => (
                    <CommandGroup key={section.label} heading={section.label}>
                        {section.items
                            .filter((item) => !item.roles || item.roles.includes(user.role))
                            .map((item) => (
                                <CommandItem key={item.href} onSelect={() => run(() => router.push(item.href))}>
                                    <item.icon /> {item.title}
                                </CommandItem>
                            ))}
                    </CommandGroup>
                ))}
                <CommandSeparator />
                <CommandGroup heading="Account">
                    <CommandItem onSelect={() => run(() => signOut({ callbackUrl: "/login" }))}>
                        <LogOut /> Sign out
                        <CommandShortcut>{user.email}</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
