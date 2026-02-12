"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    Package,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    MoreHorizontal,
    Edit,
    Trash2,
    RefreshCw,
    PlusCircle,
    MinusCircle,
    History,
    Filter,
    BarChart3,
    Box,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
import { formatCurrency } from "@/lib/utils";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    minimumQuantity: number;
    costPerUnit: number;
    createdAt: string;
    updatedAt: string;
    transactions: InventoryTransaction[];
}

interface InventoryTransaction {
    id: string;
    type: 'ADD' | 'REMOVE' | 'WASTE';
    quantity: number;
    notes: string | null;
    createdAt: string;
}

interface NewTransaction {
    type: 'ADD' | 'REMOVE' | 'WASTE';
    quantity: number;
    notes: string;
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFilter, setSelectedFilter] = useState<string>("all");
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [newTransaction, setNewTransaction] = useState<NewTransaction>({
        type: 'ADD',
        quantity: 1,
        notes: '',
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await fetch("/api/inventory");
            const data = await response.json();
            setItems(data);
        } catch (error) {
            console.error("Failed to fetch inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async () => {
        if (!selectedItem) return;

        try {
            const response = await fetch(`/api/inventory/${selectedItem.id}/transactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTransaction),
            });
            
            if (response.ok) {
                setIsTransactionModalOpen(false);
                setNewTransaction({ type: 'ADD', quantity: 1, notes: '' });
                await fetchInventory();
            }
        } catch (error) {
            console.error("Failed to add transaction:", error);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        let matchesFilter = true;
        if (selectedFilter === "low-stock") {
            matchesFilter = item.quantity <= item.minimumQuantity;
        } else if (selectedFilter === "out-of-stock") {
            matchesFilter = item.quantity === 0;
        }
        
        return matchesSearch && matchesFilter;
    });

    const lowStockItems = items.filter(item => item.quantity <= item.minimumQuantity);
    const outOfStockItems = items.filter(item => item.quantity === 0);
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

    const getStatusColor = (item: InventoryItem) => {
        if (item.quantity === 0) return 'text-red-400';
        if (item.quantity <= item.minimumQuantity) return 'text-yellow-400';
        return 'text-green-400';
    };

    const getStatusBadge = (item: InventoryItem) => {
        if (item.quantity === 0) return { label: 'Out of Stock', className: 'bg-red-600' };
        if (item.quantity <= item.minimumQuantity) return { label: 'Low Stock', className: 'bg-yellow-600' };
        return { label: 'In Stock', className: 'bg-green-600' };
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Inventory</h1>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="bg-zinc-900 border-zinc-800">
                            <Skeleton className="h-24 w-full" />
                        </Card>
                    ))}
                </div>
                <Card className="bg-zinc-900 border-zinc-800">
                    <Skeleton className="h-96 w-full" />
                </Card>
            </div>
        );
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-white">Inventory</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search inventory..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 w-64"
                        />
                    </div>
                    <Button className="bg-zinc-800 hover:bg-zinc-700 text-white">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-400 text-sm">Total Items</p>
                                <p className="text-2xl font-bold text-white">{items.length}</p>
                            </div>
                            <Package className="h-8 w-8 text-zinc-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-400 text-sm">Low Stock</p>
                                <p className="text-2xl font-bold text-yellow-400">{lowStockItems.length}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-400 text-sm">Out of Stock</p>
                                <p className="text-2xl font-bold text-red-400">{outOfStockItems.length}</p>
                            </div>
                            <Box className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-zinc-400 text-sm">Total Value</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
                            </div>
                            <BarChart3 className="h-8 w-8 text-zinc-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-zinc-900 border-zinc-800">
                    <TabsTrigger value="all" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        All ({filteredItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="low-stock" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        Low Stock ({lowStockItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="out-of-stock" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        Out of Stock ({outOfStockItems.length})
                    </TabsTrigger>
                    <TabsTrigger value="in-stock" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                        In Stock ({items.filter(item => item.quantity > item.minimumQuantity).length})
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Inventory Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <AnimatePresence>
                            {filteredItems.map(item => {
                                const statusBadge = getStatusBadge(item);
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="bg-zinc-800 rounded-lg p-4 hover:bg-zinc-700 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-white">{item.name}</h3>
                                                    <Badge className={statusBadge.className}>
                                                        {statusBadge.label}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-zinc-400">Quantity:</span>
                                                        <span className={`ml-2 font-medium ${getStatusColor(item)}`}>
                                                            {item.quantity} {item.unit}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-400">Minimum:</span>
                                                        <span className="ml-2 font-medium text-white">
                                                            {item.minimumQuantity} {item.unit}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-400">Cost/Unit:</span>
                                                        <span className="ml-2 font-medium text-white">
                                                            {formatCurrency(item.costPerUnit)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-400">Total Value:</span>
                                                        <span className="ml-2 font-medium text-white">
                                                            {formatCurrency(item.quantity * item.costPerUnit)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4 text-zinc-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                                                    <DropdownMenuItem 
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setIsTransactionModalOpen(true);
                                                        }} 
                                                        className="text-white"
                                                    >
                                                        <PlusCircle className="h-4 w-4 mr-2" />
                                                        Add/Remove Stock
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            setIsHistoryModalOpen(true);
                                                        }} 
                                                        className="text-white"
                                                    >
                                                        <History className="h-4 w-4 mr-2" />
                                                        View History
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12">
                                <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                                <p className="text-zinc-400">No inventory items found</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isTransactionModalOpen} onOpenChange={setIsTransactionModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage Stock - {selectedItem?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {(['ADD', 'REMOVE', 'WASTE'] as const).map(type => (
                                <Button
                                    key={type}
                                    variant={newTransaction.type === type ? "default" : "outline"}
                                    onClick={() => setNewTransaction({...newTransaction, type})}
                                    className={newTransaction.type === type ? 
                                        (type === 'ADD' ? 'bg-green-600 hover:bg-green-700' : 
                                         type === 'REMOVE' ? 'bg-blue-600 hover:bg-blue-700' : 
                                         'bg-red-600 hover:bg-red-700') : 
                                        'border-zinc-700 text-white hover:bg-zinc-800'
                                    }
                                >
                                    {type === 'ADD' ? <TrendingUp className="h-4 w-4 mr-1" /> :
                                     type === 'REMOVE' ? <MinusCircle className="h-4 w-4 mr-1" /> :
                                     <AlertTriangle className="h-4 w-4 mr-1" />}
                                    {type.charAt(0) + type.slice(1).toLowerCase()}
                                </Button>
                            ))}
                        </div>
                        
                        <div>
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0"
                                step="0.01"
                                value={newTransaction.quantity}
                                onChange={(e) => setNewTransaction({...newTransaction, quantity: parseFloat(e.target.value) || 0})}
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        
                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                value={newTransaction.notes}
                                onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})}
                                className="bg-zinc-800 border-zinc-700"
                                placeholder="Optional notes..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setIsTransactionModalOpen(false)}
                            className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                            Cancel
                        </Button>
                        <Button onClick={addTransaction} className="bg-blue-600 hover:bg-blue-700">
                            Save Transaction
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Transaction History - {selectedItem?.name}</DialogTitle>
                    </DialogHeader>
                    {selectedItem && (
                        <div className="space-y-4">
                            <div className="text-sm text-zinc-400">
                                Current Stock: <span className="text-white font-medium">
                                    {selectedItem.quantity} {selectedItem.unit}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {selectedItem.transactions.map(transaction => (
                                    <div key={transaction.id} className="bg-zinc-800 p-3 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {transaction.type === 'ADD' ? <TrendingUp className="h-4 w-4 text-green-400" /> :
                                                 transaction.type === 'REMOVE' ? <MinusCircle className="h-4 w-4 text-blue-400" /> :
                                                 <AlertTriangle className="h-4 w-4 text-red-400" />}
                                                <span className="text-white">
                                                    {transaction.type.charAt(0) + transaction.type.slice(1).toLowerCase()}
                                                </span>
                                                <span className="text-zinc-400">
                                                    {transaction.quantity} {selectedItem.unit}
                                                </span>
                                            </div>
                                            <span className="text-zinc-500 text-sm">
                                                {new Date(transaction.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {transaction.notes && (
                                            <p className="text-zinc-400 text-sm mt-2">{transaction.notes}</p>
                                        )}
                                    </div>
                                ))}
                                {selectedItem.transactions.length === 0 && (
                                    <div className="text-center py-8 text-zinc-400">
                                        No transactions recorded
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}