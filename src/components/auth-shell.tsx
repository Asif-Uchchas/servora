import Link from "next/link";
import { Logo } from "@/components/shared";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
    return (
        <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
            <aside className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
                <Link href="/" aria-label="Servora home">
                    <Logo />
                </Link>
                <div className="flex max-w-md flex-col gap-5">
                    <p className="font-display text-5xl leading-[1.02] font-extrabold">Run the whole pass from one screen.</p>
                    <ul className="flex flex-col gap-2 opacity-75">
                        <li>Tablet POS with tax, tips and receipts</li>
                        <li>Kitchen display with live ticket timers</li>
                        <li>QR menus, bookings, stock and team roles</li>
                    </ul>
                </div>
                <p className="text-sm opacity-50">© {new Date().getFullYear()} Servora</p>
            </aside>
            <main className="flex items-center justify-center px-5 py-12">
                <div className="flex w-full max-w-sm flex-col gap-7">
                    <Link href="/" className="lg:hidden" aria-label="Servora home">
                        <Logo inverted />
                    </Link>
                    <div>
                        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
                        <p className="mt-1.5 text-muted-foreground">{subtitle}</p>
                    </div>
                    {children}
                    <p className="text-center text-sm text-muted-foreground">{footer}</p>
                </div>
            </main>
        </div>
    );
}
