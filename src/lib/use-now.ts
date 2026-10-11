"use client";

import { useEffect, useState } from "react";

/** Current time as state, refreshed every `intervalMs`, so render stays pure. */
export function useNow(intervalMs = 30_000) {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
    return now;
}
