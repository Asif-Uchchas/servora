import { WorkspaceProvider } from "@/components/workspace-provider";
import { ForceDark } from "@/components/force-dark";
import { getWorkspace } from "@/lib/session";
import { toWorkspaceValue } from "@/lib/workspace-value";

/** POS and kitchen display: full-screen, always dark, no sidebar. */
export default async function FullscreenLayout({ children }: { children: React.ReactNode }) {
    const workspace = await getWorkspace();

    return (
        <WorkspaceProvider value={toWorkspaceValue(workspace)}>
            <ForceDark />
            <div className="dark min-h-dvh bg-background text-foreground">{children}</div>
        </WorkspaceProvider>
    );
}
