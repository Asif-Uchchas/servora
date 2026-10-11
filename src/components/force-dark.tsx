"use client";

import { useLayoutEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Keeps the whole document (including portals such as dialogs) in dark mode while
 * mounted, then restores the user's theme. Used by the POS and kitchen display.
 */
export function ForceDark() {
    const { resolvedTheme } = useTheme();

    useLayoutEffect(() => {
        const root = document.documentElement;
        root.classList.add("dark");
        root.style.colorScheme = "dark";
        return () => {
            if (resolvedTheme !== "dark") {
                root.classList.remove("dark");
                root.style.colorScheme = "light";
            }
        };
    }, [resolvedTheme]);

    return null;
}
