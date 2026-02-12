import { Role, OrderStatus, ReservationStatus, DiscountType, TransactionType } from "@prisma/client";

export type { Role, OrderStatus, ReservationStatus, DiscountType, TransactionType };

export interface DashboardStats {
    totalRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    todayOrders: number;
    activeReservations: number;
    lowStockItems: number;
    popularItems: PopularItem[];
    revenueData: RevenueDataPoint[];
    recentOrders: OrderWithItems[];
    lowStockAlerts: LowStockAlert[];
}

export interface PopularItem {
    id: string;
    name: string;
    image: string | null;
    totalOrders: number;
    revenue: number;
}

export interface RevenueDataPoint {
    date: string;
    revenue: number;
    orders: number;
}

export interface OrderWithItems {
    id: string;
    orderNumber: number;
    tableNumber: string | null;
    customerName: string | null;
    status: OrderStatus;
    totalAmount: number;
    notes: string | null;
    createdAt: Date;
    orderItems: {
        id: string;
        quantity: number;
        price: number;
        menuItem: {
            id: string;
            name: string;
            image: string | null;
        };
    }[];
}

export interface LowStockAlert {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    minimumQuantity: number;
}

export interface MenuItemWithRelations {
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
    createdAt: Date;
    category: {
        id: string;
        name: string;
    };
    discounts: {
        id: string;
        discountType: DiscountType;
        discountValue: number;
        startDate: Date;
        endDate: Date;
        isActive: boolean;
    }[];
    _count?: {
        orderItems: number;
    };
}

export interface NavItem {
    title: string;
    href: string;
    icon: string;
    roles?: Role[];
}
