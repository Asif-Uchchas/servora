import type { Prisma } from "@prisma/client";

export const menuItemInclude = {
    category: { select: { id: true, name: true } },
    discounts: { where: { isActive: true }, orderBy: { startDate: "asc" } },
    _count: { select: { orderItems: true } },
} satisfies Prisma.MenuItemInclude;
