"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, setTheme } = useTheme();

    // Both icons render; CSS shows the right one, so there's no hydration flash or mount effect.
    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={cn("size-10 rounded-lg", className)}
            aria-label="Toggle dark mode"
        >
            <Sun className="hidden size-5 dark:block" />
            <Moon className="size-5 dark:hidden" />
        </Button>
    );
}
