
const { PrismaClient } = require('@prisma/client');

async function main() {
    try {
        const prisma = new PrismaClient({
            datasourceUrl: process.env.DATABASE_URL,
        });
        console.log('Successfully initialized Prisma Client.');
        await prisma.$disconnect();
    } catch (e) {
        console.error('Failed to initialize Prisma Client:', e);
        process.exit(1);
    }
}

main();
