import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/session";
import { MenuEditor } from "@/components/menu/menu-editor";

export const metadata: Metadata = { title: "Menu" };

export default async function MenuPage() {
    const { user } = await getWorkspace();
    if (user.role === "STAFF") redirect("/dashboard");
    return <MenuEditor />;
}
