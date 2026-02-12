"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    Star,
    Clock,
    Flame,
    Filter,
    Grid3X3,
    List,
    Heart,
    ShoppingCart,
    Utensils,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface MenuItem {
    id: string;
    name: string;
    description?: string;
    price: number;
    offerPrice?: number;
    category?: {
        id: string;
        name: string;
    };
    categoryId?: string;
    imageUrl?: string;
    image?: string;
    isAvailable: boolean;
    isFeatured: boolean;
    preparationTime?: number;
    calories?: number;
    allergens?: string[];
    spicyLevel?: number;
    displayOrder: number;
}

interface Category {
    id: string;
    name: string;
    description?: string;
    displayOrder: number;
    isActive: boolean;
}

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function PublicMenuPage() {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    useEffect(() => {
        fetchMenuData();
    }, []);

    const fetchMenuData = async () => {
        try {
            const response = await fetch("/api/menu?public=true");
            const data = await response.json();
            setMenuItems(data.menuItems || []);
            setCategories(data.categories || []);
        } catch (error) {
            console.error("Failed to fetch menu:", error);
            toast.error("Failed to load menu");
        } finally {
            setLoading(false);
        }
    };

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });

    const categoriesWithAll = [
        { id: "all", name: "All Items", displayOrder: 0, isActive: true }, 
        ...categories
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-8 w-32" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(12)].map((_, i) => (
                            <Skeleton key={i} className="h-64 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-orange-50 to-amber-50 dark:from-zinc-900 dark:to-zinc-800 py-16 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                            Our Delicious Menu
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Discover our carefully crafted dishes made with the finest ingredients. 
                            From appetizers to desserts, each bite is a celebration of flavor.
                        </p>
                    </motion.div>
                    
                    <div className="flex justify-center gap-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Button 
                                onClick={() => window.location.href = "/login"} 
                                className="bg-gradient-to-r from-orange-500 to-amber-600 text-white hover:from-orange-600 hover:to-amber-700 px-8 py-3 text-lg rounded-full"
                            >
                                Order Now
                            </Button>
                        </motion.div>
                        <Button 
                            variant="outline" 
                            onClick={() => window.location.href = "/#menu"} 
                            className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 px-8 py-3 text-lg rounded-full"
                        >
                            View Full Menu
                        </Button>
                    </div>
                </div>
            </div>

            {/* Menu Section */}
            <div id="menu" className="px-6 py-16">
                <div className="max-w-7xl mx-auto">
                    {/* Search and Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mb-8"
                    >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6">
                            <div className="relative flex-1 max-w-md lg:max-w-sm">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search for dishes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-12 bg-card border-2 text-lg focus:border-orange-500 focus:ring-orange-500/20 lg:w-64"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
                                <div className="flex gap-2">
                                    <Button
                                        variant={viewMode === "grid" ? "default" : "outline"}
                                        onClick={() => setViewMode("grid")}
                                        className="h-12 px-4"
                                    >
                                        <Grid3X3 className="w-5 h-5" />
                                        <span className="hidden lg:inline ml-2">Grid</span>
                                    </Button>
                                    <Button
                                        variant={viewMode === "list" ? "default" : "outline"}
                                        onClick={() => setViewMode("list")}
                                        className="h-12 px-4"
                                    >
                                        <List className="w-5 h-5" />
                                        <span className="hidden lg:inline ml-2">List</span>
                                    </Button>
                                </div>
                                
                                {/* Enhanced Filters */}
                                <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
                                    <Button
                                        variant={selectedCategory === "all" && !searchTerm ? "default" : "outline"}
                                        onClick={() => setSelectedCategory("all")}
                                        size="sm"
                                        className="h-10"
                                    >
                                        All Items
                                    </Button>
                                    <Button
                                        variant={selectedCategory === "featured" ? "default" : "outline"}
                                        onClick={() => setSelectedCategory("featured")}
                                        size="sm"
                                        className="h-10"
                                    >
                                        ⭐ Featured
                                    </Button>
                                    <Button
                                        variant={selectedCategory === "available" ? "default" : "outline"}
                                        onClick={() => setSelectedCategory("available")}
                                        size="sm"
                                        className="h-10"
                                    >
                                        ✅ Available
                                    </Button>
                                    <Button
                                        variant={searchTerm ? "default" : "outline"}
                                        onClick={() => setSearchTerm("")}
                                        size="sm"
                                        className="h-10"
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Active Filters Display */}
                        {(selectedCategory !== "all" || searchTerm) && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-wrap gap-2 mb-6 p-3 bg-muted/30 rounded-lg border"
                            >
                                {selectedCategory !== "all" && (
                                    <span className="text-sm font-medium">
                                        Category: {categoriesWithAll.find(c => c.id === selectedCategory)?.name}
                                    </span>
                                )}
                                {searchTerm && (
                                    <span className="text-sm font-medium">
                                        Search: "{searchTerm}"
                                    </span>
                                )}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Menu Items Grid/List */}
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className={
                            viewMode === "grid"
                                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                : "space-y-4 max-w-6xl mx-auto"
                        }
                    >
                        <AnimatePresence>
                            {filteredItems.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    className="relative group"
                                >
                                    {viewMode === "grid" ? (
                                        <Card className="bg-card border hover:border-primary/20 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                                            <CardContent className="p-6">
                                                <div className="relative mb-4">
                                                    {item.isFeatured && (
                                                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg">
                                                            <Star className="w-3 h-3 mr-1" />
                                                            Featured
                                                        </Badge>
                                                    )}
                                                    
                                                    {item.image ? (
                                                        <div className="w-full h-40 mb-4 rounded-lg overflow-hidden">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-40 mb-4 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                                                            <div className="text-4xl">🍽</div>
                                                        </div>
                                                    )}

                                                    <h3 className="font-bold text-lg text-foreground mb-2 group-hover:text-orange-600 transition-colors">
                                                        {item.name}
                                                    </h3>
                                                    
                                                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                                        {item.description}
                                                    </p>

                                                    <div className="flex items-center gap-3 text-sm">
                                                        {item.preparationTime && (
                                                            <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900 px-3 py-1 rounded-full">
                                                                <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                                <span className="font-medium">{item.preparationTime} min</span>
                                                            </div>
                                                        )}
                                                        {item.calories && (
                                                            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
                                                                <Flame className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                                <span className="font-medium">{item.calories} cal</span>
                                                            </div>
                                                        )}
                                                        {item.category && (
                                                            <div className="bg-muted dark:bg-muted px-3 py-1 rounded-full text-xs font-medium">
                                                                {item.category.name}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center justify-between mt-4">
                                                        <div>
                                                            {item.offerPrice ? (
                                                                <>
                                                                    <span className="text-lg font-bold text-orange-600">
                                                                        {formatCurrency(item.offerPrice)}
                                                                    </span>
                                                                    <span className="text-sm text-muted-foreground line-through ml-2">
                                                                        {formatCurrency(item.price)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className="text-lg font-bold text-foreground">
                                                                    {formatCurrency(item.price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1">
                                                            {item.isAvailable ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                            ) : (
                                                                <XCircle className="w-4 h-4 text-red-500" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <Card className="bg-card border hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                                            <CardContent className="p-6">
                                                <div className="flex gap-4">
                                                    <div className="relative">
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-24 h-24 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                                                                <div className="text-2xl">🍽</div>
                                                            </div>
                                                        )}
                                                        {item.isFeatured && (
                                                            <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                                                                <Star className="w-3 h-3" />
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h3 className="font-bold text-lg text-foreground group-hover:text-orange-600 transition-colors">
                                                                {item.name}
                                                            </h3>
                                                            <div className="flex items-center gap-1">
                                                                {item.isAvailable ? (
                                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                                ) : (
                                                                    <XCircle className="w-4 h-4 text-red-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                        
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3 text-sm">
                                                                {item.preparationTime && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="w-3 h-3 text-orange-600" />
                                                                        <span>{item.preparationTime}m</span>
                                                                    </div>
                                                                )}
                                                                {item.calories && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Flame className="w-3 h-3 text-green-600" />
                                                                        <span>{item.calories}cal</span>
                                                                    </div>
                                                                )}
                                                                {item.category && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {item.category.name}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            
                                                            <div>
                                                                {item.offerPrice ? (
                                                                    <>
                                                                        <span className="text-lg font-bold text-orange-600">
                                                                            {formatCurrency(item.offerPrice)}
                                                                        </span>
                                                                        <span className="text-sm text-muted-foreground line-through ml-2">
                                                                            {formatCurrency(item.price)}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-lg font-bold text-foreground">
                                                                        {formatCurrency(item.price)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {filteredItems.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16"
                        >
                            <div className="text-6xl mb-4">🍽</div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">No items found</h3>
                            <p className="text-muted-foreground">
                                Try adjusting your search or filter criteria
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}