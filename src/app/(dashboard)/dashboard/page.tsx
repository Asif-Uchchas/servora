"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    DollarSign,
    ShoppingBag,
    CalendarDays,
    AlertTriangle,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Star,
    Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import type { DashboardStats } from "@/types";

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

function KpiCard({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: "up" | "down";
    trendValue?: string;
    color: string;
}) {
    const colorMap: Record<string, string> = {
        gold: "from-primary to-[#B8962E]",
        blue: "from-blue-500 to-cyan-500",
        green: "from-emerald-500 to-green-500",
        red: "from-red-500 to-rose-500",
    };

    const bgColorMap: Record<string, string> = {
        gold: "bg-primary/10",
        blue: "bg-blue-500/10",
        green: "bg-emerald-500/10",
        red: "bg-red-500/10",
    };

    const iconColorMap: Record<string, string> = {
        gold: "#D4AF37",
        blue: "#3b82f6",
        green: "#10b981",
        red: "#ef4444",
    };

    return (
        <motion.div variants={item}>
            <Card className="bg-card/50 hover:border-primary/20 transition-all duration-300 overflow-hidden group hover-lift">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground font-medium">{title}</p>
                            <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
                            {trend && trendValue && (
                                <div className="flex items-center gap-1.5 mt-3">
                                    <div
                                        className={`flex items-center gap-0.5 text-xs font-medium ${
                                            trend === "up" ? "text-green-500" : "text-destructive"
                                        }`}
                                    >
                                        {trend === "up" ? (
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                        ) : (
                                            <ArrowDownRight className="w-3.5 h-3.5" />
                                        )}
                                        {trendValue}
                                    </div>
                                    <span className="text-xs text-muted-foreground">vs last week</span>
                                </div>
                            )}
                        </div>
                        <div
                            className={`w-12 h-12 rounded-2xl ${bgColorMap[color]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                            <Icon className="w-6 h-6" style={{ color: iconColorMap[color] }} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
        <div className="bg-popover border rounded-xl p-3 shadow-lg">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            {payload.map((entry: any, index: number) => (
                <p key={index} className="text-sm font-medium">
                    {entry.name === "revenue" ? formatCurrency(entry.value) : `${entry.value} orders`}
                </p>
            ))}
        </div>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/dashboard")
            .then((res) => res.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-80 rounded-xl lg:col-span-2" />
                    <Skeleton className="h-80 rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            {/* Header */}
            <motion.div variants={item}>
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Today's Revenue"
                    value={formatCurrency(stats?.todayRevenue || 0)}
                    icon={DollarSign}
                    trend="up"
                    trendValue="12.5%"
                    color="gold"
                />
                <KpiCard
                    title="Orders Today"
                    value={String(stats?.todayOrders || 0)}
                    icon={ShoppingBag}
                    trend="up"
                    trendValue="8.2%"
                    color="blue"
                />
                <KpiCard
                    title="Active Reservations"
                    value={String(stats?.activeReservations || 0)}
                    icon={CalendarDays}
                    color="green"
                />
                <KpiCard
                    title="Low Stock Alerts"
                    value={String(stats?.lowStockItems || 0)}
                    icon={AlertTriangle}
                    color="red"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Chart */}
                <motion.div variants={item} className="lg:col-span-2">
                    <Card className="bg-card/50 border hover-lift">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                                <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 rounded-full px-2.5 py-1">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span className="font-medium">+12.5%</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Last 7 days performance</p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={stats?.revenueData || []}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                        tickFormatter={(v) => `$${v}`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#D4AF37"
                                        strokeWidth={2.5}
                                        fill="url(#revenueGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Orders Chart */}
                <motion.div variants={item}>
                    <Card className="bg-card/50 border h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Orders This Week</CardTitle>
                            <p className="text-xs text-muted-foreground">Daily order count</p>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={stats?.revenueData || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="orders" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Popular Items */}
                <motion.div variants={item} className="lg:col-span-1">
                    <Card className="bg-card/50 border h-full">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Star className="w-4 h-4 text-primary" />
                                Popular Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(stats?.popularItems || []).map((menuItem, index) => (
                                <div
                                    key={menuItem.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{menuItem.name}</p>
                                        <p className="text-xs text-muted-foreground">{menuItem.totalOrders} orders</p>
                                    </div>
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(menuItem.revenue)}
                                    </p>
                                </div>
                            ))}
                            {(!stats?.popularItems || stats.popularItems.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Recent Orders */}
                <motion.div variants={item} className="lg:col-span-1">
                    <Card className="bg-card/50 border h-full">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                Recent Orders
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(stats?.recentOrders || []).map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            #{order.orderNumber}
                                            {order.customerName && ` • ${order.customerName}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Table {order.tableNumber || "N/A"} • {order.orderItems.length} items
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">
                                            {formatCurrency(order.totalAmount)}
                                        </p>
                                        <Badge variant="outline" className={`text-[10px] ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Low Stock Alerts */}
                <motion.div variants={item} className="lg:col-span-1">
                    <Card className="bg-card/50 border h-full">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <Package className="w-4 h-4 text-red-400" />
                                Low Stock Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(stats?.lowStockAlerts || []).map((stockItem) => (
                                <div
                                    key={stockItem.id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{stockItem.name}</p>
                                        <p className="text-xs text-red-400">
                                            {stockItem.quantity} {stockItem.unit} left (min: {stockItem.minimumQuantity})
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!stats?.lowStockAlerts || stats.lowStockAlerts.length === 0) && (
                                <div className="text-center py-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                                        <Package className="w-5 h-5 text-green-400" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">All stock levels OK</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
