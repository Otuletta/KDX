import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Creating DailySalesSummary View...");
    
    // Drop the view if it exists
    await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS "DailySalesSummary";`);

    // Create the view
    await prisma.$executeRawUnsafe(`
        CREATE VIEW "DailySalesSummary" AS
        SELECT 
            "tenantId",
            "branchId",
            DATE_TRUNC('day', "createdAt")::date AS "date",
            SUM("total") AS "totalSales",
            SUM("discount") AS "totalDiscount",
            COUNT("id")::int AS "orderCount"
        FROM "sales"
        WHERE "status" = 'COMPLETED'
        GROUP BY "tenantId", "branchId", DATE_TRUNC('day', "createdAt")::date;
    `);

    console.log("View created successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
