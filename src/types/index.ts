import type {
    Role,
    OrderStatus,
    ReservationStatus,
    DiscountType,
    TransactionType,
    TableStatus,
    PaymentMethod,
} from "@prisma/client";
import type { SerializedOrder } from "@/lib/orders";
import type { Feature } from "@/lib/plans";

export type { Role, OrderStatus, ReservationStatus, DiscountType, TransactionType, TableStatus, PaymentMethod };

/** Shape returned by /api/orders and friends. */
export type Order = SerializedOrder;
export type OrderLine = SerializedOrder["items"][number];

export interface DashboardStats {
    currency: string;
    today: {
        revenue: number;
        revenueChange: number | null;
        orders: number;
        ordersChange: number | null;
        avgTicket: number;
        avgTicketChange: number | null;
        covers: number;
        reservations: number;
    };
    weekRevenue: number;
    revenueData: { date: string; revenue: number; orders: number }[];
    kitchenCount: number;
    liveOrders: Order[];
    topItems: { id: string; name: string; image: string | null; quantity: number }[];
    lowStock: { id: string; name: string; quantity: number; unit: string; minimumQuantity: number }[];
    features: Record<Feature, boolean>;
}

export interface Discount {
    id: string;
    discountType: DiscountType;
    discountValue: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface MenuCategory {
    id: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    _count?: { menuItems: number };
}

export interface MenuItem {
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
    category: { id: string; name: string };
    discounts: Discount[];
    _count?: { orderItems: number };
}

export interface DiningTable {
    id: string;
    label: string;
    capacity: number;
    area: string | null;
    status: TableStatus;
    orders?: { id: string; orderNumber: number; totalAmount: number; createdAt: string; status: OrderStatus }[];
}

export interface Reservation {
    id: string;
    customerName: string;
    phone: string | null;
    email: string | null;
    guests: number;
    reservationTime: string;
    tableNumber: string | null;
    status: ReservationStatus;
    notes: string | null;
    createdAt: string;
}

export interface InventoryTransaction {
    id: string;
    type: TransactionType;
    quantity: number;
    notes: string | null;
    createdAt: string;
}

export interface InventoryItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    minimumQuantity: number;
    costPerUnit: number;
    transactions: InventoryTransaction[];
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: Role;
    phone: string | null;
    createdAt: string;
}

export interface NotificationItem {
    id: string;
    kind: "order" | "reservation" | "stock";
    title: string;
    detail: string;
    href: string;
    at: string;
}
