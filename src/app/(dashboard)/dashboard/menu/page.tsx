"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    Grid3X3,
    List,
    Star,
    Clock,
    Flame,
    Trash2,
    Edit,
    MoreHorizontal,
    Filter,
    Percent,
    Tag,
    Eye,
    EyeOff,
    ChevronDown,
    X,
    ImageIcon,
    Loader2,
    Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    price: number;
    offerPrice: number | null;
    costPrice: number | null;
    sku: string | null;
    preparationTime: number | null;
    calories: number | null;
    isAvailable: boolean;
    isFeatured: boolean;
    categoryId: string;
    restaurantId: string;
    createdAt: string;
    category: { id: string; name: string };
    discounts: {
        id: string;
        discountType: string;
        discountValue: number;
        startDate: string;
        endDate: string;
        isActive: boolean;
    }[];
    _count: { orderItems: number };
}

interface Category {
    id: string;
    name: string;
    displayOrder: number;
    isActive: boolean;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function MenuPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [restaurantId, setRestaurantId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
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
    });

    // Discount form state
    const [discountForm, setDiscountForm] = useState({
        discountType: "PERCENTAGE",
        discountValue: "",
        startDate: "",
        endDate: "",
    });

    const [discountTargetId, setDiscountTargetId] = useState<string>("");

    useEffect(() => {
        fetchMenuData();
    }, []);

    const fetchMenuData = async () => {
        try {
            const res = await fetch("/api/menu");
            const data = await res.json();
            setMenuItems(data.menuItems || []);
            setCategories(data.categories || []);
            setRestaurantId(data.restaurantId || "");
        } catch {
            toast.error("Failed to load menu data");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = useMemo(() => {
        return menuItems.filter((menuItem) => {
            const matchesSearch =
                menuItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                menuItem.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                activeCategory === "all" || menuItem.categoryId === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menuItems, searchQuery, activeCategory]);

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.categoryId) {
            toast.error("Name, price, and category are required");
            return;
        }
        setSaving(true);
        try {
            const method = editingItem ? "PUT" : "POST";
            const body = editingItem
                ? { id: editingItem.id, ...formData }
                : { ...formData, restaurantId };

            const res = await fetch("/api/menu", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error();

            toast.success(editingItem ? "Menu item updated!" : "Menu item created!");
            setIsModalOpen(false);
            resetForm();
            fetchMenuData();
        } catch {
            toast.error("Failed to save menu item");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (ids: string[]) => {
        try {
            const res = await fetch("/api/menu", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            });
            if (!res.ok) throw new Error();
            toast.success(`${ids.length} item(s) deleted`);
            setSelectedItems([]);
            fetchMenuData();
        } catch {
            toast.error("Failed to delete items");
        }
    };

    const handleToggle = async (id: string, field: "isAvailable" | "isFeatured", value: boolean) => {
        try {
            await fetch("/api/menu", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, [field]: value }),
            });
            setMenuItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
            );
            toast.success(`Item ${field === "isAvailable" ? (value ? "enabled" : "disabled") : (value ? "featured" : "unfeatured")}`);
        } catch {
            toast.error("Failed to update item");
        }
    };

    const handleBulkToggle = async (field: "isAvailable", value: boolean) => {
        try {
            await Promise.all(
                selectedItems.map((id) =>
                    fetch("/api/menu", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, [field]: value }),
                    })
                )
            );
            toast.success(`${selectedItems.length} items updated`);
            setSelectedItems([]);
            fetchMenuData();
        } catch {
            toast.error("Failed to update items");
        }
    };

    const handleAddDiscount = async () => {
        if (!discountForm.discountValue || !discountForm.startDate || !discountForm.endDate) {
            toast.error("All discount fields are required");
            return;
        }
        setSaving(true);
        try {
            // We'll use a separate API endpoint or inline for simplicity
            const res = await fetch("/api/menu/discounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    menuItemId: discountTargetId,
                    ...discountForm,
                }),
            });
            if (!res.ok) throw new Error();
            toast.success("Discount applied!");
            setIsDiscountModalOpen(false);
            setDiscountForm({ discountType: "PERCENTAGE", discountValue: "", startDate: "", endDate: "" });
            fetchMenuData();
        } catch {
            toast.error("Failed to apply discount");
        } finally {
            setSaving(false);
        }
    };

    const openEditModal = (menuItem: MenuItem) => {
        setEditingItem(menuItem);
        setFormData({
            name: menuItem.name,
            description: menuItem.description || "",
            image: menuItem.image || "",
            price: String(menuItem.price),
            offerPrice: menuItem.offerPrice ? String(menuItem.offerPrice) : "",
            costPrice: menuItem.costPrice ? String(menuItem.costPrice) : "",
            sku: menuItem.sku || "",
            preparationTime: menuItem.preparationTime ? String(menuItem.preparationTime) : "",
            calories: menuItem.calories ? String(menuItem.calories) : "",
            isAvailable: menuItem.isAvailable,
            isFeatured: menuItem.isFeatured,
            categoryId: menuItem.categoryId,
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingItem(null);
        setFormData({
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
            categoryId: categories[0]?.id || "",
        });
    };

    const toggleSelectItem = (id: string) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map((i) => i.id));
        }
    };

    const getActiveDiscount = (menuItem: MenuItem) => {
        const now = new Date();
        return menuItem.discounts.find(
            (d) => d.isActive && new Date(d.startDate) <= now && new Date(d.endDate) >= now
        );
    };

    const getDiscountedPrice = (menuItem: MenuItem) => {
        const discount = getActiveDiscount(menuItem);
        if (!discount) return menuItem.offerPrice || menuItem.price;

        if (discount.discountType === "PERCENTAGE") {
            return menuItem.price - (menuItem.price * discount.discountValue) / 100;
        }
        return Math.max(0, menuItem.price - discount.discountValue);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48 bg-zinc-800" />
                    <Skeleton className="h-10 w-32 bg-zinc-800" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-72 bg-zinc-800/50 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Menu Management</h1>
                    <p className="text-zinc-400 mt-1">
                        {menuItems.length} items across {categories.length} categories
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/20"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                </Button>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search menu items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl"
                    />
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2">
                    <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={`rounded-lg px-3 ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={`rounded-lg px-3 ${viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                <button
                    onClick={() => setActiveCategory("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeCategory === "all"
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                        }`}
                >
                    All Items ({menuItems.length})
                </button>
                {categories.map((cat) => {
                    const count = menuItems.filter((i) => i.categoryId === cat.id).length;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.id
                                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                    : "bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                                }`}
                        >
                            {cat.name} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {selectedItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800"
                    >
                        <span className="text-sm text-zinc-400">
                            {selectedItems.length} item(s) selected
                        </span>
                        <div className="flex items-center gap-2 ml-auto">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkToggle("isAvailable", true)}
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            >
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> Enable
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkToggle("isAvailable", false)}
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            >
                                <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Disable
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(selectedItems)}
                                className="border-red-800 text-red-400 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedItems([])}
                                className="text-zinc-500"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Grid View */}
            {viewMode === "grid" && (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                    {filteredItems.map((menuItem) => {
                        const discount = getActiveDiscount(menuItem);
                        const discountedPrice = getDiscountedPrice(menuItem);
                        const isSelected = selectedItems.includes(menuItem.id);

                        return (
                            <motion.div key={menuItem.id} variants={item} layout>
                                <Card
                                    className={`bg-zinc-900/50 border-zinc-800/50 overflow-hidden group hover:border-zinc-700 transition-all duration-300 ${isSelected ? "ring-2 ring-orange-500/50 border-orange-500/30" : ""
                                        } ${!menuItem.isAvailable ? "opacity-60" : ""}`}
                                >
                                    {/* Image Area */}
                                    <div className="relative h-44 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                                        {menuItem.image ? (
                                            <img
                                                src={menuItem.image}
                                                alt={menuItem.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ImageIcon className="w-10 h-10 text-zinc-700" />
                                            </div>
                                        )}

                                        {/* Select checkbox */}
                                        <div className="absolute top-3 left-3">
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() => toggleSelectItem(menuItem.id)}
                                                className="bg-zinc-900/80 border-zinc-600 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                            />
                                        </div>

                                        {/* Badges */}
                                        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                                            {discount && (
                                                <Badge className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 shadow-lg">
                                                    {discount.discountType === "PERCENTAGE"
                                                        ? `${discount.discountValue}% OFF`
                                                        : `$${discount.discountValue} OFF`}
                                                </Badge>
                                            )}
                                            {menuItem.isFeatured && (
                                                <Badge className="bg-amber-500/90 text-white text-[10px] font-bold px-2 py-0.5">
                                                    <Star className="w-3 h-3 mr-0.5" /> Featured
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-zinc-900/90 border-zinc-700 hover:bg-zinc-800">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                                    <DropdownMenuItem
                                                        onClick={() => openEditModal(menuItem)}
                                                        className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer"
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setDiscountTargetId(menuItem.id);
                                                            setIsDiscountModalOpen(true);
                                                        }}
                                                        className="text-zinc-300 focus:bg-zinc-800 focus:text-white cursor-pointer"
                                                    >
                                                        <Percent className="w-4 h-4 mr-2" /> Add Discount
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete([menuItem.id])}
                                                        className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div>
                                                <h3 className="font-semibold text-white text-sm truncate">{menuItem.name}</h3>
                                                <p className="text-xs text-zinc-500 mt-0.5">{menuItem.category.name}</p>
                                            </div>
                                        </div>

                                        {menuItem.description && (
                                            <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{menuItem.description}</p>
                                        )}

                                        {/* Price */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg font-bold text-white">
                                                {formatCurrency(discountedPrice)}
                                            </span>
                                            {(discount || menuItem.offerPrice) && discountedPrice < menuItem.price && (
                                                <span className="text-sm text-zinc-500 line-through">
                                                    {formatCurrency(menuItem.price)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
                                            {menuItem.preparationTime && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {menuItem.preparationTime} min
                                                </div>
                                            )}
                                            {menuItem.calories && (
                                                <div className="flex items-center gap-1">
                                                    <Flame className="w-3 h-3" /> {menuItem.calories} cal
                                                </div>
                                            )}
                                            {menuItem._count.orderItems > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <Tag className="w-3 h-3" /> {menuItem._count.orderItems} orders
                                                </div>
                                            )}
                                        </div>

                                        {/* Toggles */}
                                        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={menuItem.isAvailable}
                                                    onCheckedChange={(v) => handleToggle(menuItem.id, "isAvailable", v)}
                                                    className="data-[state=checked]:bg-emerald-500 scale-[0.85]"
                                                />
                                                <span className="text-xs text-zinc-500">
                                                    {menuItem.isAvailable ? "Available" : "Unavailable"}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleToggle(menuItem.id, "isFeatured", !menuItem.isFeatured)}
                                                className={`p-1.5 rounded-lg transition-colors ${menuItem.isFeatured
                                                        ? "text-amber-400 bg-amber-500/10"
                                                        : "text-zinc-600 hover:text-amber-400 hover:bg-amber-500/10"
                                                    }`}
                                            >
                                                <Star className="w-4 h-4" fill={menuItem.isFeatured ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* List View */}
            {viewMode === "list" && (
                <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-500 font-medium uppercase tracking-wider">
                        <div className="col-span-1 flex items-center">
                            <Checkbox
                                checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                onCheckedChange={toggleSelectAll}
                                className="border-zinc-600"
                            />
                        </div>
                        <div className="col-span-3">Item</div>
                        <div className="col-span-2">Category</div>
                        <div className="col-span-2">Price</div>
                        <div className="col-span-1">Orders</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Table Body */}
                    {filteredItems.map((menuItem) => {
                        const discount = getActiveDiscount(menuItem);
                        const discountedPrice = getDiscountedPrice(menuItem);
                        const isSelected = selectedItems.includes(menuItem.id);

                        return (
                            <div
                                key={menuItem.id}
                                className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors items-center ${isSelected ? "bg-orange-500/5" : ""
                                    } ${!menuItem.isAvailable ? "opacity-60" : ""}`}
                            >
                                <div className="col-span-1">
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={() => toggleSelectItem(menuItem.id)}
                                        className="border-zinc-600 data-[state=checked]:bg-orange-500"
                                    />
                                </div>
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0">
                                        {menuItem.image ? (
                                            <img src={menuItem.image} alt={menuItem.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <ImageIcon className="w-4 h-4 text-zinc-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                                            {menuItem.name}
                                            {menuItem.isFeatured && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" fill="currentColor" />}
                                        </p>
                                        {menuItem.sku && <p className="text-xs text-zinc-600">SKU: {menuItem.sku}</p>}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                                        {menuItem.category.name}
                                    </Badge>
                                </div>
                                <div className="col-span-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-white">{formatCurrency(discountedPrice)}</span>
                                        {discountedPrice < menuItem.price && (
                                            <span className="text-xs text-zinc-500 line-through">{formatCurrency(menuItem.price)}</span>
                                        )}
                                        {discount && (
                                            <Badge className="bg-red-500/10 text-red-400 text-[10px] border-0">
                                                {discount.discountType === "PERCENTAGE" ? `${discount.discountValue}%` : `$${discount.discountValue}`}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-1">
                                    <span className="text-sm text-zinc-400">{menuItem._count.orderItems}</span>
                                </div>
                                <div className="col-span-1">
                                    <Switch
                                        checked={menuItem.isAvailable}
                                        onCheckedChange={(v) => handleToggle(menuItem.id, "isAvailable", v)}
                                        className="data-[state=checked]:bg-emerald-500 scale-[0.85]"
                                    />
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-1">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => openEditModal(menuItem)}
                                        className="h-8 w-8 text-zinc-500 hover:text-white"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            setDiscountTargetId(menuItem.id);
                                            setIsDiscountModalOpen(true);
                                        }}
                                        className="h-8 w-8 text-zinc-500 hover:text-white"
                                    >
                                        <Percent className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleDelete([menuItem.id])}
                                        className="h-8 w-8 text-zinc-500 hover:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredItems.length === 0 && (
                        <div className="py-12 text-center">
                            <p className="text-zinc-500">No menu items found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Add/Edit Menu Item Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2">
                            <Label className="text-zinc-400 text-sm">Name *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Margherita Pizza"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div className="col-span-2">
                            <Label className="text-zinc-400 text-sm">Description</Label>
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Fresh mozzarella, tomatoes, basil..."
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white resize-none"
                                rows={2}
                            />
                        </div>

                        <div className="col-span-2">
                            <Label className="text-zinc-400 text-sm">Image URL</Label>
                            <Input
                                value={formData.image}
                                onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
                                placeholder="https://example.com/image.jpg"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">Price *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                                placeholder="12.99"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">Offer Price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.offerPrice}
                                onChange={(e) => setFormData((p) => ({ ...p, offerPrice: e.target.value }))}
                                placeholder="9.99"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">Cost Price</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.costPrice}
                                onChange={(e) => setFormData((p) => ({ ...p, costPrice: e.target.value }))}
                                placeholder="5.00"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">SKU</Label>
                            <Input
                                value={formData.sku}
                                onChange={(e) => setFormData((p) => ({ ...p, sku: e.target.value }))}
                                placeholder="PIZZA-001"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">Preparation Time (min)</Label>
                            <Input
                                type="number"
                                value={formData.preparationTime}
                                onChange={(e) => setFormData((p) => ({ ...p, preparationTime: e.target.value }))}
                                placeholder="15"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">Calories</Label>
                            <Input
                                type="number"
                                value={formData.calories}
                                onChange={(e) => setFormData((p) => ({ ...p, calories: e.target.value }))}
                                placeholder="450"
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div className="col-span-2">
                            <Label className="text-zinc-400 text-sm">Category *</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(v) => setFormData((p) => ({ ...p, categoryId: v }))}
                            >
                                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id} className="text-white focus:bg-zinc-700">
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={formData.isAvailable}
                                    onCheckedChange={(v) => setFormData((p) => ({ ...p, isAvailable: v }))}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                                <Label className="text-zinc-400 text-sm">Available</Label>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Switch
                                checked={formData.isFeatured}
                                onCheckedChange={(v) => setFormData((p) => ({ ...p, isFeatured: v }))}
                                className="data-[state=checked]:bg-amber-500"
                            />
                            <Label className="text-zinc-400 text-sm">Featured</Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            {editingItem ? "Update Item" : "Create Item"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Discount Modal */}
            <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Percent className="w-5 h-5 text-orange-400" />
                            Add Discount
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label className="text-zinc-400 text-sm">Discount Type</Label>
                            <Select
                                value={discountForm.discountType}
                                onValueChange={(v) => setDiscountForm((p) => ({ ...p, discountType: v }))}
                            >
                                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                    <SelectItem value="PERCENTAGE" className="text-white focus:bg-zinc-700">Percentage (%)</SelectItem>
                                    <SelectItem value="FLAT" className="text-white focus:bg-zinc-700">Flat Amount ($)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">
                                Discount Value {discountForm.discountType === "PERCENTAGE" ? "(%)" : "($)"}
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={discountForm.discountValue}
                                onChange={(e) => setDiscountForm((p) => ({ ...p, discountValue: e.target.value }))}
                                placeholder={discountForm.discountType === "PERCENTAGE" ? "20" : "5.00"}
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">Start Date</Label>
                            <Input
                                type="datetime-local"
                                value={discountForm.startDate}
                                onChange={(e) => setDiscountForm((p) => ({ ...p, startDate: e.target.value }))}
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>

                        <div>
                            <Label className="text-zinc-400 text-sm">End Date</Label>
                            <Input
                                type="datetime-local"
                                value={discountForm.endDate}
                                onChange={(e) => setDiscountForm((p) => ({ ...p, endDate: e.target.value }))}
                                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDiscountModalOpen(false)}
                            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddDiscount}
                            disabled={saving}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Apply Discount
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
