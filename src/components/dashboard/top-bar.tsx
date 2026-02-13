"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, Search, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
    const { data: session } = useSession();

    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    return (
        <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-xl">
            <div className="flex items-center justify-between h-full px-6">
                {/* Left - Search */}
                <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            placeholder="Search anything..."
                            className="pl-10 h-10 bg-muted/50 border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-primary/50 focus:ring-primary/20"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-muted rounded px-1.5 py-0.5 font-mono">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl relative"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    </Button>

                    <div className="w-px h-8 bg-border mx-1" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 gap-3 px-3 hover:bg-muted/50 rounded-xl">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-gradient-to-br from-primary to-[#B8962E] text-white text-xs font-bold">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium">{session?.user?.name || "User"}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(session?.user as any)?.restaurantName || "Restaurant"}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-background border text-foreground">
                            <DropdownMenuItem className="text-muted-foreground focus:bg-muted focus:text-foreground cursor-pointer">
                                <a href="/dashboard/settings" className="flex items-center w-full">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem 
                                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
