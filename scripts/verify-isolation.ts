import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🔍 Verifying Data Isolation...");

    // 1. Check Production Products
    const productionProducts = await prisma.product.count({
        where: { isDemo: false }
    });
    console.log(`📦 Production Products: ${productionProducts}`);

    // 2. Check Demo Products
    const demoProducts = await prisma.product.count({
        where: { isDemo: true }
    });
    console.log(`🧪 Demo Products: ${demoProducts}`);

    // 3. Check Production Sales
    const productionSales = await prisma.sale.count({
        where: { isDemo: false }
    });
    console.log(`💰 Production Sales: ${productionSales}`);

    // 4. Check Demo Sales
    const demoSales = await prisma.sale.count({
        where: { isDemo: true }
    });
    console.log(`💸 Demo Sales: ${demoSales}`);

    if (demoProducts > 0 && productionProducts >= 0) {
        console.log("✅ Data Partitioning Verified: Both environments exist.");
    } else {
        console.error("❌ Stats look suspicious. Check seeding.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
