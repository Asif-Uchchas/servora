import Link from "next/link";
import { Check } from "lucide-react";
import { auth } from "@/lib/auth";
import { PLANS, TRIAL_DAYS } from "@/lib/plans";
import { Logo } from "@/components/shared";
import { cn } from "@/lib/utils";

const FEATURES = [
    {
        tag: "01 · POS",
        title: "Tablet-first point of sale",
        body: "Tap to build an order, pick a table, take cash or card, add a tip and print the receipt. Tax comes from your settings, never guessed.",
    },
    {
        tag: "02 · Kitchen",
        title: "Kitchen display with timers",
        body: "Orders land on a big-screen ticket rail the moment they're sent. Bump them from New to Cooking to Ready; late tickets turn red.",
    },
    {
        tag: "03 · QR menu",
        title: "A menu link for every table",
        body: "Your menu lives at its own address with printable QR table cards. Mark a dish sold out and guests see it instantly.",
    },
    {
        tag: "04 · Back office",
        title: "Bookings, stock and team",
        body: "Online booking requests, low-stock alerts with a full audit trail, and staff accounts with Admin, Manager and Staff roles.",
    },
];

const STEPS = [
    ["Create your workspace", "Name your restaurant and set currency and tax. Starter categories and tables are added for you."],
    ["Add your menu and tables", "Prices, photos and prep times. Print a QR card for each table."],
    ["Invite your team and open", "Servers take orders on the POS, the kitchen works the display, you watch the dashboard."],
];

export default async function HomePage() {
    const session = await auth();
    const signedIn = !!session?.user;
    const demo = !!process.env.NEXT_PUBLIC_DEMO_EMAIL;

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5">
                <Link href="/" aria-label="Servora home">
                    <Logo inverted />
                </Link>
                <nav aria-label="Primary" className="hidden gap-7 text-[15px] sm:flex">
                    <a href="#features" className="hover:text-brand-ink">Product</a>
                    <a href="#pricing" className="hover:text-brand-ink">Pricing</a>
                    <a href="#how" className="hover:text-brand-ink">How it works</a>
                </nav>
                <div className="flex gap-2">
                    {signedIn ? (
                        <Link href="/dashboard" className="rounded-lg bg-primary px-4 py-2.5 text-[15px] font-semibold text-primary-foreground">
                            Open dashboard
                        </Link>
                    ) : (
                        <>
                            <Link href="/login" className="rounded-lg px-4 py-2.5 text-[15px] font-medium hover:bg-muted">
                                Sign in
                            </Link>
                            <Link href="/register" className="rounded-lg bg-primary px-4 py-2.5 text-[15px] font-semibold text-primary-foreground">
                                Start free
                            </Link>
                        </>
                    )}
                </div>
            </header>

            <main>
                <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-14 pb-10 lg:grid-cols-2 lg:pt-20">
                    <div className="flex flex-col gap-6">
                        <span className="self-start rounded-full bg-brand-soft px-3 py-1.5 font-mono text-[13px] tracking-[0.04em] text-brand-ink">
                            POS · KITCHEN · MENU · BOOKINGS
                        </span>
                        <h1 className="font-display text-[clamp(44px,6vw,76px)] leading-[0.98] font-extrabold tracking-[-0.035em]">
                            Run the whole pass from one screen.
                        </h1>
                        <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
                            Servora connects your front of house, kitchen and back office. Take orders, fire tickets, publish a QR menu and track stock — set up in an
                            afternoon.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/register" className="rounded-xl bg-brand px-6 py-3.5 font-semibold text-brand-foreground hover:bg-brand/90">
                                Start free — no card
                            </Link>
                            {demo && (
                                <Link href="/login?demo=1" className="rounded-xl border px-6 py-3.5 font-medium hover:bg-muted">
                                    Try the live demo
                                </Link>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Free for one small venue. Every paid plan starts with a {TRIAL_DAYS}-day trial.
                        </p>
                    </div>

                    <div aria-hidden="true" className="dark flex flex-col gap-3.5 rounded-[20px] bg-[#16150f] p-5 text-[#fafaf7]">
                        <div className="flex items-center justify-between font-mono text-[13px]">
                            <span className="text-[#a3a199]">KITCHEN · LIVE</span>
                            <span className="text-brand">3 open tickets</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            {[
                                { id: "#0142 · T4", time: "06:12", color: "border-t-brand", tc: "text-brand", items: ["2× Margherita", "1× Caesar salad", "1× Lemonade"], state: "New" },
                                { id: "#0141 · T2", time: "11:40", color: "border-t-[#6ea8ff]", tc: "text-[#6ea8ff]", items: ["1× Ribeye, medium", "1× Fries"], state: "Cooking" },
                                { id: "#0140 · Takeaway", time: "Ready", color: "border-t-[#5cc98a]", tc: "text-[#5cc98a]", items: ["3× Tiramisu"], state: "Ready to serve" },
                            ].map((t) => (
                                <div key={t.id} className={cn("flex flex-col gap-2.5 rounded-xl border-t-[3px] bg-[#24231d] p-3.5", t.color)}>
                                    <div className="flex justify-between font-mono text-[13px]">
                                        <span>{t.id}</span>
                                        <span className={t.tc}>{t.time}</span>
                                    </div>
                                    <div className="text-sm leading-relaxed">
                                        {t.items.map((i) => (
                                            <div key={i}>{i}</div>
                                        ))}
                                    </div>
                                    <span className="text-xs text-[#a3a199]">{t.state}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="features" className="mx-auto flex max-w-6xl scroll-mt-10 flex-col gap-9 px-5 py-16">
                    <h2 className="max-w-2xl font-display text-[44px] leading-tight font-bold">Everything between the door and the dish pit.</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {FEATURES.map((f) => (
                            <div key={f.tag} className="flex flex-col gap-2.5 rounded-2xl border bg-card p-6">
                                <span className="font-mono text-xs text-brand-ink uppercase">{f.tag}</span>
                                <h3 className="text-xl font-semibold">{f.title}</h3>
                                <p className="leading-relaxed text-muted-foreground">{f.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="how" className="mx-auto max-w-6xl scroll-mt-10 px-5 pb-16">
                    <ol className="grid gap-8 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12 md:grid-cols-3">
                        {STEPS.map(([title, body], i) => (
                            <li key={title} className="flex flex-col gap-3">
                                <span className="font-mono text-4xl text-brand">{i + 1}</span>
                                <h3 className="text-xl font-semibold">{title}</h3>
                                <p className="leading-relaxed opacity-70">{body}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section id="pricing" className="mx-auto flex max-w-6xl scroll-mt-10 flex-col gap-8 px-5 pb-20">
                    <div className="text-center">
                        <h2 className="font-display text-[44px] font-bold">Simple pricing per location</h2>
                        <p className="mt-2 text-lg text-muted-foreground">Start free. Every paid plan has a {TRIAL_DAYS}-day trial.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {Object.values(PLANS).map((plan) => {
                            const featured = plan.id === "PRO";
                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "flex flex-col gap-5 rounded-[18px] p-7",
                                        featured ? "bg-primary text-primary-foreground" : "border bg-card"
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">{plan.name}</h3>
                                            <p className={cn("mt-1 text-sm", featured ? "opacity-70" : "text-muted-foreground")}>{plan.tagline}</p>
                                        </div>
                                        {featured && (
                                            <span className="rounded-full bg-brand px-2.5 py-1 font-mono text-[11px] text-brand-foreground">POPULAR</span>
                                        )}
                                    </div>
                                    <p className="flex items-baseline gap-1.5">
                                        <span className="font-display text-5xl font-extrabold">${plan.price}</span>
                                        <span className={featured ? "opacity-70" : "text-muted-foreground"}>/month</span>
                                    </p>
                                    <ul className="flex flex-col gap-2.5 text-[15px]">
                                        {plan.highlights.map((h) => (
                                            <li key={h} className="flex gap-2">
                                                <Check className={cn("mt-0.5 size-4 shrink-0", featured ? "text-brand" : "text-success")} />
                                                {h}
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/register"
                                        className={cn(
                                            "mt-auto rounded-xl py-3 text-center font-semibold",
                                            featured ? "bg-brand text-brand-foreground hover:bg-brand/90" : "border hover:bg-muted"
                                        )}
                                    >
                                        {plan.price === 0 ? "Start free" : `Start ${TRIAL_DAYS}-day trial`}
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>

            <footer className="border-t">
                <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-5 py-7 text-sm text-muted-foreground">
                    <span>© {new Date().getFullYear()} Servora</span>
                    <nav aria-label="Footer" className="flex gap-5">
                        <Link href="/legal/terms" className="hover:text-foreground">Terms</Link>
                        <Link href="/legal/privacy" className="hover:text-foreground">Privacy</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
