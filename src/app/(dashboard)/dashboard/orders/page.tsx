"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Clock,
    Check,
    X,
    ChefHat,
    Package,
    MoreHorizontal,
    Eye,
    RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";
import type { OrderWithItems } from "@/types";

const ORDER_STATUS = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'] as const;
const STATUS_ICONS = {
    PENDING: Clock,
    PREPARING: ChefHat,
    READY: Package,
    SERVED: Check,
    CANCELLED: X,
};

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

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await fetch("/api/orders");
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, status: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            
            if (response.ok) {
                await fetchOrders();
            }
        } catch (error) {
            console.error("Failed to update order status:", error);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.orderNumber.toString().includes(searchTerm.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.tableNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
        
        return matchesSearch && matchesStatus;
    });

    const ordersByStatus = ORDER_STATUS.map(status => ({
        status,
        icon: STATUS_ICONS[status],
        orders: filteredOrders.filter(order => order.status === status),
        color: getStatusColor(status),
    }));

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white">Orders</h1>
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {ORDER_STATUS.map(status => (
                        <Card key={status} className="bg-zinc-900 border-zinc-800">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-6 w-20" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <Skeleton key={i} className="h-20 w-full" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
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
                <h1 className="text-3xl font-bold text-white">Orders</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <Input
                            placeholder="Search orders..."
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

            <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">
                        All ({filteredOrders.length})
                    </TabsTrigger>
                    {ORDER_STATUS.map(status => (
                        <TabsTrigger key={status} value={status}>
                            {status.charAt(0) + status.slice(1).toLowerCase()} 
                            ({ordersByStatus.find(s => s.status === status)?.orders.length || 0})
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {ordersByStatus.map(({ status, icon: Icon, orders, color }) => (
                    <motion.div key={status} variants={item}>
                        <Card className="bg-card border">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Icon className={`h-5 w-5 ${color}`} />
                                    {status.charAt(0) + status.slice(1).toLowerCase()}
                                    <Badge variant="secondary" className="ml-auto">
                                        {orders.length}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    <AnimatePresence>
                        {orders.map(order => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="bg-muted rounded-lg p-4 cursor-pointer hover:bg-muted/80 transition-colors"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <div className="font-semibold">#{order.orderNumber}</div>
                                                            {order.customerName && (
                                                                <div className="text-sm text-muted-foreground">{order.customerName}</div>
                                                            )}
                                                            {order.tableNumber && (
                                                                <div className="text-xs text-muted-foreground">Table {order.tableNumber}</div>
                                                            )}
                                                        </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-zinc-700" />
                                                            {status === 'PENDING' && (
                                                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'PREPARING')}>
                                                                    <ChefHat className="h-4 w-4 mr-2" />
                                                                    Start Preparing
                                                                </DropdownMenuItem>
                                                            )}
                                                            {status === 'PREPARING' && (
                                                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'READY')} className="text-white">
                                                                    <Package className="h-4 w-4 mr-2" />
                                                                    Mark Ready
                                                                </DropdownMenuItem>
                                                            )}
                                                            {status === 'READY' && (
                                                                <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'SERVED')} className="text-white">
                                                                    <Check className="h-4 w-4 mr-2" />
                                                                    Mark Served
                                                                </DropdownMenuItem>
                                                            )}
                                                            {status !== 'CANCELLED' && status !== 'SERVED' && (
                                                                    <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'CANCELLED')} className="text-destructive">
                                                                    <X className="h-4 w-4 mr-2" />
                                                                    Cancel Order
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold">
                                                        {formatCurrency(order.totalAmount)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatDateTime(order.createdAt)}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="bg-popover text-foreground max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            Order #{selectedOrder?.orderNumber}
                            <Badge className={getStatusColor(selectedOrder?.status || 'PENDING')}>
                                {selectedOrder?.status}
                            </Badge>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Customer</label>
                                    <p className="text-foreground">{selectedOrder.customerName || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Table</label>
                                    <p className="text-foreground">{selectedOrder.tableNumber || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-foreground">{formatDateTime(selectedOrder.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Total</label>
                                    <p className="text-foreground font-semibold">{formatCurrency(selectedOrder.totalAmount)}</p>
                                </div>
                            </div>
                            
                            {selectedOrder.notes && (
                                <div>
                                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                <p className="text-foreground bg-muted p-3 rounded-lg">{selectedOrder.notes}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-3 block">Order Items</label>
                                <div className="space-y-2">
                                    {selectedOrder.orderItems.map((item, index: number) => (
                                        <div key={index} className="flex items-center justify-between bg-muted p-3 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary">{item.quantity}x</Badge>
                                                <span className="text-foreground">{item.menuItem?.name || 'Item'}</span>
                                            </div>
                                            <span className="text-foreground">{formatCurrency(item.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}