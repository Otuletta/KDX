import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Obteniendo usuarios actuales...\n');

    // Get current users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });

    console.log('👥 USUARIOS EXISTENTES:');
    console.log('========================\n');
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.isActive ? '✅' : '❌'}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
    });

    console.log('\n🗑️  Vaciando base de datos (excepto usuarios)...\n');

    // Delete in correct order to respect foreign key constraints
    await prisma.saleItem.deleteMany({});
    console.log('✓ Sale items eliminados');

    await prisma.sale.deleteMany({});
    console.log('✓ Sales eliminadas');

    await prisma.cashRegister.deleteMany({});
    console.log('✓ Cash registers eliminados');

    await prisma.purchaseOrderItem.deleteMany({});
    console.log('✓ Purchase order items eliminados');

    await prisma.purchaseOrder.deleteMany({});
    console.log('✓ Purchase orders eliminadas');

    await prisma.productionBatch.deleteMany({});
    console.log('✓ Production batches eliminados');

    await prisma.productionMacro.deleteMany({});
    console.log('✓ Production macros eliminados');

    await prisma.product.deleteMany({});
    console.log('✓ Products eliminados');

    await prisma.recipeIngredient.deleteMany({});
    console.log('✓ Recipe ingredients eliminados');

    await prisma.recipe.deleteMany({});
    console.log('✓ Recipes eliminadas');

    await prisma.stockMovement.deleteMany({});
    console.log('✓ Stock movements eliminados');

    await prisma.priceHistory.deleteMany({});
    console.log('✓ Price history eliminado');

    await prisma.ingredient.deleteMany({});
    console.log('✓ Ingredients eliminados');

    await prisma.supplier.deleteMany({});
    console.log('✓ Suppliers eliminados');

    await prisma.packaging.deleteMany({});
    console.log('✓ Packaging eliminado');

    console.log('\n✅ Base de datos vaciada exitosamente!');
    console.log(`👥 ${users.length} usuario(s) preservado(s)\n`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
