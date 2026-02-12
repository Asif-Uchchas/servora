import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ["error"],
});

async function main() {
    console.log("🌱 Seeding database...\n");

    // ─── Clean existing data ─────────────────────────────────
    await prisma.inventoryTransaction.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.menuItemDiscount.deleteMany();
    await prisma.menuItem.deleteMany();
    await prisma.menuCategory.deleteMany();
    await prisma.user.deleteMany();
    await prisma.restaurant.deleteMany();

    console.log("✅ Cleaned existing data");

    // ─── Restaurant ──────────────────────────────────────────
    const restaurant = await prisma.restaurant.create({
        data: {
            name: "Servora Fine Dining",
            logo: "/logo.png",
            address: "123 Culinary Street, New York, NY 10001",
            phone: "+1 (555) 123-4567",
            email: "hello@servora.com",
            currency: "USD",
        },
    });
    console.log("✅ Created restaurant:", restaurant.name);

    // ─── Users ───────────────────────────────────────────────
    const passwordHash = await hash("password123", 12);

    const admin = await prisma.user.create({
        data: {
            name: "Alex Johnson",
            email: "admin@servora.com",
            passwordHash,
            role: "ADMIN",
            restaurantId: restaurant.id,
        },
    });

    await prisma.user.create({
        data: {
            name: "Sarah Miller",
            email: "manager@servora.com",
            passwordHash,
            role: "MANAGER",
            restaurantId: restaurant.id,
        },
    });

    await prisma.user.create({
        data: {
            name: "James Wilson",
            email: "staff@servora.com",
            passwordHash,
            role: "STAFF",
            restaurantId: restaurant.id,
        },
    });
    console.log("✅ Created 3 users (admin, manager, staff)");

    // ─── Menu Categories ─────────────────────────────────────
    const categories = await Promise.all([
        prisma.menuCategory.create({
            data: { name: "Appetizers", displayOrder: 1, restaurantId: restaurant.id },
        }),
        prisma.menuCategory.create({
            data: { name: "Main Course", displayOrder: 2, restaurantId: restaurant.id },
        }),
        prisma.menuCategory.create({
            data: { name: "Pasta & Risotto", displayOrder: 3, restaurantId: restaurant.id },
        }),
        prisma.menuCategory.create({
            data: { name: "Desserts", displayOrder: 4, restaurantId: restaurant.id },
        }),
        prisma.menuCategory.create({
            data: { name: "Beverages", displayOrder: 5, restaurantId: restaurant.id },
        }),
        prisma.menuCategory.create({
            data: { name: "Sides", displayOrder: 6, restaurantId: restaurant.id },
        }),
    ]);
    console.log("✅ Created 6 menu categories");

    // ─── Menu Items ──────────────────────────────────────────
    const menuItemsData = [
        // Appetizers
        { name: "Truffle Bruschetta", description: "Toasted sourdough topped with wild mushroom truffle pâté and microgreens", price: 16.99, costPrice: 5.50, preparationTime: 10, calories: 280, categoryId: categories[0].id, image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400", sku: "APP-001", isFeatured: true },
        { name: "Crispy Calamari", description: "Lightly battered squid rings with lemon aioli and marinara sauce", price: 14.99, costPrice: 4.20, preparationTime: 12, calories: 340, categoryId: categories[0].id, image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400", sku: "APP-002" },
        { name: "Tuna Tartare", description: "Sashimi-grade tuna with avocado, sesame, and ponzu dressing", price: 19.99, costPrice: 8.00, preparationTime: 8, calories: 220, categoryId: categories[0].id, image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400", sku: "APP-003", isFeatured: true },
        { name: "Soup of the Day", description: "Chef's daily creation made with seasonal ingredients", price: 9.99, costPrice: 2.50, preparationTime: 5, calories: 180, categoryId: categories[0].id, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400", sku: "APP-004" },
        // Main Course
        { name: "Wagyu Beef Steak", description: "8oz A5 Wagyu with roasted vegetables and red wine reduction", price: 65.99, offerPrice: 54.99, costPrice: 28.00, preparationTime: 25, calories: 720, categoryId: categories[1].id, image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400", sku: "MAIN-001", isFeatured: true },
        { name: "Grilled Salmon", description: "Atlantic salmon fillet with herb butter, asparagus, and lemon", price: 32.99, costPrice: 12.00, preparationTime: 20, calories: 480, categoryId: categories[1].id, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400", sku: "MAIN-002", isFeatured: true },
        { name: "Herb-Crusted Lamb Rack", description: "New Zealand lamb rack with mint pesto and roasted potatoes", price: 44.99, costPrice: 18.00, preparationTime: 30, calories: 650, categoryId: categories[1].id, image: "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=400", sku: "MAIN-003" },
        { name: "Pan-Seared Duck Breast", description: "Duck breast with cherry compote and sweet potato purée", price: 38.99, costPrice: 14.00, preparationTime: 22, calories: 560, categoryId: categories[1].id, image: "https://images.unsplash.com/photo-1432139509613-5c4255a1d197?w=400", sku: "MAIN-004" },
        { name: "Lobster Thermidor", description: "Whole Maine lobster with brandy cream sauce and gruyère", price: 72.99, costPrice: 32.00, preparationTime: 35, calories: 680, categoryId: categories[1].id, image: "https://images.unsplash.com/photo-1553247407-23251ce81f59?w=400", sku: "MAIN-005", isFeatured: true },
        // Pasta & Risotto
        { name: "Black Truffle Risotto", description: "Arborio rice with black truffle, parmesan, and mascarpone", price: 28.99, costPrice: 9.00, preparationTime: 25, calories: 520, categoryId: categories[2].id, image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400", sku: "PASTA-001", isFeatured: true },
        { name: "Lobster Linguine", description: "Fresh linguine with lobster chunks in a creamy tomato bisque", price: 34.99, costPrice: 14.00, preparationTime: 18, calories: 580, categoryId: categories[2].id, image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400", sku: "PASTA-002" },
        { name: "Wild Mushroom Pappardelle", description: "House-made pappardelle with porcini, chanterelle, and sage butter", price: 24.99, costPrice: 7.50, preparationTime: 15, calories: 460, categoryId: categories[2].id, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400", sku: "PASTA-003" },
        // Desserts
        { name: "Tiramisu", description: "Classic Italian dessert with espresso-soaked ladyfingers and mascarpone", price: 14.99, costPrice: 3.50, preparationTime: 5, calories: 380, categoryId: categories[3].id, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400", sku: "DES-001" },
        { name: "Crème Brûlée", description: "Madagascar vanilla bean custard with caramelized sugar crust", price: 12.99, costPrice: 2.80, preparationTime: 5, calories: 320, categoryId: categories[3].id, image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400", sku: "DES-002", isFeatured: true },
        { name: "Chocolate Lava Cake", description: "Warm dark chocolate cake with molten center and vanilla ice cream", price: 15.99, offerPrice: 12.99, costPrice: 4.00, preparationTime: 15, calories: 520, categoryId: categories[3].id, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400", sku: "DES-003" },
        // Beverages
        { name: "Craft Lemonade", description: "Fresh-squeezed lemon with lavender and honey", price: 7.99, costPrice: 1.50, preparationTime: 3, calories: 120, categoryId: categories[4].id, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400", sku: "BEV-001" },
        { name: "Espresso Martini", description: "Freshly brewed espresso with vodka, Kahlúa, and vanilla", price: 16.99, costPrice: 4.50, preparationTime: 5, calories: 180, categoryId: categories[4].id, image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400", sku: "BEV-002" },
        { name: "Sparkling Water", description: "San Pellegrino sparkling mineral water", price: 4.99, costPrice: 1.00, preparationTime: 1, calories: 0, categoryId: categories[4].id, image: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400", sku: "BEV-003" },
        // Sides
        { name: "Truffle Fries", description: "Hand-cut fries with truffle oil, parmesan, and fresh herbs", price: 11.99, costPrice: 2.50, preparationTime: 10, calories: 380, categoryId: categories[5].id, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400", sku: "SIDE-001" },
        { name: "Caesar Salad", description: "Romaine hearts with house-made Caesar dressing and croutons", price: 13.99, costPrice: 3.00, preparationTime: 8, calories: 260, categoryId: categories[5].id, image: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400", sku: "SIDE-002" },
    ];

    const menuItems = await Promise.all(
        menuItemsData.map((item) =>
            prisma.menuItem.create({
                data: {
                    ...item,
                    restaurantId: restaurant.id,
                    isAvailable: true,
                    isFeatured: item.isFeatured || false,
                },
            })
        )
    );
    console.log(`✅ Created ${menuItems.length} menu items`);

    // ─── Discounts ───────────────────────────────────────────
    const now = new Date();
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.menuItemDiscount.create({
        data: {
            menuItemId: menuItems[0].id, // Truffle Bruschetta
            discountType: "PERCENTAGE",
            discountValue: 15,
            startDate: now,
            endDate: oneMonthFromNow,
            isActive: true,
        },
    });

    await prisma.menuItemDiscount.create({
        data: {
            menuItemId: menuItems[9].id, // Black Truffle Risotto
            discountType: "PERCENTAGE",
            discountValue: 20,
            startDate: now,
            endDate: oneMonthFromNow,
            isActive: true,
        },
    });

    await prisma.menuItemDiscount.create({
        data: {
            menuItemId: menuItems[16].id, // Espresso Martini
            discountType: "FLAT",
            discountValue: 3,
            startDate: now,
            endDate: oneMonthFromNow,
            isActive: true,
        },
    });
    console.log("✅ Created 3 active discounts");

    // ─── Orders ──────────────────────────────────────────────
    const statuses = ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"] as const;
    const names = ["Emma Smith", "Liam Brown", "Olivia Davis", "Noah Garcia", "Ava Martinez", "Ethan Lee", "Sophia Chen", "Mason Kim", "Isabella Park", "Lucas Zhang"];
    const tables = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "D1", "D2"];

    for (let i = 0; i < 25; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const orderDate = new Date();
        orderDate.setDate(orderDate.getDate() - daysAgo);
        orderDate.setHours(Math.floor(Math.random() * 14) + 8);

        const numItems = Math.floor(Math.random() * 4) + 1;
        const selectedItems = [];
        for (let j = 0; j < numItems; j++) {
            const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
            selectedItems.push({
                menuItemId: randomItem.id,
                quantity: Math.floor(Math.random() * 3) + 1,
                price: randomItem.offerPrice || randomItem.price,
            });
        }

        const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        await prisma.order.create({
            data: {
                restaurantId: restaurant.id,
                tableNumber: tables[Math.floor(Math.random() * tables.length)],
                customerName: names[Math.floor(Math.random() * names.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                totalAmount: Math.round(totalAmount * 100) / 100,
                createdAt: orderDate,
                orderItems: {
                    create: selectedItems,
                },
            },
        });
    }
    console.log("✅ Created 25 sample orders");

    // ─── Reservations ────────────────────────────────────────
    const reservationStatuses = ["CONFIRMED", "PENDING", "COMPLETED"] as const;

    for (let i = 0; i < 12; i++) {
        const daysFromNow = Math.floor(Math.random() * 14) - 3; // some past, some future
        const reservationDate = new Date();
        reservationDate.setDate(reservationDate.getDate() + daysFromNow);
        reservationDate.setHours(Math.floor(Math.random() * 5) + 17); // 5pm - 10pm
        reservationDate.setMinutes(Math.random() > 0.5 ? 0 : 30);

        await prisma.reservation.create({
            data: {
                restaurantId: restaurant.id,
                customerName: names[Math.floor(Math.random() * names.length)],
                phone: `+1 (555) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
                email: `guest${i + 1}@email.com`,
                guests: Math.floor(Math.random() * 8) + 1,
                reservationTime: reservationDate,
                tableNumber: tables[Math.floor(Math.random() * tables.length)],
                status: daysFromNow < 0 ? "COMPLETED" : reservationStatuses[Math.floor(Math.random() * 2)],
                notes: Math.random() > 0.6 ? "Birthday celebration" : undefined,
            },
        });
    }
    console.log("✅ Created 12 reservations");

    // ─── Inventory ───────────────────────────────────────────
    const inventoryData = [
        { name: "Olive Oil (Extra Virgin)", quantity: 15, unit: "liters", minimumQuantity: 5, costPerUnit: 12.50 },
        { name: "All-Purpose Flour", quantity: 25, unit: "kg", minimumQuantity: 10, costPerUnit: 2.50 },
        { name: "Fresh Salmon Fillet", quantity: 8, unit: "kg", minimumQuantity: 5, costPerUnit: 22.00 },
        { name: "Wagyu Beef", quantity: 3, unit: "kg", minimumQuantity: 5, costPerUnit: 85.00 },
        { name: "Heavy Cream", quantity: 12, unit: "liters", minimumQuantity: 8, costPerUnit: 4.50 },
        { name: "Parmesan Cheese", quantity: 4, unit: "kg", minimumQuantity: 3, costPerUnit: 28.00 },
        { name: "Black Truffle", quantity: 0.5, unit: "kg", minimumQuantity: 0.3, costPerUnit: 450.00 },
        { name: "Fresh Lobster", quantity: 2, unit: "kg", minimumQuantity: 4, costPerUnit: 48.00 },
        { name: "Arborio Rice", quantity: 10, unit: "kg", minimumQuantity: 5, costPerUnit: 6.00 },
        { name: "Espresso Beans", quantity: 5, unit: "kg", minimumQuantity: 3, costPerUnit: 18.00 },
        { name: "Vanilla Extract", quantity: 2, unit: "liters", minimumQuantity: 1, costPerUnit: 35.00 },
        { name: "Fresh Lemons", quantity: 8, unit: "kg", minimumQuantity: 5, costPerUnit: 3.50 },
        { name: "Mascarpone", quantity: 3, unit: "kg", minimumQuantity: 2, costPerUnit: 12.00 },
        { name: "Duck Breast", quantity: 4, unit: "kg", minimumQuantity: 3, costPerUnit: 32.00 },
        { name: "San Pellegrino Water", quantity: 48, unit: "bottles", minimumQuantity: 24, costPerUnit: 1.50 },
    ];

    for (const item of inventoryData) {
        const invItem = await prisma.inventoryItem.create({
            data: {
                ...item,
                restaurantId: restaurant.id,
            },
        });

        // Add some transaction history
        await prisma.inventoryTransaction.create({
            data: {
                inventoryItemId: invItem.id,
                type: "ADD",
                quantity: item.quantity,
                notes: "Initial stock",
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
        });

        if (Math.random() > 0.5) {
            await prisma.inventoryTransaction.create({
                data: {
                    inventoryItemId: invItem.id,
                    type: "REMOVE",
                    quantity: Math.floor(Math.random() * 3) + 1,
                    notes: "Used in orders",
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                },
            });
        }
    }
    console.log("✅ Created 15 inventory items with transaction history");

    console.log("\n🎉 Seeding complete!");
    console.log("\n📋 Login credentials:");
    console.log("   Admin:   admin@servora.com / password123");
    console.log("   Manager: manager@servora.com / password123");
    console.log("   Staff:   staff@servora.com / password123");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
