"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Plus,
    CreditCard,
    Receipt,
    Printer,
    Clock,
    Users,
    DollarSign,
    TrendingUp,
    Check,
    X,
    Eye,
    Settings,
    ChefHat,
    ShoppingCart,
    Calendar,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    tableNumber?: string;
    status: string;
    totalAmount: number;
    paymentStatus?: string;
    items: OrderItem[];
    createdAt: string;
}

interface OrderItem {
    id: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    menuItem: {
        id: string;
        name: string;
        price: number;
    };
}

interface TableInfo {
    id: string;
    number: string;
    status: string;
    capacity: number;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "PENDING": return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
        case "PREPARING": return "bg-blue-500/20 text-blue-700 border-blue-500/30";
        case "READY": return "bg-green-500/20 text-green-700 border-green-500/30";
        case "SERVED": return "bg-emerald-500/20 text-emerald-700 border-emerald-500/30";
        case "CANCELLED": return "bg-red-500/20 text-red-700 border-red-500/30";
        case "PAID": return "bg-gray-500/20 text-gray-700 border-gray-500/30";
        default: return "bg-gray-100 text-gray-700 border-gray-300";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "PENDING": return <Clock className="w-4 h-4" />;
        case "PREPARING": return <ChefHat className="w-4 h-4" />;
        case "READY": return <Check className="w-4 h-4" />;
        case "SERVED": return <Users className="w-4 h-4" />;
        case "CANCELLED": return <X className="w-4 h-4" />;
        case "PAID": return <CreditCard className="w-4 h-4" />;
        default: return <Clock className="w-4 h-4" />;
    }
};

export default function POSPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [newOrder, setNewOrder] = useState({
        customerName: "",
        tableNumber: "",
        items: [] as any[],
        notes: ""
    });

    useEffect(() => {
        fetchPOSData();
        fetchMenuItems();
        const interval = setInterval(fetchPOSData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchMenuItems = async () => {
        try {
            const response = await fetch("/api/menu?public=true");
            const data = await response.json();
            setMenuItems(data.menuItems || []);
        } catch (error) {
            console.error("Failed to fetch menu items:", error);
        }
    };

    const fetchPOSData = async () => {
        try {
            const response = await fetch("/api/pos");
            const data = await response.json();
            setOrders(data.orders || []);
            setTables(data.tables || []);
        } catch (error) {
            console.error("Failed to fetch POS data:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/pos/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.ok) {
                setOrders(prev => prev.map(order => 
                    order.id === orderId ? { ...order, status: newStatus } : order
                ));
                toast.success(`Order status updated to ${newStatus}`);
            }
        } catch (error) {
            toast.error("Failed to update order status");
        }
    };

    const completeOrder = async (orderId: string) => {
        try {
            const response = await fetch(`/api/pos/orders/${orderId}/complete`, {
                method: 'POST'
            });
            
            if (response.ok) {
                setOrders(prev => prev.map(order => 
                    order.id === orderId ? { ...order, status: 'PAID', paymentStatus: 'PAID' } : order
                ));
                toast.success("Order completed and paid");
            }
        } catch (error) {
            toast.error("Failed to complete order");
        }
    };

    const createNewOrder = async () => {
        try {
            if (newOrder.items.length === 0) {
                toast.error("Please add at least one item to the order");
                return;
            }

            const response = await fetch("/api/pos", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder)
            });
            
            if (response.ok) {
                const createdOrder = await response.json();
                setOrders(prev => [createdOrder, ...prev]);
                setIsNewOrderModalOpen(false);
                setNewOrder({
                    customerName: "",
                    tableNumber: "",
                    items: [],
                    notes: ""
                });
                toast.success("Order created successfully");
            } else {
                toast.error("Failed to create order");
            }
        } catch (error) {
            toast.error("Failed to create order");
        }
    };

    const addToOrder = (menuItem: any) => {
        setNewOrder(prev => {
            const existingItem = prev.items.find(item => item.menuItemId === menuItem.id);
            if (existingItem) {
                return {
                    ...prev,
                    items: prev.items.map(item =>
                        item.menuItemId === menuItem.id
                            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
                            : item
                    )
                };
            } else {
                return {
                    ...prev,
                    items: [...prev.items, {
                        menuItemId: menuItem.id,
                        quantity: 1,
                        unitPrice: menuItem.price,
                        totalPrice: menuItem.price
                    }]
                };
            }
        });
    };

    const removeFromOrder = (menuItemId: string) => {
        setNewOrder(prev => ({
            ...prev,
            items: prev.items.filter(item => item.menuItemId !== menuItemId)
        }));
    };

    const updateOrderQuantity = (menuItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromOrder(menuItemId);
            return;
        }
        
        setNewOrder(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.menuItemId === menuItemId
                    ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
                    : item
            )
        }));
    };

    const newOrderTotal = newOrder.items.reduce((sum, item) => sum + item.totalPrice, 0);

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const stats = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
        pendingOrders: orders.filter(o => o.status === "PENDING" || o.status === "PREPARING").length,
        readyOrders: orders.filter(o => o.status === "READY").length,
        completedOrders: orders.filter(o => o.status === "SERVED" || o.status === "PAID").length,
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm">
                            <Printer className="w-4 h-4 mr-2" />
                            Print Report
                        </Button>
                        <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <Card className="bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Total Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                                </div>
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Revenue</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                                </div>
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">In Progress</p>
                                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                                </div>
                                <div className="bg-yellow-100 p-2 rounded-lg">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Ready</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.readyOrders}</p>
                                </div>
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <Check className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">Completed</p>
                                    <p className="text-2xl font-bold text-gray-600">{stats.completedOrders}</p>
                                </div>
                                <div className="bg-gray-100 p-2 rounded-lg">
                                    <Users className="w-6 h-6 text-gray-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Search */}
                <Card className="bg-white mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Search orders..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <select 
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="PREPARING">Preparing</option>
                                        <option value="READY">Ready</option>
                                        <option value="SERVED">Served</option>
                                        <option value="PAID">Paid</option>
                                    </select>
                                </div>
                            </div>
                            <Button onClick={() => setIsNewOrderModalOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                New Order
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Table */}
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Active Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Table</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Time</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.map((order) => (
                                    <TableRow key={order.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                                        <TableCell>{order.customerName}</TableCell>
                                        <TableCell>{order.tableNumber || "N/A"}</TableCell>
                                        <TableCell>{order.items?.length || 0} items</TableCell>
                                        <TableCell className="font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                                        <TableCell>
                                            <Badge className={`flex items-center space-x-1 w-fit ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span>{order.status}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500">
                                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsOrderModalOpen(true);
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                
                                                {order.status === "PENDING" && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(order.id, "PREPARING")}
                                                    >
                                                        <ChefHat className="w-4 h-4 mr-1" />
                                                        Start
                                                    </Button>
                                                )}
                                                
                                                {order.status === "PREPARING" && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(order.id, "READY")}
                                                    >
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Ready
                                                    </Button>
                                                )}
                                                
                                                {order.status === "READY" && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => updateOrderStatus(order.id, "SERVED")}
                                                    >
                                                        <Users className="w-4 h-4 mr-1" />
                                                        Serve
                                                    </Button>
                                                )}
                                                
                                                {order.paymentStatus !== "PAID" && order.status !== "CANCELLED" && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => completeOrder(order.id)}
                                                    >
                                                        <CreditCard className="w-4 h-4 mr-1" />
                                                        Pay
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        
                        {filteredOrders.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-2">
                                    <ShoppingCart className="w-12 h-12 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                                <p className="text-gray-500">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Order Details Dialog */}
            <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                            View detailed information about this order including items and pricing.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Order Number</p>
                                    <p className="font-medium">#{selectedOrder.orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <Badge className={getStatusColor(selectedOrder.status)}>
                                        {getStatusIcon(selectedOrder.status)}
                                        <span className="ml-1">{selectedOrder.status}</span>
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Customer</p>
                                    <p className="font-medium">{selectedOrder.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Table</p>
                                    <p className="font-medium">{selectedOrder.tableNumber || "N/A"}</p>
                                </div>
                            </div>
                            
                            {selectedOrder.items && selectedOrder.items.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-3">Order Items</p>
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Quantity</TableHead>
                                                    <TableHead>Unit Price</TableHead>
                                                    <TableHead>Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedOrder.items.map((item) => (
                                                    <TableRow key={item.id}>
                                                        <TableCell className="font-medium">{item.menuItem?.name || "Unknown Item"}</TableCell>
                                                        <TableCell>{item.quantity}</TableCell>
                                                        <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                                        <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div>
                                    <p className="text-sm text-gray-600">Subtotal</p>
                                    <p className="font-medium">{formatCurrency(selectedOrder.totalAmount * 0.9)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Tax</p>
                                    <p className="font-medium">{formatCurrency(selectedOrder.totalAmount * 0.1)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total</p>
                                    <p className="font-bold text-lg">{formatCurrency(selectedOrder.totalAmount)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* New Order Modal */}
            <Dialog open={isNewOrderModalOpen} onOpenChange={setIsNewOrderModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Order</DialogTitle>
                        <DialogDescription>
                            Add items to create a new order for your customer.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Details */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                                <Input
                                    value={newOrder.customerName}
                                    onChange={(e) => setNewOrder(prev => ({ ...prev, customerName: e.target.value }))}
                                    placeholder="Enter customer name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Table Number</label>
                                <Input
                                    value={newOrder.tableNumber}
                                    onChange={(e) => setNewOrder(prev => ({ ...prev, tableNumber: e.target.value }))}
                                    placeholder="e.g., T1, A2, B3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={newOrder.notes}
                                    onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg resize-none"
                                    rows={3}
                                    placeholder="Order notes..."
                                />
                            </div>
                            
                            {/* Order Items */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Order Items</label>
                                {newOrder.items.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                                        <ShoppingCart className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-gray-500">No items added yet</p>
                                        <p className="text-sm text-gray-400">Select items from the menu on the right</p>
                                    </div>
                                ) : (
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item</TableHead>
                                                    <TableHead>Qty</TableHead>
                                                    <TableHead>Price</TableHead>
                                                    <TableHead>Total</TableHead>
                                                    <TableHead>Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {newOrder.items.map((item) => {
                                                    const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                                                    return (
                                                        <TableRow key={item.menuItemId}>
                                                            <TableCell>{menuItem?.name || "Unknown Item"}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center space-x-1">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateOrderQuantity(item.menuItemId, item.quantity - 1)}
                                                                    >
                                                                        -
                                                                    </Button>
                                                                    <span className="w-8 text-center">{item.quantity}</span>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => updateOrderQuantity(item.menuItemId, item.quantity + 1)}
                                                                    >
                                                                        +
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                                                            <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                                                            <TableCell>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => removeFromOrder(item.menuItemId)}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                            
                            {/* Order Summary */}
                            <div className="pt-4 border-t">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(newOrderTotal * 0.9)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax (10%):</span>
                                        <span className="font-medium">{formatCurrency(newOrderTotal * 0.1)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                        <span>Total:</span>
                                        <span>{formatCurrency(newOrderTotal)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Menu Items</h3>
                            <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                                {menuItems
                                    .filter(item => item.isAvailable)
                                    .sort((a, b) => a.category?.name?.localeCompare(b.category?.name || ""))
                                    .map((item) => (
                                        <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                            <CardContent className="p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-sm">{item.name}</h4>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                                        <p className="text-xs text-gray-400">{item.category?.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm">{formatCurrency(item.price)}</p>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => addToOrder(item)}
                                                            className="mt-1"
                                                        >
                                                            <Plus className="w-3 h-3 mr-1" />
                                                            Add
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                            </div>
                        </div>
                    </div>
                    
                    <DialogFooter className="flex justify-between">
                        <div>
                            <p className="text-sm text-gray-500">
                                {newOrder.items.length} items • {formatCurrency(newOrderTotal)}
                            </p>
                        </div>
                        <div className="space-x-2">
                            <Button variant="outline" onClick={() => setIsNewOrderModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={createNewOrder}
                                disabled={newOrder.items.length === 0}
                            >
                                Create Order
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}