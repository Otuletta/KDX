import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning production database (keeping users only)...\n');

    try {
        // Delete in correct order to respect foreign key constraints
        console.log('📦 Deleting sale items...');
        await prisma.saleItem.deleteMany();

        console.log('💰 Deleting sales...');
        await prisma.sale.deleteMany();

        console.log('🏦 Deleting cash registers...');
        await prisma.cashRegister.deleteMany();

        console.log('🏭 Deleting production batches...');
        await prisma.productionBatch.deleteMany();

        console.log('📊 Deleting production macros...');
        await prisma.productionMacro.deleteMany();

        console.log('📋 Deleting purchase order items...');
        await prisma.purchaseOrderItem.deleteMany();

        console.log('📝 Deleting purchase orders...');
        await prisma.purchaseOrder.deleteMany();

        console.log('🍕 Deleting products...');
        await prisma.product.deleteMany();

        console.log('🧪 Deleting recipe ingredients...');
        await prisma.recipeIngredient.deleteMany();

        console.log('👨‍🍳 Deleting recipes...');
        await prisma.recipe.deleteMany();

        console.log('📦 Deleting stock movements...');
        await prisma.stockMovement.deleteMany();

        console.log('💵 Deleting price history...');
        await prisma.priceHistory.deleteMany();

        console.log('🥬 Deleting ingredients...');
        await prisma.ingredient.deleteMany();

        console.log('🚚 Deleting suppliers...');
        await prisma.supplier.deleteMany();

        console.log('📦 Deleting packaging...');
        await prisma.packaging.deleteMany();

        console.log('\n✅ Database cleaned successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Show remaining users
        const users = await prisma.user.findMany({
            select: {
                name: true,
                email: true,
                role: true,
            }
        });

        console.log('\n👥 Remaining users:');
        users.forEach(user => {
            console.log(`   • ${user.name} (${user.email}) - ${user.role}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('🎉 Production database is now clean and ready!');

    } catch (error) {
        console.error('❌ Error cleaning database:', error);
        throw error;
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
