import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const suppliers = await prisma.supplier.count({ where: { isDemo: true } });
    const ingredients = await prisma.ingredient.count({ where: { isDemo: true } });
    const recipes = await prisma.recipe.count({ where: { isDemo: true } });
    const products = await prisma.product.count({ where: { isDemo: true } });
    const sales = await prisma.sale.count({ where: { isDemo: true } });

    console.log('--- Demo Data Counts ---');
    console.log(`Suppliers: ${suppliers}`);
    console.log(`Ingredients: ${ingredients}`);
    console.log(`Recipes: ${recipes}`);
    console.log(`Products: ${products}`);
    console.log(`Sales: ${sales}`);
}

main().finally(() => prisma.$disconnect());
