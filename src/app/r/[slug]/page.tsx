import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Clock, MapPin, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { effectivePrice } from "@/lib/pricing";
import { getEntitlements } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";
import { LogoMark } from "@/components/shared";
import { BookingForm } from "./booking-form";

export const revalidate = 30;

const getMenu = cache(async (slug: string) => {
    const restaurant = await db.restaurant.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            description: true,
            address: true,
            phone: true,
            openingHours: true,
            currency: true,
            acceptReservations: true,
            plan: true,
            subscriptionStatus: true,
            trialEndsAt: true,
            menuCategories: {
                where: { isActive: true },
                orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
                select: {
                    id: true,
                    name: true,
                    description: true,
                    menuItems: {
                        orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            image: true,
                            price: true,
                            offerPrice: true,
                            preparationTime: true,
                            calories: true,
                            isAvailable: true,
                            isFeatured: true,
                            discounts: { where: { isActive: true } },
                        },
                    },
                },
            },
        },
    });
    return restaurant;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const restaurant = await getMenu(slug);
    if (!restaurant) return { title: "Menu not found" };
    return {
        title: `${restaurant.name} — Menu`,
        description: restaurant.description ?? `See the menu at ${restaurant.name}.`,
    };
}

export default async function PublicMenuPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ table?: string }>;
}) {
    const [{ slug }, { table }] = await Promise.all([params, searchParams]);
    const restaurant = await getMenu(slug);
    if (!restaurant) notFound();

    const money = (n: number) => formatCurrency(n, restaurant.currency);
    const categories = restaurant.menuCategories.filter((c) => c.menuItems.length > 0);
    const featured = categories.flatMap((c) => c.menuItems).filter((i) => i.isFeatured && i.isAvailable).slice(0, 6);
    const canBook = restaurant.acceptReservations && getEntitlements(restaurant).features.reservations;

    return (
        <div className="min-h-dvh bg-background">
            <header className="bg-primary text-primary-foreground">
                <div className="mx-auto flex max-w-3xl flex-col gap-3 px-5 pt-10 pb-7">
                    {table && <span className="font-mono text-xs tracking-[0.08em] text-brand uppercase">Table {table}</span>}
                    <h1 className="font-display text-4xl font-extrabold">{restaurant.name}</h1>
                    {restaurant.description && <p className="max-w-xl opacity-75">{restaurant.description}</p>}
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm opacity-75">
                        {restaurant.openingHours && (
                            <span className="inline-flex items-center gap-1.5"><Clock className="size-4" /> {restaurant.openingHours}</span>
                        )}
                        {restaurant.address && (
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(restaurant.address)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline">
                                <MapPin className="size-4" /> {restaurant.address}
                            </a>
                        )}
                        {restaurant.phone && (
                            <a href={`tel:${restaurant.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
                                <Phone className="size-4" /> {restaurant.phone}
                            </a>
                        )}
                    </div>
                    {canBook && (
                        <a href="#book" className="mt-2 inline-flex min-h-11 items-center self-start rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
                            Book a table
                        </a>
                    )}
                </div>
            </header>

            {categories.length > 0 && (
                <nav aria-label="Menu sections" className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
                    <div className="scrollbar-none mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3">
                        {featured.length > 0 && (
                            <a href="#popular" className="flex min-h-10 shrink-0 items-center rounded-full bg-primary px-4 text-sm whitespace-nowrap text-primary-foreground">
                                Popular
                            </a>
                        )}
                        {categories.map((c) => (
                            <a key={c.id} href={`#${c.id}`} className="flex min-h-10 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap hover:bg-muted">
                                {c.name}
                            </a>
                        ))}
                    </div>
                </nav>
            )}

            <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8">
                {categories.length === 0 && <p className="py-20 text-center text-muted-foreground">The menu is being updated — check back soon.</p>}

                {[...(featured.length ? [{ id: "popular", name: "Popular", description: null as string | null, menuItems: featured }] : []), ...categories].map((section) => (
                    <section key={section.id} id={section.id} className="scroll-mt-20">
                        <h2 className="font-display text-2xl font-bold">{section.name}</h2>
                        {section.description && <p className="mt-1 text-muted-foreground">{section.description}</p>}
                        <ul className="mt-4 flex flex-col gap-3">
                            {section.menuItems.map((item) => {
                                const price = effectivePrice(item);
                                const onOffer = price < item.price;
                                return (
                                    <li key={`${section.id}-${item.id}`} className={`flex gap-4 rounded-2xl border bg-card p-3 ${item.isAvailable ? "" : "opacity-60"}`}>
                                        {item.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.image} alt="" loading="lazy" className="size-24 shrink-0 rounded-xl object-cover" />
                                        ) : (
                                            <div aria-hidden="true" className="size-24 shrink-0 rounded-xl bg-muted" />
                                        )}
                                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                                            <div className="flex justify-between gap-3">
                                                <h3 className="font-semibold">{item.name}</h3>
                                                <span className="font-mono whitespace-nowrap">
                                                    {onOffer && <s className="mr-1.5 text-sm text-muted-foreground">{money(item.price)}</s>}
                                                    {money(price)}
                                                </span>
                                            </div>
                                            {item.description && <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>}
                                            <p className="mt-auto flex flex-wrap gap-x-3 text-xs">
                                                {!item.isAvailable ? (
                                                    <span className="text-destructive">Sold out today</span>
                                                ) : (
                                                    <>
                                                        {item.isFeatured && <span className="text-brand-ink">Chef&apos;s pick</span>}
                                                        {onOffer && <span className="text-success">Special offer</span>}
                                                        {item.preparationTime && <span className="text-muted-foreground">{item.preparationTime} min</span>}
                                                        {item.calories && <span className="text-muted-foreground">{item.calories} kcal</span>}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}

                {canBook && (
                    <section id="book" className="scroll-mt-20 rounded-2xl border bg-card p-5 sm:p-6">
                        <h2 className="font-display text-2xl font-bold">Book a table</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Send a request and {restaurant.name} will confirm it with you.</p>
                        <BookingForm slug={slug} />
                    </section>
                )}
            </main>

            <footer className="border-t py-6 text-center text-xs text-muted-foreground">
                <Link href="/" className="inline-flex items-center gap-1.5 hover:text-foreground">
                    <LogoMark className="size-5" /> Menu by Servora
                </Link>
            </footer>
        </div>
    );
}
