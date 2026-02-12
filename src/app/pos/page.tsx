"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Plus, CreditCard, Receipt, Printer, Clock, Users,
    DollarSign, Check, X, Eye, Settings, ChefHat, ShoppingCart,
    Calendar, Filter, Sun, Moon, Star, Minus, Trash2, Save, Send,
    Keyboard, Zap, Utensils, Coffee, Wine, IceCream, Grid3X3, List,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import { useTheme } from "next-themes";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Order {
    id: string; orderNumber: string; customerName: string;
    tableNumber?: string; status: string; totalAmount: number;
    paymentStatus?: string; items: OrderItem[]; createdAt: string;
}
interface OrderItem {
    id: string; menuItemId: string; quantity: number;
    unitPrice: number; totalPrice: number;
    menuItem: { id: string; name: string; price: number; };
}
interface MenuItem {
    id: string; name: string; description?: string; price: number;
    category?: { id: string; name: string; }; isAvailable: boolean;
    isFeatured: boolean; image?: string;
}

/* ─── Status helpers ─────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    PENDING: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", label: "Pending" },
    PREPARING: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", label: "Preparing" },
    READY: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", label: "Ready" },
    SERVED: { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400", label: "Served" },
    CANCELLED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500", label: "Cancelled" },
    PAID: { bg: "bg-zinc-500/10", text: "text-zinc-400", dot: "bg-zinc-500", label: "Paid" },
};

const categoryIcons: Record<string, any> = {
    "Appetizers": Utensils, "Main Course": Utensils,
    "Pasta & Risotto": Utensils, "Desserts": IceCream,
    "Beverages": Coffee, "Sides": Utensils, "Wine": Wine,
};

/* ─── Inline styles (injected once) ─────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400;500&display=swap');

  :root {
    --gold:         #c9a84c;
    --gold-light:   #e2c97e;
    --gold-dim:     #7a622e;
    --obsidian:     #0d0d0f;
    --surface-1:    #131316;
    --surface-2:    #1a1a1f;
    --surface-3:    #212128;
    --border:       rgba(201,168,76,0.12);
    --border-hover: rgba(201,168,76,0.28);
    --text-primary: #f0ece0;
    --text-muted:   rgba(240,236,224,0.45);
  }

  .pos-root { 
    font-family: 'DM Mono', monospace;
    background: var(--obsidian);
    color: var(--text-primary);
  }

  .pos-root * { box-sizing: border-box; }

  /* Scrollbar */
  .pos-root ::-webkit-scrollbar { width: 4px; height: 4px; }
  .pos-root ::-webkit-scrollbar-track { background: transparent; }
  .pos-root ::-webkit-scrollbar-thumb { background: var(--gold-dim); border-radius: 99px; }

  /* Grain overlay */
  .grain::after {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    opacity: 0.35;
  }

  /* Glass card */
  .glass {
    background: rgba(26,26,31,0.7);
    backdrop-filter: blur(16px) saturate(1.4);
    border: 1px solid var(--border);
  }

  .glass-hover:hover {
    border-color: var(--border-hover);
    background: rgba(33,33,40,0.85);
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.08);
  }

  /* Gold glow button */
  .btn-gold {
    background: linear-gradient(135deg, #c9a84c 0%, #e2c97e 50%, #a87a28 100%);
    color: #1a1408;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.04em;
    border: none;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .btn-gold::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    pointer-events: none;
  }
  .btn-gold:hover {
    box-shadow: 0 0 24px rgba(201,168,76,0.4), 0 4px 12px rgba(0,0,0,0.5);
    transform: translateY(-1px);
  }
  .btn-gold:disabled { opacity: 0.35; transform: none; box-shadow: none; }

  /* Ghost gold button */
  .btn-ghost-gold {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    font-family: 'DM Mono', monospace;
    transition: all 0.18s ease;
  }
  .btn-ghost-gold:hover {
    border-color: var(--gold-dim);
    color: var(--gold-light);
    background: rgba(201,168,76,0.06);
  }

  /* Status badge */
  .status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 10px; border-radius: 99px;
    font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
    font-family: 'DM Mono', monospace; font-weight: 500;
    border: 1px solid transparent;
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    animation: pulse-dot 2s infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
  }

  /* Gold input */
  .gold-input {
    background: rgba(13,13,15,0.8) !important;
    border: 1px solid var(--border) !important;
    color: var(--text-primary) !important;
    font-family: 'DM Mono', monospace;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .gold-input:focus {
    border-color: var(--gold-dim) !important;
    box-shadow: 0 0 0 3px rgba(201,168,76,0.08) !important;
    outline: none !important;
  }
  .gold-input::placeholder { color: var(--text-muted) !important; }

  /* Section heading */
  .serif-heading {
    font-family: 'Cormorant Garamond', serif;
    font-weight: 300;
    letter-spacing: 0.02em;
    color: var(--text-primary);
  }

  /* Table styles */
  .pos-table th {
    font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-muted); padding: 10px 16px; border-bottom: 1px solid var(--border);
    font-weight: 400;
  }
  .pos-table td {
    padding: 14px 16px; border-bottom: 1px solid rgba(201,168,76,0.05);
    font-size: 13px; color: var(--text-primary);
  }
  .pos-table tr:hover td { background: rgba(201,168,76,0.03); }
  .pos-table tr:last-child td { border-bottom: none; }

  /* Stat card */
  .stat-card {
    padding: 14px 20px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    display: flex; align-items: center; gap: 12px;
    transition: all 0.2s ease;
  }
  .stat-card:hover { border-color: var(--gold-dim); }

  /* Menu item card */
  .menu-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex; flex-direction: column; height: 100%;
    position: relative; overflow: hidden;
  }
  .menu-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold-dim), transparent);
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .menu-card:hover {
    border-color: var(--border-hover);
    background: var(--surface-3);
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.5);
  }
  .menu-card:hover::before { opacity: 1; }
  .menu-card:active { transform: scale(0.98); }

  /* Category pill */
  .cat-pill {
    padding: 6px 14px;
    border-radius: 99px;
    font-size: 11px; letter-spacing: 0.05em;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    cursor: pointer; white-space: nowrap;
    transition: all 0.18s ease;
    font-family: 'DM Mono', monospace;
    text-transform: uppercase;
  }
  .cat-pill:hover { border-color: var(--gold-dim); color: var(--gold-light); }
  .cat-pill.active {
    background: linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08));
    border-color: var(--gold-dim);
    color: var(--gold-light);
  }

  /* Order item in cart */
  .cart-item {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    transition: border-color 0.18s ease;
  }
  .cart-item:hover { border-color: var(--border-hover); }

  /* Qty button */
  .qty-btn {
    width: 28px; height: 28px; border-radius: 50%;
    border: 1px solid var(--border);
    background: transparent; color: var(--text-muted);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s ease;
  }
  .qty-btn:hover { border-color: var(--gold-dim); color: var(--gold-light); background: rgba(201,168,76,0.06); }

  /* Logo shimmer */
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  .logo-shimmer {
    background: linear-gradient(90deg, var(--gold-dim) 0%, var(--gold-light) 40%, var(--gold-dim) 60%, var(--gold-dim) 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  /* kbd tag */
  .key {
    padding: 2px 8px; background: var(--surface-3);
    border: 1px solid var(--border); border-radius: 4px;
    font-size: 11px; color: var(--text-muted);
    font-family: 'DM Mono', monospace;
  }

  /* Divider */
  .gold-divider { border: none; border-top: 1px solid var(--border); }

  /* Fade-in-up */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.35s ease forwards; }
`;

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function POSPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [menuCategories, setMenuCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [newOrder, setNewOrder] = useState({
        customerName: "", tableNumber: "", items: [] as any[], notes: ""
    });

    useEffect(() => {
        fetchPOSData();
        fetchMenuItems();
        const interval = setInterval(fetchPOSData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "F1") { e.preventDefault(); setShowShortcuts(true); }
            if (e.key === "F2") { e.preventDefault(); setIsNewOrderModalOpen(true); }
            if (e.key === "Escape") {
                setShowShortcuts(false); setIsNewOrderModalOpen(false); setIsOrderModalOpen(false);
            }
            if (e.ctrlKey && e.key === "s") {
                e.preventDefault();
                if (isNewOrderModalOpen && newOrder.items.length > 0) createNewOrder();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isNewOrderModalOpen, newOrder.items]);

    const fetchPOSData = async () => {
        try {
            const r = await fetch("/api/pos");
            const d = await r.json();
            setOrders(d.orders || []);
        } catch { console.error("Failed to fetch POS data"); }
        finally { setLoading(false); }
    };

    const fetchMenuItems = async () => {
        try {
            const r = await fetch("/api/menu?public=true");
            const d = await r.json();
            setMenuItems(d.menuItems || []);
            const cats = [...new Set(d.menuItems?.map((i: MenuItem) => i.category?.name).filter(Boolean))];
            setMenuCategories(cats as string[]);
        } catch { console.error("Failed to fetch menu items"); }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const r = await fetch(`/api/pos/orders/${orderId}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (r.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
                toast.success(`Status → ${newStatus}`);
            }
        } catch { toast.error("Failed to update status"); }
    };

    const completeOrder = async (orderId: string) => {
        try {
            const r = await fetch(`/api/pos/orders/${orderId}/complete`, { method: "POST" });
            if (r.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "PAID", paymentStatus: "PAID" } : o));
                toast.success("Payment recorded");
            }
        } catch { toast.error("Failed to complete order"); }
    };

    const createNewOrder = async () => {
        if (newOrder.items.length === 0) { toast.error("Add at least one item"); return; }
        try {
            const r = await fetch("/api/pos", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newOrder)
            });
            if (r.ok) {
                const created = await r.json();
                setOrders(prev => [created, ...prev]);
                setIsNewOrderModalOpen(false);
                setNewOrder({ customerName: "", tableNumber: "", items: [], notes: "" });
                toast.success("Order placed");
            } else { toast.error("Failed to create order"); }
        } catch { toast.error("Failed to create order"); }
    };

    const addToOrder = (item: MenuItem) => {
        setNewOrder(prev => {
            const existing = prev.items.find(i => i.menuItemId === item.id);
            if (existing) {
                return {
                    ...prev,
                    items: prev.items.map(i => i.menuItemId === item.id
                        ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.unitPrice }
                        : i
                    )
                };
            }
            return { ...prev, items: [...prev.items, { menuItemId: item.id, quantity: 1, unitPrice: item.price, totalPrice: item.price }] };
        });
    };

    const removeFromOrder = (menuItemId: string) =>
        setNewOrder(prev => ({ ...prev, items: prev.items.filter(i => i.menuItemId !== menuItemId) }));

    const updateOrderQuantity = (menuItemId: string, quantity: number) => {
        if (quantity <= 0) { removeFromOrder(menuItemId); return; }
        setNewOrder(prev => ({
            ...prev,
            items: prev.items.map(i => i.menuItemId === menuItemId
                ? { ...i, quantity, totalPrice: quantity * i.unitPrice } : i
            )
        }));
    };

    const newOrderTotal = newOrder.items.reduce((s, i) => s + i.totalPrice, 0);
    const newOrderTax = newOrderTotal * 0.1;
    const newOrderGrandTotal = newOrderTotal + newOrderTax;

    const filteredOrders = useMemo(() => orders.filter(o => {
        const q = searchTerm.toLowerCase();
        return (o.orderNumber.toLowerCase().includes(q) ||
            o.customerName?.toLowerCase().includes(q) ||
            o.tableNumber?.toLowerCase().includes(q)) &&
            (statusFilter === "all" || o.status === statusFilter);
    }), [orders, searchTerm, statusFilter]);

    const filteredMenuItems = useMemo(() => menuItems.filter(item => {
        const q = searchTerm.toLowerCase();
        return item.name.toLowerCase().includes(q) &&
            (selectedCategory === "all" || selectedCategory === "featured" ? (selectedCategory === "featured" ? item.isFeatured : true) : item.category?.name === selectedCategory) &&
            item.isAvailable;
    }), [menuItems, searchTerm, selectedCategory]);

    const stats = {
        total: orders.length,
        revenue: orders.reduce((s, o) => s + o.totalAmount, 0),
        pending: orders.filter(o => ["PENDING", "PREPARING"].includes(o.status)).length,
        ready: orders.filter(o => o.status === "READY").length,
    };

    if (loading) {
        return (
            <div style={{ background: "#0d0d0f", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderTopColor: "#c9a84c",
                        animation: "spin 0.8s linear infinite",
                        margin: "0 auto 16px"
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <p style={{ color: "rgba(201,168,76,0.6)", fontFamily: "monospace", fontSize: 12, letterSpacing: "0.1em" }}>
                        LOADING SYSTEM
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{GLOBAL_STYLES}</style>
            <div className="pos-root grain" style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

                {/* ─── HEADER ───────────────────────────────────────────── */}
                <header style={{
                    background: "rgba(13,13,15,0.95)",
                    borderBottom: "1px solid rgba(201,168,76,0.12)",
                    padding: "0 28px",
                    height: 60,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexShrink: 0,
                    backdropFilter: "blur(20px)",
                    position: "relative",
                }}>
                    {/* thin gold top line */}
                    <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 1,
                        background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.5) 50%, transparent 100%)"
                    }} />

                    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                        <div>
                            <h1 className="serif-heading logo-shimmer" style={{ fontSize: 22, margin: 0, lineHeight: 1 }}>
                                Point of Sale
                            </h1>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <Calendar style={{ width: 10, height: 10, color: "rgba(201,168,76,0.4)" }} />
                                <span style={{ fontSize: 10, color: "rgba(201,168,76,0.4)", letterSpacing: "0.08em" }}>
                                    {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button className="btn-ghost-gold" style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                            onClick={() => setShowShortcuts(true)}>
                            <Keyboard style={{ width: 12, height: 12 }} />
                            F1
                        </button>
                        <button className="btn-ghost-gold" style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <Printer style={{ width: 12, height: 12 }} />
                            Report
                        </button>
                        <button className="btn-ghost-gold" style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <Settings style={{ width: 12, height: 12 }} />
                            Settings
                        </button>
                        <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 4px" }} />
                        <button
                            className="btn-gold"
                            style={{ padding: "8px 18px", borderRadius: 6, fontSize: 12, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                            onClick={() => setIsNewOrderModalOpen(true)}
                        >
                            <Plus style={{ width: 13, height: 13 }} />
                            New Order
                            <span style={{ opacity: 0.6, fontSize: 10 }}>F2</span>
                        </button>
                    </div>
                </header>

                {/* ─── STATS BAR ────────────────────────────────────────── */}
                <div style={{
                    background: "var(--surface-1)", borderBottom: "1px solid var(--border)",
                    padding: "12px 28px", display: "flex", alignItems: "center", gap: 16,
                    flexShrink: 0,
                }}>
                    {[
                        { icon: ShoppingCart, label: "Total Orders", value: stats.total, color: "#7b9ecc" },
                        { icon: DollarSign, label: "Revenue", value: formatCurrency(stats.revenue), color: "#6eca8f" },
                        { icon: Clock, label: "In Progress", value: stats.pending, color: "#e2a84a" },
                        { icon: Check, label: "Ready", value: stats.ready, color: "#7eca9e" },
                    ].map((s, i) => (
                        <div key={i} className="stat-card fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 8,
                                background: `${s.color}18`, display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <s.icon style={{ width: 15, height: 15, color: s.color }} />
                            </div>
                            <div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 1 }}>
                                    {s.label}
                                </div>
                                <div style={{ fontSize: 18, fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, color: "var(--text-primary)", lineHeight: 1 }}>
                                    {s.value}
                                </div>
                            </div>
                        </div>
                    ))}

                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ position: "relative" }}>
                            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--text-muted)" }} />
                            <input
                                className="gold-input"
                                placeholder="Search orders…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 34, paddingRight: 12, height: 34, borderRadius: 6, fontSize: 12, width: 220, outline: "none" }}
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{
                                height: 34, padding: "0 12px", fontSize: 11, borderRadius: 6,
                                background: "var(--surface-2)", border: "1px solid var(--border)",
                                color: "var(--text-muted)", fontFamily: "'DM Mono', monospace",
                                letterSpacing: "0.04em", cursor: "pointer", outline: "none"
                            }}
                        >
                            <option value="all">All Status</option>
                            {Object.keys(STATUS_CONFIG).map(s => (
                                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ─── MAIN ORDERS TABLE ────────────────────────────────── */}
                <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
                    <div style={{
                        background: "var(--surface-1)", border: "1px solid var(--border)",
                        borderRadius: 12, overflow: "hidden",
                    }}>
                        {/* table header */}
                        <div style={{
                            padding: "16px 24px", borderBottom: "1px solid var(--border)",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                            <h2 className="serif-heading" style={{ fontSize: 20, margin: 0 }}>Active Orders</h2>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                                {filteredOrders.length} ORDERS
                            </span>
                        </div>

                        <table className="pos-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr>
                                    {["Order #", "Customer", "Table", "Items", "Total", "Status", "Time", "Actions"].map(h => (
                                        <th key={h} style={{ textAlign: "left" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredOrders.map((order, i) => {
                                        const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG["PENDING"];
                                        return (
                                            <motion.tr key={order.id}
                                                initial={{ opacity: 0, x: -8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 8 }}
                                                transition={{ duration: 0.2, delay: i * 0.03 }}
                                                style={{ cursor: "default" }}
                                            >
                                                <td><span style={{ fontFamily: "'DM Mono'", color: "var(--gold-light)", fontSize: 12 }}>#{order.orderNumber}</span></td>
                                                <td style={{ fontWeight: 500 }}>{order.customerName}</td>
                                                <td>
                                                    {order.tableNumber
                                                        ? <span style={{ padding: "2px 8px", background: "rgba(201,168,76,0.08)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11 }}>{order.tableNumber}</span>
                                                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                                                </td>
                                                <td style={{ color: "var(--text-muted)" }}>{order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}</td>
                                                <td style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, fontWeight: 300 }}>{formatCurrency(order.totalAmount)}</td>
                                                <td>
                                                    <span className={`status-badge ${cfg.bg}`} style={{ color: cfg.text, borderColor: `${cfg.text}30` }}>
                                                        <span className={`status-dot ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                <td style={{ color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.04em" }}>
                                                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                </td>
                                                <td>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                        <button className="qty-btn" title="View"
                                                            onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }}>
                                                            <Eye style={{ width: 12, height: 12 }} />
                                                        </button>
                                                        {order.status === "PENDING" && (
                                                            <button className="btn-gold" style={{ padding: "5px 10px", borderRadius: 5, fontSize: 10, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", whiteSpace: "nowrap" }}
                                                                onClick={() => updateOrderStatus(order.id, "PREPARING")}>
                                                                <ChefHat style={{ width: 10, height: 10 }} /> Start
                                                            </button>
                                                        )}
                                                        {order.status === "PREPARING" && (
                                                            <button className="btn-gold" style={{ padding: "5px 10px", borderRadius: 5, fontSize: 10, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                                                                onClick={() => updateOrderStatus(order.id, "READY")}>
                                                                <Check style={{ width: 10, height: 10 }} /> Ready
                                                            </button>
                                                        )}
                                                        {order.status === "READY" && (
                                                            <button className="btn-gold" style={{ padding: "5px 10px", borderRadius: 5, fontSize: 10, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                                                                onClick={() => updateOrderStatus(order.id, "SERVED")}>
                                                                <Users style={{ width: 10, height: 10 }} /> Serve
                                                            </button>
                                                        )}
                                                        {order.paymentStatus !== "PAID" && (
                                                            <button style={{
                                                                padding: "5px 10px", borderRadius: 5, fontSize: 10,
                                                                background: "transparent", border: "1px solid rgba(110,202,143,0.3)",
                                                                color: "#6eca8f", display: "flex", alignItems: "center", gap: 4, cursor: "pointer",
                                                                transition: "all 0.15s ease", whiteSpace: "nowrap"
                                                            }}
                                                                onClick={() => completeOrder(order.id)}>
                                                                <CreditCard style={{ width: 10, height: 10 }} /> Pay
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>

                        {filteredOrders.length === 0 && (
                            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
                                <ShoppingCart style={{ width: 36, height: 36, margin: "0 auto 16px", opacity: 0.3 }} />
                                <p className="serif-heading" style={{ fontSize: 18, margin: "0 0 6px", color: "var(--text-muted)" }}>No orders found</p>
                                <p style={{ fontSize: 12, opacity: 0.5 }}>Press F2 or click "New Order" to begin</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── ORDER DETAILS MODAL ──────────────────────────────── */}
                <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
                    <DialogContent style={{ background: "var(--surface-1)", border: "1px solid var(--border)", maxWidth: 640, borderRadius: 14, color: "var(--text-primary)" }}>
                        <DialogHeader>
                            <DialogTitle className="serif-heading" style={{ fontSize: 22 }}>Order Details</DialogTitle>
                            <DialogDescription className="sr-only">
                                Detailed breakdown of the selected order including items and totals.
                            </DialogDescription>
                        </DialogHeader>
                        {selectedOrder && (() => {
                            const cfg = STATUS_CONFIG[selectedOrder.status] || STATUS_CONFIG["PENDING"];
                            return (
                                <div style={{ marginTop: 8 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                                        {[
                                            { label: "Order Number", value: <span style={{ fontFamily: "DM Mono", color: "var(--gold-light)" }}>#{selectedOrder.orderNumber}</span> },
                                            { label: "Status", value: <span className={`status-badge ${cfg.bg}`} style={{ color: cfg.text, borderColor: `${cfg.text}30` }}><span className={`status-dot ${cfg.dot}`} />{cfg.label}</span> },
                                            { label: "Customer", value: selectedOrder.customerName },
                                            { label: "Table", value: selectedOrder.tableNumber || "—" },
                                        ].map((f, i) => (
                                            <div key={i} style={{ padding: "12px 14px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                                                <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</div>
                                                <div style={{ fontSize: 14, fontWeight: 500 }}>{f.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedOrder.items?.length > 0 && (
                                        <div style={{ background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 20 }}>
                                            <table className="pos-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead><tr>{["Item", "Qty", "Unit", "Total"].map(h => <th key={h} style={{ textAlign: "left" }}>{h}</th>)}</tr></thead>
                                                <tbody>
                                                    {selectedOrder.items.map(item => (
                                                        <tr key={item.id}>
                                                            <td>{item.menuItem?.name || "Unknown"}</td>
                                                            <td style={{ color: "var(--text-muted)" }}>{item.quantity}×</td>
                                                            <td>{formatCurrency(item.unitPrice)}</td>
                                                            <td style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>{formatCurrency(item.totalPrice)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                        {[
                                            { label: "Subtotal", val: formatCurrency(selectedOrder.totalAmount * 0.9) },
                                            { label: "Tax 10%", val: formatCurrency(selectedOrder.totalAmount * 0.1) },
                                            { label: "Total", val: formatCurrency(selectedOrder.totalAmount), accent: true },
                                        ].map((r, i) => (
                                            <div key={i} style={{
                                                padding: "12px 14px", borderRadius: 8,
                                                background: r.accent ? "rgba(201,168,76,0.08)" : "var(--surface-2)",
                                                border: `1px solid ${r.accent ? "var(--gold-dim)" : "var(--border)"}`,
                                                textAlign: "center"
                                            }}>
                                                <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{r.label}</div>
                                                <div className="serif-heading" style={{ fontSize: r.accent ? 20 : 16, color: r.accent ? "var(--gold-light)" : "var(--text-primary)" }}>{r.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </DialogContent>
                </Dialog>

                {/* ─── NEW ORDER MODAL (FULL SCREEN) ───────────────────── */}
                <Dialog open={isNewOrderModalOpen} onOpenChange={setIsNewOrderModalOpen}>
                    <DialogContent
                        className="fixed inset-0 z-[100] m-0 p-0 max-w-none sm:max-w-none w-screen h-screen rounded-none border-none translate-x-0 translate-y-0 data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100 duration-300"
                        style={{
                            background: "var(--obsidian)",
                            fontFamily: "'DM Mono', monospace",
                            display: "flex",
                            flexDirection: "column"
                        }}
                        showCloseButton={false}
                    >
                        {/* Visually-hidden title satisfies Radix Dialog accessibility requirement */}
                        <VisuallyHidden.Root>
                            <DialogTitle>New Order</DialogTitle>
                        </VisuallyHidden.Root>

                        {/* Modal header */}
                        <div style={{
                            background: "var(--surface-1)", borderBottom: "1px solid var(--border)",
                            padding: "0 32px", height: 72, display: "flex", alignItems: "center",
                            justifyContent: "space-between", flexShrink: 0, position: "relative",
                            zIndex: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
                        }}>
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)" }} />

                            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                                <div>
                                    <h2 className="serif-heading" style={{ fontSize: 28, margin: 0, color: "var(--gold-light)", letterSpacing: "0.02em" }}>New Order</h2>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><kbd className="key">Ctrl+S</kbd> to save</span>
                                        <span style={{ opacity: 0.2 }}>•</span>
                                        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><kbd className="key">Esc</kbd> to close</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <button className="btn-ghost-gold" style={{ padding: "10px 24px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 }}
                                    onClick={() => setIsNewOrderModalOpen(false)}>
                                    Cancel
                                </button>
                                <button className="btn-gold" style={{
                                    padding: "10px 32px", borderRadius: 8, fontSize: 13,
                                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                                    opacity: newOrder.items.length === 0 ? 0.35 : 1
                                }}
                                    onClick={createNewOrder} disabled={newOrder.items.length === 0}>
                                    <Save style={{ width: 16, height: 16 }} />
                                    <span>Create Order</span>
                                </button>
                            </div>
                        </div>

                        {/* Split body */}
                        <div style={{ flex: 1, display: "flex", overflow: "hidden", width: "100%" }}>

                            {/* LEFT: Menu */}
                            <div style={{ flex: 1, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                {/* search + categories */}
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-1)", flexShrink: 0 }}>
                                    <div style={{ position: "relative", marginBottom: 12 }}>
                                        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text-muted)" }} />
                                        <input className="gold-input" placeholder="Search menu…"
                                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                            style={{ width: "100%", paddingLeft: 36, paddingRight: 12, height: 40, borderRadius: 8, fontSize: 13, outline: "none" }} />
                                    </div>
                                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                                        <button className={`cat-pill ${selectedCategory === "all" ? "active" : ""}`} onClick={() => setSelectedCategory("all")}>All</button>
                                        <button className={`cat-pill ${selectedCategory === "featured" ? "active" : ""}`} onClick={() => setSelectedCategory("featured")}>
                                            ★ Featured
                                        </button>
                                        {menuCategories.map(cat => (
                                            <button key={cat} className={`cat-pill ${selectedCategory === cat ? "active" : ""}`} onClick={() => setSelectedCategory(cat)}>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* menu grid */}
                                <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                                        {filteredMenuItems.map(item => {
                                            const inOrder = newOrder.items.find(i => i.menuItemId === item.id);
                                            return (
                                                <div key={item.id} className="menu-card" onClick={() => addToOrder(item)}>
                                                    {item.isFeatured && (
                                                        <div style={{ position: "absolute", top: 10, right: 10 }}>
                                                            <Star style={{ width: 10, height: 10, color: "var(--gold)" }} />
                                                        </div>
                                                    )}
                                                    {inOrder && (
                                                        <div style={{
                                                            position: "absolute", top: 8, left: 8,
                                                            background: "var(--gold)", color: "#1a1408",
                                                            borderRadius: 99, width: 18, height: 18,
                                                            fontSize: 10, fontWeight: 700,
                                                            display: "flex", alignItems: "center", justifyContent: "center"
                                                        }}>
                                                            {inOrder.quantity}
                                                        </div>
                                                    )}
                                                    {item.category && (
                                                        <span style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, display: "block" }}>
                                                            {item.category.name}
                                                        </span>
                                                    )}
                                                    <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 500, lineHeight: 1.3, color: "var(--text-primary)" }}>
                                                        {item.name}
                                                    </h4>
                                                    {item.description && (
                                                        <p style={{
                                                            fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px", lineHeight: 1.4, flex: 1,
                                                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden"
                                                        }}>
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                                                        <span className="serif-heading" style={{ fontSize: 17, color: "var(--gold-light)" }}>
                                                            {formatCurrency(item.price)}
                                                        </span>
                                                        <div style={{
                                                            width: 24, height: 24, borderRadius: "50%",
                                                            background: "rgba(201,168,76,0.15)", border: "1px solid var(--gold-dim)",
                                                            display: "flex", alignItems: "center", justifyContent: "center"
                                                        }}>
                                                            <Plus style={{ width: 12, height: 12, color: "var(--gold)" }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {filteredMenuItems.length === 0 && (
                                        <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
                                            <Utensils style={{ width: 32, height: 32, margin: "0 auto 14px", opacity: 0.3 }} />
                                            <p className="serif-heading" style={{ fontSize: 18, margin: 0, opacity: 0.6 }}>No items found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: Cart */}
                            <div style={{ width: 340, display: "flex", flexDirection: "column", background: "var(--surface-1)", flexShrink: 0 }}>
                                {/* Customer info */}
                                <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                                        {[
                                            { label: "Customer", key: "customerName", ph: "Guest" },
                                            { label: "Table", key: "tableNumber", ph: "T1" },
                                        ].map(f => (
                                            <div key={f.key}>
                                                <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{f.label}</div>
                                                <input className="gold-input" placeholder={f.ph}
                                                    value={(newOrder as any)[f.key]}
                                                    onChange={e => setNewOrder(prev => ({ ...prev, [f.key]: e.target.value }))}
                                                    style={{ width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 12, outline: "none" }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 9, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>Notes</div>
                                        <input className="gold-input" placeholder="Special instructions…"
                                            value={newOrder.notes}
                                            onChange={e => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                                            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 12, outline: "none" }} />
                                    </div>
                                </div>

                                {/* Cart items */}
                                <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                                        <ShoppingCart style={{ width: 13, height: 13, color: "var(--gold)" }} />
                                        <span style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                                            Cart · {newOrder.items.length} item{newOrder.items.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>

                                    {newOrder.items.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
                                            <ShoppingCart style={{ width: 28, height: 28, margin: "0 auto 10px", opacity: 0.2 }} />
                                            <p style={{ fontSize: 11, opacity: 0.5 }}>Click menu items to add</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                            <AnimatePresence>
                                                {newOrder.items.map(item => {
                                                    const mi = menuItems.find(m => m.id === item.menuItemId);
                                                    return (
                                                        <motion.div key={item.menuItemId}
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, x: 16 }}
                                                            className="cart-item">
                                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                                                <div>
                                                                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{mi?.name || "Unknown"}</div>
                                                                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{formatCurrency(item.unitPrice)} each</div>
                                                                </div>
                                                                <div className="serif-heading" style={{ fontSize: 16, color: "var(--gold-light)" }}>
                                                                    {formatCurrency(item.totalPrice)}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                    <button className="qty-btn" onClick={() => updateOrderQuantity(item.menuItemId, item.quantity - 1)}>
                                                                        <Minus style={{ width: 10, height: 10 }} />
                                                                    </button>
                                                                    <span style={{ width: 24, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{item.quantity}</span>
                                                                    <button className="qty-btn" onClick={() => updateOrderQuantity(item.menuItemId, item.quantity + 1)}>
                                                                        <Plus style={{ width: 10, height: 10 }} />
                                                                    </button>
                                                                </div>
                                                                <button onClick={() => removeFromOrder(item.menuItemId)}
                                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(239,68,68,0.5)", padding: 4, transition: "color 0.15s" }}
                                                                    onMouseEnter={e => (e.currentTarget.style.color = "rgb(239,68,68)")}
                                                                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(239,68,68,0.5)")}>
                                                                    <Trash2 style={{ width: 13, height: 13 }} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>

                                {/* Summary + CTA */}
                                <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border)", background: "rgba(13,13,15,0.6)", flexShrink: 0 }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                                        {[
                                            { label: "Subtotal", val: formatCurrency(newOrderTotal) },
                                            { label: "Tax (10%)", val: formatCurrency(newOrderTax) },
                                        ].map(r => (
                                            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                                                <span>{r.label}</span><span>{r.val}</span>
                                            </div>
                                        ))}
                                        <hr className="gold-divider" style={{ margin: "4px 0" }} />
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span className="serif-heading" style={{ fontSize: 16 }}>Total</span>
                                            <span className="serif-heading" style={{ fontSize: 22, color: "var(--gold-light)" }}>{formatCurrency(newOrderGrandTotal)}</span>
                                        </div>
                                    </div>
                                    <button className="btn-gold" style={{
                                        width: "100%", padding: "14px", borderRadius: 8, fontSize: 13,
                                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                                        cursor: newOrder.items.length === 0 ? "not-allowed" : "pointer",
                                    }}
                                        onClick={createNewOrder} disabled={newOrder.items.length === 0}>
                                        <Send style={{ width: 14, height: 14 }} />
                                        Place Order · {formatCurrency(newOrderGrandTotal)}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* ─── SHORTCUTS MODAL ─────────────────────────────────── */}
                <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
                    <DialogContent style={{
                        background: "var(--surface-1)", border: "1px solid var(--border)",
                        borderRadius: 12, maxWidth: 400, color: "var(--text-primary)"
                    }}>
                        <DialogHeader>
                            <DialogTitle className="serif-heading" style={{ fontSize: 22 }}>Keyboard Shortcuts</DialogTitle>
                            <DialogDescription className="sr-only">
                                Quick keyboard shortcuts to speed up your POS workflow.
                            </DialogDescription>
                        </DialogHeader>
                        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                            {[
                                { action: "New Order", keys: ["F2"] },
                                { action: "Show Shortcuts", keys: ["F1"] },
                                { action: "Save Order", keys: ["Ctrl", "S"] },
                                { action: "Close Modal", keys: ["Esc"] },
                            ].map(s => (
                                <div key={s.action} style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "10px 14px", background: "var(--surface-2)",
                                    borderRadius: 8, border: "1px solid var(--border)", fontSize: 12
                                }}>
                                    <span style={{ color: "var(--text-muted)" }}>{s.action}</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                        {s.keys.map((k, i) => (
                                            <span key={k}>
                                                {i > 0 && <span style={{ color: "var(--text-muted)", margin: "0 2px" }}>+</span>}
                                                <kbd className="key">{k}</kbd>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}