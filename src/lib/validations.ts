import { z } from "zod";

// These schemas double as PATCH schemas via .partial(), and zod 4 runs defaults and
// transforms even for omitted keys. So: no .default() here (column defaults live in
// Prisma), and every "blank → null" transform must keep `undefined` as `undefined`
// so a partial update never clears fields it didn't mention.

/** Empty string or null clears the field; undefined leaves it untouched. */
const blankToNull = <T>(v: T | "" | null | undefined) => (v === undefined ? undefined : v === "" || v === null ? null : v);

const money = z.coerce.number().finite().min(0).max(1_000_000);
const optionalMoney = z.union([money, z.literal(""), z.null()]).optional().transform(blankToNull);
const optionalInt = z
    .union([z.coerce.number().int().min(0).max(100_000), z.literal(""), z.null()])
    .optional()
    .transform(blankToNull);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional().transform(blankToNull);
const optionalEmail = z
    .union([z.string().trim().toLowerCase().email("Enter a valid email address"), z.literal(""), z.null()])
    .optional()
    .transform(blankToNull);

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");
export const passwordSchema = z.string().min(8, "Use at least 8 characters").max(200);

export const registerSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: emailSchema,
    password: passwordSchema,
    restaurantName: z.string().trim().min(2, "Restaurant name is required").max(100),
});

export const orderStatusSchema = z.enum(["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED", "PAID"]);
export const paymentMethodSchema = z.enum(["CASH", "CARD", "OTHER"]);

export const createOrderSchema = z.object({
    tableId: z.string().optional().nullable(),
    customerName: optionalText(100),
    notes: optionalText(500),
    items: z
        .array(
            z.object({
                menuItemId: z.string().min(1),
                quantity: z.coerce.number().int().min(1).max(99),
                notes: optionalText(200),
            })
        )
        .min(1, "Add at least one item")
        .max(100),
    /** Pay immediately (counter service). */
    payment: z
        .object({ method: paymentMethodSchema, tip: money.default(0) })
        .optional(),
});

export const updateOrderSchema = z.object({ status: orderStatusSchema });

export const payOrderSchema = z.object({
    method: paymentMethodSchema,
    tip: money.default(0),
});

export const menuItemSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(120),
    description: optionalText(1000),
    image: z.union([z.string().trim().url().max(2000), z.literal(""), z.null()]).optional().transform(blankToNull),
    price: money,
    offerPrice: optionalMoney,
    costPrice: optionalMoney,
    sku: optionalText(60),
    preparationTime: optionalInt,
    calories: optionalInt,
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    categoryId: z.string().min(1, "Choose a category"),
});

export const categorySchema = z.object({
    name: z.string().trim().min(1).max(80),
    description: optionalText(300),
    displayOrder: z.coerce.number().int().min(0).max(1000).optional(),
    isActive: z.boolean().optional(),
});

export const discountSchema = z
    .object({
        menuItemId: z.string().min(1),
        discountType: z.enum(["PERCENTAGE", "FLAT"]),
        discountValue: z.coerce.number().positive(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
    })
    .refine((d) => d.endDate > d.startDate, { message: "End date must be after start date", path: ["endDate"] })
    .refine((d) => d.discountType !== "PERCENTAGE" || d.discountValue <= 100, {
        message: "A percentage discount can't exceed 100",
        path: ["discountValue"],
    });

export const reservationSchema = z.object({
    customerName: z.string().trim().min(1, "Guest name is required").max(100),
    phone: optionalText(40),
    email: optionalEmail,
    guests: z.coerce.number().int().min(1).max(100),
    reservationTime: z.coerce.date(),
    tableNumber: optionalText(20),
    notes: optionalText(500),
});

export const reservationStatusSchema = z.enum(["CONFIRMED", "PENDING", "CANCELLED", "COMPLETED"]);

export const inventoryItemSchema = z.object({
    name: z.string().trim().min(1).max(120),
    quantity: z.coerce.number().min(0).optional(),
    unit: z.string().trim().min(1).max(20).optional(),
    minimumQuantity: z.coerce.number().min(0).optional(),
    costPerUnit: z.coerce.number().min(0).optional(),
});

export const inventoryTransactionSchema = z.object({
    type: z.enum(["ADD", "REMOVE", "WASTE"]),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    notes: optionalText(300),
});

export const tableSchema = z.object({
    label: z.string().trim().min(1).max(20),
    capacity: z.coerce.number().int().min(1).max(50).optional(),
    area: optionalText(40),
    status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]).optional(),
});

export const restaurantSettingsSchema = z.object({
    name: z.string().trim().min(2).max(100),
    slug: z
        .string()
        .trim()
        .toLowerCase()
        .min(3)
        .max(48)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
    description: optionalText(500),
    email: optionalEmail,
    phone: optionalText(40),
    address: optionalText(300),
    openingHours: optionalText(200),
    currency: z.string().length(3).toUpperCase(),
    timezone: z.string().min(1).max(64),
    taxRate: z.coerce.number().min(0).max(50),
    acceptReservations: z.boolean(),
});

export const profileSchema = z.object({
    name: z.string().trim().min(2).max(100),
    phone: optionalText(40),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
});

export const teamMemberSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    role: z.enum(["ADMIN", "MANAGER", "STAFF"]),
    password: passwordSchema,
});

export const publicReservationSchema = reservationSchema.omit({ tableNumber: true }).extend({
    phone: z.string().trim().min(5, "A phone number helps us reach you").max(40),
});
