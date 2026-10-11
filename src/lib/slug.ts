import { db } from "@/lib/db";

export function slugify(input: string) {
    return (
        input
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40) || "restaurant"
    );
}

/** Reserved so tenant URLs never collide with app routes. */
const RESERVED = new Set(["api", "admin", "app", "dashboard", "login", "register", "pos", "kitchen", "pricing", "www"]);

export function isReservedSlug(slug: string) {
    return RESERVED.has(slug);
}

export async function uniqueRestaurantSlug(name: string) {
    const base = slugify(name);
    for (let i = 0; i < 20; i++) {
        const candidate = i === 0 && !RESERVED.has(base) ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const exists = await db.restaurant.findUnique({ where: { slug: candidate }, select: { id: true } });
        if (!exists) return candidate;
    }
    throw new Error("Could not allocate a unique slug");
}
