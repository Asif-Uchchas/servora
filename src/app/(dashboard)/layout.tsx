import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="lg:pl-[280px] transition-all duration-300">
                <TopBar />
                <main className="p-6 animate-in fade-in-50 duration-500">
                    {children}
                </main>
            </div>
        </div>
    );
}
