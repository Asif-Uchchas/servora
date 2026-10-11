import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", weight: ["500", "700", "800"] });

export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    title: {
        default: "Servora — restaurant POS, kitchen display and QR menus",
        template: "%s · Servora",
    },
    description:
        "Servora connects your front of house, kitchen and back office: point of sale, kitchen display, QR menus, reservations and inventory in one place.",
    openGraph: {
        title: "Servora",
        description: "Run the whole pass from one screen.",
        type: "website",
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
        { media: "(prefers-color-scheme: dark)", color: "#111110" },
    ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} font-sans antialiased`}>
                <Providers>
                    {children}
                    <Toaster richColors position="top-right" />
                </Providers>
            </body>
        </html>
    );
}
