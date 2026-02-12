"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, Moon, Sun } from "lucide-react";
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
import { useState } from "react";

export function TopBar() {
    const { data: session } = useSession();
    const [isDark, setIsDark] = useState(true);

    const userInitials = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "U";

    return (
        <header className="sticky top-0 z-30 h-16 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
            <div className="flex items-center justify-between h-full px-6">
                {/* Left - Search */}
                <div className="flex items-center gap-4 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            placeholder="Search anything..."
                            className="pl-10 h-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl focus:border-orange-500/50 focus:ring-orange-500/20"
                        />
                        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 bg-zinc-800 rounded px-1.5 py-0.5 font-mono">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDark(!isDark)}
                        className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl"
                    >
                        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl relative"
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500" />
                    </Button>

                    <div className="w-px h-8 bg-zinc-800 mx-1" />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-10 gap-3 px-3 hover:bg-zinc-800/50 rounded-xl">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 text-white text-xs font-bold">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-white">{session?.user?.name || "User"}</p>
                                    <p className="text-xs text-zinc-500">
                                        {(session?.user as any)?.restaurantName || "Restaurant"}
                                    </p>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-white">
                            <DropdownMenuItem className="text-zinc-400 focus:bg-zinc-800 focus:text-white cursor-pointer">
                                Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-zinc-400 focus:bg-zinc-800 focus:text-white cursor-pointer">
                                Restaurant Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer">
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
