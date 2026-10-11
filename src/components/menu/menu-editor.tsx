"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    BookOpen,
    Clock,
    Eye,
    EyeOff,
    FolderPlus,
    Grid3X3,
    ImageIcon,
    List,
    Loader2,
    MoreHorizontal,
    Pencil,
    Percent,
    Plus,
    Search,
    Star,
    Trash2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader } from "@/components/shared";
import { useMoney } from "@/components/workspace-provider";
import { api, getJson } from "@/lib/fetcher";
import { effectivePrice } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import type { MenuCategory, MenuItem } from "@/types";

const MENU_KEY = ["/api/menu"];
const EMPTY_ITEM = {
    name: "",
    description: "",
    image: "",
    price: "",
    offerPrice: "",
    costPrice: "",
    sku: "",
    preparationTime: "",
    calories: "",
    isAvailable: true,
    isFeatured: false,
    categoryId: "",
};
type ItemForm = typeof EMPTY_ITEM & { id?: string };

function margin(item: MenuItem) {
    if (!item.costPrice) return null;
    const price = effectivePrice(item);
    return price > 0 ? Math.round(((price - item.costPrice) / price) * 100) : null;
}

export function MenuEditor() {
    const money = useMoney();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [category, setCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"grid" | "list">("grid");
    const [selected, setSelected] = useState<string[]>([]);
    const [itemForm, setItemForm] = useState<ItemForm | null>(null);
    const [catForm, setCatForm] = useState<{ id?: string; name: string } | null>(null);
    const [discountFor, setDiscountFor] = useState<MenuItem | null>(null);
    const [discount, setDiscount] = useState({ discountType: "PERCENTAGE", discountValue: "", startDate: "", endDate: "" });
    const [saving, setSaving] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: MENU_KEY,
        queryFn: getJson<{ categories: MenuCategory[]; menuItems: MenuItem[] }>("/api/menu"),
    });
    const categories = useMemo(() => data?.categories ?? [], [data]);
    const items = useMemo(() => data?.menuItems ?? [], [data]);

    // Deep link from the command palette / POS empty state: /dashboard/menu?new=1
    useEffect(() => {
        if (searchParams.get("new") && data) {
            setItemForm({ ...EMPTY_ITEM, categoryId: categories[0]?.id ?? "" });
            router.replace("/dashboard/menu");
        }
    }, [searchParams, data, categories, router]);

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter(
            (i) =>
                (category === "all" || i.categoryId === category) &&
                (!q || i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.sku?.toLowerCase().includes(q))
        );
    }, [items, category, search]);

    const refresh = () => queryClient.invalidateQueries({ queryKey: MENU_KEY });
    const patchLocal = (id: string, patch: Partial<MenuItem>) =>
        queryClient.setQueryData<{ categories: MenuCategory[]; menuItems: MenuItem[] }>(MENU_KEY, (prev) =>
            prev ? { ...prev, menuItems: prev.menuItems.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : prev
        );

    const toggle = async (item: MenuItem, field: "isAvailable" | "isFeatured") => {
        const value = !item[field];
        patchLocal(item.id, { [field]: value });
        try {
            await api(`/api/menu/${item.id}`, { method: "PATCH", json: { [field]: value } });
        } catch (e) {
            patchLocal(item.id, { [field]: !value });
            toast.error(e instanceof Error ? e.message : "Couldn't update the item");
        }
    };

    const saveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemForm) return;
        setSaving(true);
        try {
            const { id, ...body } = itemForm;
            await api(id ? `/api/menu/${id}` : "/api/menu", { method: id ? "PATCH" : "POST", json: body });
            toast.success(id ? "Dish updated" : "Dish added");
            setItemForm(null);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save the dish");
        } finally {
            setSaving(false);
        }
    };

    const bulk = async (action: "delete" | "available" | "unavailable", ids = selected) => {
        if (action === "delete" && !confirm(`Delete ${ids.length} dish${ids.length > 1 ? "es" : ""}? Past orders keep their history.`)) return;
        try {
            const { count } = await api<{ count: number }>("/api/menu/bulk", { method: "POST", json: { ids, action } });
            toast.success(`${count} dish${count === 1 ? "" : "es"} ${action === "delete" ? "deleted" : "updated"}`);
            setSelected([]);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Bulk update failed");
        }
    };

    const saveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!catForm) return;
        setSaving(true);
        try {
            const created = await api<MenuCategory>(catForm.id ? `/api/menu/categories/${catForm.id}` : "/api/menu/categories", {
                method: catForm.id ? "PATCH" : "POST",
                json: { name: catForm.name },
            });
            setCatForm(null);
            if (!catForm.id) setCategory(created.id);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save the category");
        } finally {
            setSaving(false);
        }
    };

    const deleteCategory = async (c: MenuCategory) => {
        if (!confirm(`Delete the “${c.name}” category?`)) return;
        try {
            await api(`/api/menu/categories/${c.id}`, { method: "DELETE" });
            setCategory("all");
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't delete the category");
        }
    };

    const saveDiscount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!discountFor) return;
        setSaving(true);
        try {
            await api("/api/menu/discounts", {
                method: "POST",
                json: {
                    ...discount,
                    menuItemId: discountFor.id,
                    // datetime-local has no zone; send the instant the user meant in their own time zone.
                    startDate: new Date(discount.startDate).toISOString(),
                    endDate: new Date(discount.endDate).toISOString(),
                },
            });
            toast.success("Discount scheduled");
            setDiscountFor(null);
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't save the discount");
        } finally {
            setSaving(false);
        }
    };

    const removeDiscount = async (id: string) => {
        try {
            await api(`/api/menu/discounts/${id}`, { method: "DELETE" });
            setDiscountFor((d) => (d ? { ...d, discounts: d.discounts.filter((x) => x.id !== id) } : d));
            refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't remove the discount");
        }
    };

    const openEdit = (i: MenuItem) =>
        setItemForm({
            id: i.id,
            name: i.name,
            description: i.description ?? "",
            image: i.image ?? "",
            price: String(i.price),
            offerPrice: i.offerPrice != null ? String(i.offerPrice) : "",
            costPrice: i.costPrice != null ? String(i.costPrice) : "",
            sku: i.sku ?? "",
            preparationTime: i.preparationTime != null ? String(i.preparationTime) : "",
            calories: i.calories != null ? String(i.calories) : "",
            isAvailable: i.isAvailable,
            isFeatured: i.isFeatured,
            categoryId: i.categoryId,
        });

    const ItemMenu = ({ item }: { item: MenuItem }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${item.name}`}>
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => openEdit(item)}>
                    <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    onSelect={() => {
                        setDiscount({ discountType: "PERCENTAGE", discountValue: "", startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"), endDate: "" });
                        setDiscountFor(item);
                    }}
                >
                    <Percent /> Discounts
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toggle(item, "isFeatured")}>
                    <Star /> {item.isFeatured ? "Unfeature" : "Feature"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => bulk("delete", [item.id])}>
                    <Trash2 /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const Price = ({ item }: { item: MenuItem }) => {
        const price = effectivePrice(item);
        return (
            <span className="font-mono">
                {price < item.price && <s className="mr-1.5 text-xs text-muted-foreground">{money(item.price)}</s>}
                {money(price)}
            </span>
        );
    };

    const activeCategory = categories.find((c) => c.id === category);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Menu"
                description={`${items.length} dishes · ${items.filter((i) => !i.isAvailable).length} sold out`}
                actions={
                    <>
                        <Button variant="outline" onClick={() => setCatForm({ name: "" })}>
                            <FolderPlus /> Category
                        </Button>
                        <Button onClick={() => setItemForm({ ...EMPTY_ITEM, categoryId: activeCategory?.id ?? categories[0]?.id ?? "" })}>
                            <Plus /> Add dish
                        </Button>
                    </>
                }
            />

            <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {[{ id: "all", name: "All", _count: { menuItems: items.length } } as MenuCategory, ...categories].map((c) => (
                    <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        aria-pressed={category === c.id}
                        className={cn(
                            "flex min-h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm whitespace-nowrap",
                            category === c.id ? "bg-primary text-primary-foreground" : "border hover:bg-muted",
                            c.id !== "all" && !c.isActive && "opacity-60"
                        )}
                    >
                        {c.name}
                        <span className="font-mono text-xs opacity-60">{c._count?.menuItems ?? 0}</span>
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <label className="relative w-full sm:w-80">
                    <span className="sr-only">Search dishes</span>
                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, description or SKU" className="h-11 pl-9" />
                </label>
                {activeCategory && (
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setCatForm({ id: activeCategory.id, name: activeCategory.name })}>
                            <Pencil /> Rename
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                                await api(`/api/menu/categories/${activeCategory.id}`, { method: "PATCH", json: { isActive: !activeCategory.isActive } }).catch((e) => toast.error(e.message));
                                refresh();
                            }}
                        >
                            {activeCategory.isActive ? <EyeOff /> : <Eye />} {activeCategory.isActive ? "Hide from menu" : "Show on menu"}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteCategory(activeCategory)}>
                            <Trash2 /> Delete
                        </Button>
                    </div>
                )}
                <div className="ml-auto flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label="View">
                    <Button variant="ghost" size="icon" className={cn("size-8", view === "grid" && "bg-card shadow-sm")} aria-pressed={view === "grid"} aria-label="Grid view" onClick={() => setView("grid")}>
                        <Grid3X3 />
                    </Button>
                    <Button variant="ghost" size="icon" className={cn("size-8", view === "list" && "bg-card shadow-sm")} aria-pressed={view === "list"} aria-label="List view" onClick={() => setView("list")}>
                        <List />
                    </Button>
                </div>
            </div>

            {selected.length > 0 && (
                <div className="sticky top-20 z-20 flex flex-wrap items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-primary-foreground shadow-lg">
                    <span className="mr-auto text-sm font-medium">{selected.length} selected</span>
                    <Button size="sm" variant="secondary" onClick={() => bulk("available")}>Mark available</Button>
                    <Button size="sm" variant="secondary" onClick={() => bulk("unavailable")}>Mark sold out</Button>
                    <Button size="sm" variant="destructive" onClick={() => bulk("delete")}>Delete</Button>
                    <Button size="icon" variant="ghost" className="size-8" aria-label="Clear selection" onClick={() => setSelected([])}>
                        <X />
                    </Button>
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-72 rounded-xl" />
                    ))}
                </div>
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={BookOpen}
                    title={items.length ? "No dishes match" : "Add your first dish"}
                    description={items.length ? "Try another search or category." : "Dishes you add appear on the POS and your public menu."}
                    action={!items.length && <Button onClick={() => setItemForm({ ...EMPTY_ITEM, categoryId: categories[0]?.id ?? "" })}><Plus /> Add dish</Button>}
                />
            ) : view === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                    {visible.map((item) => (
                        <article key={item.id} className={cn("flex flex-col overflow-hidden rounded-xl border bg-card", !item.isAvailable && "opacity-70")}>
                            <div className="relative aspect-[4/3] bg-muted">
                                {item.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image} alt="" className="size-full object-cover" />
                                ) : (
                                    <div className="flex size-full items-center justify-center text-muted-foreground">
                                        <ImageIcon className="size-8" />
                                    </div>
                                )}
                                <Checkbox
                                    checked={selected.includes(item.id)}
                                    onCheckedChange={(v) => setSelected((s) => (v ? [...s, item.id] : s.filter((x) => x !== item.id)))}
                                    aria-label={`Select ${item.name}`}
                                    className="absolute top-3 left-3 size-5 bg-card"
                                />
                                <div className="absolute top-3 right-3 flex gap-1">
                                    {item.isFeatured && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-brand-foreground">Featured</span>}
                                    {item.discounts.length > 0 && <span className="rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-background">Offer</span>}
                                </div>
                            </div>
                            <div className="flex flex-1 flex-col gap-2 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <h3 className="truncate font-semibold">{item.name}</h3>
                                        <p className="text-xs text-muted-foreground">{item.category.name}</p>
                                    </div>
                                    <ItemMenu item={item} />
                                </div>
                                {item.description && <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>}
                                <div className="mt-auto flex items-center justify-between pt-2">
                                    <Price item={item} />
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {item.isAvailable ? "On" : "Sold out"}
                                        <Switch checked={item.isAvailable} onCheckedChange={() => toggle(item, "isAvailable")} aria-label={`${item.name} available`} />
                                    </label>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border bg-card">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground">
                                <th className="w-10 px-4 py-3">
                                    <Checkbox
                                        checked={visible.length > 0 && visible.every((i) => selected.includes(i.id))}
                                        onCheckedChange={(v) => setSelected(v ? visible.map((i) => i.id) : [])}
                                        aria-label="Select all"
                                    />
                                </th>
                                <th className="px-4 py-3 font-medium">Dish</th>
                                <th className="px-4 py-3 font-medium">Category</th>
                                <th className="px-4 py-3 font-medium">Price</th>
                                <th className="px-4 py-3 font-medium">Margin</th>
                                <th className="px-4 py-3 font-medium">Sold</th>
                                <th className="px-4 py-3 font-medium">Available</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((item) => {
                                const m = margin(item);
                                return (
                                    <tr key={item.id} className="border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <Checkbox
                                                checked={selected.includes(item.id)}
                                                onCheckedChange={(v) => setSelected((s) => (v ? [...s, item.id] : s.filter((x) => x !== item.id)))}
                                                aria-label={`Select ${item.name}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium">{item.name}</span>
                                            {item.isFeatured && <Star className="ml-1.5 inline size-3.5 fill-brand text-brand" aria-label="Featured" />}
                                            {item.preparationTime && (
                                                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="size-3" /> {item.preparationTime}m
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.category.name}</td>
                                        <td className="px-4 py-3"><Price item={item} /></td>
                                        <td className={cn("px-4 py-3 font-mono", m !== null && m < 60 ? "text-warning" : "text-muted-foreground")}>{m === null ? "—" : `${m}%`}</td>
                                        <td className="px-4 py-3 font-mono text-muted-foreground">{item._count?.orderItems ?? 0}</td>
                                        <td className="px-4 py-3">
                                            <Switch checked={item.isAvailable} onCheckedChange={() => toggle(item, "isAvailable")} aria-label={`${item.name} available`} />
                                        </td>
                                        <td className="px-4 py-3 text-right"><ItemMenu item={item} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Dialog open={!!itemForm} onOpenChange={(o) => !o && setItemForm(null)}>
                <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
                    {itemForm && (
                        <form onSubmit={saveItem} className="flex flex-col gap-5">
                            <DialogHeader>
                                <DialogTitle>{itemForm.id ? "Edit dish" : "Add dish"}</DialogTitle>
                                <DialogDescription>Changes show on the POS and your public menu right away.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-2 sm:col-span-2">
                                    <Label htmlFor="m-name">Name</Label>
                                    <Input id="m-name" required maxLength={120} value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-2 sm:col-span-2">
                                    <Label htmlFor="m-desc">Description</Label>
                                    <Textarea id="m-desc" rows={2} value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} placeholder="Key ingredients, how it's served" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label>Category</Label>
                                    <Select value={itemForm.categoryId} onValueChange={(v) => setItemForm({ ...itemForm, categoryId: v })}>
                                        <SelectTrigger className="h-10 w-full" aria-label="Category">
                                            <SelectValue placeholder="Choose a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="m-image">Image URL</Label>
                                    <Input id="m-image" type="url" value={itemForm.image} onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })} placeholder="https://…" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="m-price">Price</Label>
                                    <Input id="m-price" type="number" min={0} step="0.01" required value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="m-offer">Offer price</Label>
                                    <Input id="m-offer" type="number" min={0} step="0.01" value={itemForm.offerPrice} onChange={(e) => setItemForm({ ...itemForm, offerPrice: e.target.value })} placeholder="Optional" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="m-cost">Cost to make</Label>
                                    <Input id="m-cost" type="number" min={0} step="0.01" value={itemForm.costPrice} onChange={(e) => setItemForm({ ...itemForm, costPrice: e.target.value })} placeholder="For margin reports" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="m-sku">SKU</Label>
                                    <Input id="m-sku" value={itemForm.sku} onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="m-prep">Prep time (min)</Label>
                                    <Input id="m-prep" type="number" min={0} value={itemForm.preparationTime} onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="m-cal">Calories</Label>
                                    <Input id="m-cal" type="number" min={0} value={itemForm.calories} onChange={(e) => setItemForm({ ...itemForm, calories: e.target.value })} />
                                </div>
                                <label className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
                                    <span className="text-sm">Available to order</span>
                                    <Switch checked={itemForm.isAvailable} onCheckedChange={(v) => setItemForm({ ...itemForm, isAvailable: v })} />
                                </label>
                                <label className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
                                    <span className="text-sm">Featured on menu</span>
                                    <Switch checked={itemForm.isFeatured} onCheckedChange={(v) => setItemForm({ ...itemForm, isFeatured: v })} />
                                </label>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving || !itemForm.categoryId}>
                                    {saving && <Loader2 className="animate-spin" />} {itemForm.id ? "Save changes" : "Add dish"}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!catForm} onOpenChange={(o) => !o && setCatForm(null)}>
                <DialogContent className="sm:max-w-sm">
                    {catForm && (
                        <form onSubmit={saveCategory} className="flex flex-col gap-4">
                            <DialogHeader>
                                <DialogTitle>{catForm.id ? "Rename category" : "New category"}</DialogTitle>
                            </DialogHeader>
                            <Input autoFocus required maxLength={80} aria-label="Category name" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Brunch" />
                            <DialogFooter>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="animate-spin" />} Save
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!discountFor} onOpenChange={(o) => !o && setDiscountFor(null)}>
                <DialogContent className="sm:max-w-md">
                    {discountFor && (
                        <form onSubmit={saveDiscount} className="flex flex-col gap-4">
                            <DialogHeader>
                                <DialogTitle>Discounts for {discountFor.name}</DialogTitle>
                                <DialogDescription>Applied automatically on the POS and public menu while active.</DialogDescription>
                            </DialogHeader>
                            {discountFor.discounts.length > 0 && (
                                <ul className="divide-y rounded-lg border text-sm">
                                    {discountFor.discounts.map((d) => (
                                        <li key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                                            <span>
                                                <span className="font-mono font-medium">{d.discountType === "PERCENTAGE" ? `${d.discountValue}%` : money(d.discountValue)}</span> off ·{" "}
                                                {format(new Date(d.startDate), "d MMM")} – {format(new Date(d.endDate), "d MMM")}
                                            </span>
                                            <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="Remove discount" onClick={() => removeDiscount(d.id)}>
                                                <Trash2 />
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <Select value={discount.discountType} onValueChange={(v) => setDiscount({ ...discount, discountType: v })}>
                                    <SelectTrigger className="h-10 w-full" aria-label="Discount type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERCENTAGE">Percent off</SelectItem>
                                        <SelectItem value="FLAT">Amount off</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input type="number" min={0} step="0.01" required aria-label="Discount value" value={discount.discountValue} onChange={(e) => setDiscount({ ...discount, discountValue: e.target.value })} placeholder={discount.discountType === "PERCENTAGE" ? "15" : "2.00"} />
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="d-start">Starts</Label>
                                    <Input id="d-start" type="datetime-local" required value={discount.startDate} onChange={(e) => setDiscount({ ...discount, startDate: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="d-end">Ends</Label>
                                    <Input id="d-end" type="datetime-local" required value={discount.endDate} onChange={(e) => setDiscount({ ...discount, endDate: e.target.value })} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="animate-spin" />} Add discount
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
