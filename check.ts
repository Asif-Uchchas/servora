import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.count();
        const items = await prisma.menuItem.count();
        const orders = await prisma.order.count();
        console.log(`✅ Database Check: ${users} users, ${items} menu items, ${orders} orders`);
    } catch (e) {
        console.error("❌ Database Check Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
