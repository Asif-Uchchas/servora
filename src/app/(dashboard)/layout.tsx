import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import { WorkspaceProvider } from "@/components/workspace-provider";
import { getWorkspace } from "@/lib/session";
import { toWorkspaceValue } from "@/lib/workspace-value";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const workspace = await getWorkspace();

    return (
        <WorkspaceProvider value={toWorkspaceValue(workspace)}>
            <div className="min-h-screen bg-background">
                <Sidebar />
                <div className="lg:pl-64">
                    <TopBar />
                    <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
                </div>
            </div>
        </WorkspaceProvider>
    );
}
