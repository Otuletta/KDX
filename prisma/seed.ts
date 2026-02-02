
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Clean Database
    console.log('🧹 Cleaning database...');
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.cashRegister.deleteMany();
    await prisma.productionBatch.deleteMany();
    await prisma.productionMacro.deleteMany();
    await prisma.purchaseOrderItem.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.product.deleteMany();
    await prisma.recipeIngredient.deleteMany();
    await prisma.recipe.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.priceHistory.deleteMany();
    await prisma.ingredient.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.packaging.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create Users
    console.log('👤 Creating users...');

    const adminPassword = await bcrypt.hash('Otulett@052911', 10);
    const ownerPassword = await bcrypt.hash('Salsealo2026@', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Otuletta',
            email: 'otuletta@salsealo.com',
            password: adminPassword,
            role: 'ADMIN',
        },
    });

    const owner1 = await prisma.user.create({
        data: {
            name: 'Mtuletta',
            email: 'mtuletta@salsealo.com',
            password: ownerPassword,
            role: 'OWNER',
        },
    });

    const owner2 = await prisma.user.create({
        data: {
            name: 'Nathaly',
            email: 'nathaly@salsealo.com',
            password: ownerPassword,
            role: 'OWNER',
        },
    });

    console.log('✅ Users created');

    // 3. Create Suppliers
    console.log('🚚 Creating suppliers...');

    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: { name: 'Importadora Italiana', email: 'contacto@importitalia.com', phone: '555-0101', notes: 'Harinas y tomates importados' }
        }),
        prisma.supplier.create({
            data: { name: 'Carnes Premium', email: 'ventas@carnespremium.com', phone: '555-0102', notes: 'Carne de res y cerdo de alta calidad' }
        }),
        prisma.supplier.create({
            data: { name: 'Lácteos del Sur', email: 'pedidos@lacteossur.com', phone: '555-0103', notes: 'Quesos frescos' }
        }),
        prisma.supplier.create({
            data: { name: 'La Huerta Fresca', email: 'info@lahuerta.com', phone: '555-0104', notes: 'Verduras semanales' }
        }),
        prisma.supplier.create({
            data: { name: 'EcoPack', email: 'ventas@ecopack.com', phone: '555-0105', notes: 'Envases biodegradables' }
        }),
    ]);

    const [supItalia, supCarnes, supLacteos, supHuerta, supPack] = suppliers;

    // 4. Create Ingredients
    console.log('🍅 Creating ingredients...');

    const ingredientsData = [
        { name: 'Harina 00', unit: 'kg', avgCost: 1.50, supplierId: supItalia.id, category: 'Secos' },
        { name: 'Sémola', unit: 'kg', avgCost: 1.80, supplierId: supItalia.id, category: 'Secos' },
        { name: 'Huevos', unit: 'und', avgCost: 0.15, supplierId: supHuerta.id, category: 'Frescos' },
        { name: 'Carne Molida Res', unit: 'kg', avgCost: 8.50, supplierId: supCarnes.id, category: 'Proteína' },
        { name: 'Carne Molida Cerdo', unit: 'kg', avgCost: 6.00, supplierId: supCarnes.id, category: 'Proteína' },
        { name: 'Tomates Pelados', unit: 'latas', avgCost: 2.50, supplierId: supItalia.id, category: 'Conservas' },
        { name: 'Cebolla', unit: 'kg', avgCost: 0.80, supplierId: supHuerta.id, category: 'Frescos' },
        { name: 'Ajo', unit: 'kg', avgCost: 3.00, supplierId: supHuerta.id, category: 'Frescos' },
        { name: 'Albahaca Fresca', unit: 'kg', avgCost: 12.00, supplierId: supHuerta.id, category: 'Frescos' },
        { name: 'Queso Mozzarella', unit: 'kg', avgCost: 9.00, supplierId: supLacteos.id, category: 'Lácteos' },
        { name: 'Queso Ricotta', unit: 'kg', avgCost: 7.50, supplierId: supLacteos.id, category: 'Lácteos' },
        { name: 'Queso Parmesano', unit: 'kg', avgCost: 18.00, supplierId: supLacteos.id, category: 'Lácteos' },
        { name: 'Aceite de Oliva', unit: 'lt', avgCost: 15.00, supplierId: supItalia.id, category: 'Aceites' },
        { name: 'Sal', unit: 'kg', avgCost: 0.50, supplierId: supItalia.id, category: 'Especias' },
        { name: 'Pimienta Negra', unit: 'kg', avgCost: 12.00, supplierId: supItalia.id, category: 'Especias' },
    ];

    const ingredients: any[] = [];
    for (const ing of ingredientsData) {
        const created = await prisma.ingredient.create({
            data: {
                ...ing,
                currentStock: Math.floor(Math.random() * 50) + 10, // Initial stock
            }
        });
        ingredients.push(created);
    }

    // Create Packaging
    const packagingData = [
        { name: 'Bandeja Aluminio Lasagna', unitCost: 0.30, currentStock: 200 },
        { name: 'Caja Ravioles', unitCost: 0.25, currentStock: 150 },
        { name: 'Frasco Vidrio 500ml', unitCost: 0.60, currentStock: 100 },
        { name: 'Etiqueta Salséalo', unitCost: 0.05, currentStock: 500 },
    ];

    for (const pack of packagingData) {
        await prisma.packaging.create({ data: pack });
    }
    // Also add packaging as ingredients for recipe calculation
    const packLasagna = await prisma.ingredient.create({ data: { name: 'Bandeja Aluminio', unit: 'und', avgCost: 0.30, category: 'Empaque', currentStock: 200, supplierId: supPack.id } });
    const packJar = await prisma.ingredient.create({ data: { name: 'Frasco Vidrio', unit: 'und', avgCost: 0.60, category: 'Empaque', currentStock: 100, supplierId: supPack.id } });

    // Helpers to find ingredients
    const getIng = (name: string) => ingredients.find(i => i.name === name) || ingredients[0];

    // Helper to calculate recipe numbers
    const createRecipeWithCost = async (data: any, ingredientsList: { ingredientId: string, quantity: number, unit: string }[]) => {
        let totalCost = 0;

        // Calculate raw cost
        for (const item of ingredientsList) {
            const ing = await prisma.ingredient.findUnique({ where: { id: item.ingredientId } });
            if (ing) {
                totalCost += Number(ing.avgCost) * item.quantity;
            }
        }

        const yieldAmount = Number(data.yield) || 1;
        const costPerUnit = totalCost / yieldAmount;
        const margin = data.targetMargin || 40;
        const suggestedPrice = costPerUnit / (1 - (margin / 100));

        return prisma.recipe.create({
            data: {
                ...data,
                calculatedCost: costPerUnit,
                suggestedPrice: suggestedPrice,
                ingredients: {
                    create: ingredientsList
                }
            }
        });
    };

    // 5. Create Recipes
    console.log('👨‍🍳 Creating recipes...');

    // Sub-recipes
    const doughRecipe = await createRecipeWithCost({
        name: 'Masa Pasta Fresca',
        yield: 1, yieldUnit: 'kg',
        category: 'Base',
        targetMargin: 40
    }, [
        { ingredientId: getIng('Harina 00').id, quantity: 0.6, unit: 'kg' },
        { ingredientId: getIng('Sémola').id, quantity: 0.2, unit: 'kg' },
        { ingredientId: getIng('Huevos').id, quantity: 8, unit: 'und' },
        { ingredientId: getIng('Aceite de Oliva').id, quantity: 0.02, unit: 'lt' },
    ]);

    const bologneseRecipe = await createRecipeWithCost({
        name: 'Salsa Boloñesa',
        yield: 2, yieldUnit: 'kg',
        category: 'Salsa',
        targetMargin: 40
    }, [
        { ingredientId: getIng('Carne Molida Res').id, quantity: 0.8, unit: 'kg' },
        { ingredientId: getIng('Carne Molida Cerdo').id, quantity: 0.4, unit: 'kg' },
        { ingredientId: getIng('Tomates Pelados').id, quantity: 2, unit: 'latas' },
        { ingredientId: getIng('Cebolla').id, quantity: 0.3, unit: 'kg' },
        { ingredientId: getIng('Ajo').id, quantity: 0.05, unit: 'kg' },
        { ingredientId: getIng('Aceite de Oliva').id, quantity: 0.05, unit: 'lt' },
    ]);

    const bechamelRecipe = await createRecipeWithCost({
        name: 'Salsa Bechamel',
        yield: 1, yieldUnit: 'kg',
        category: 'Salsa',
        targetMargin: 40
    }, [
        { ingredientId: getIng('Harina 00').id, quantity: 0.1, unit: 'kg' },
        // Assuming we use milk/butter but keeping it simple with existing ingredients or assume external cost
        { ingredientId: getIng('Sal').id, quantity: 0.01, unit: 'kg' },
        { ingredientId: getIng('Pimienta Negra').id, quantity: 0.005, unit: 'kg' },
    ]);

    // Final Recipes (Complex logic would require sub-recipes as ingredients, but schema links RecipeIngredient to Ingredient.
    // For now we map the 'result' of a sub-recipe as an 'ingredient' if we want to track it strictly,
    // or just flatten for now. Let's create 'Product Ingredients' that represent the sub-recipes output for simplicity in this schema version
    // or just use raw ingredients for the final product to keep it simple.)

    // Actually, to make 'Lasagna' recipe, we usually consume 'Masa', 'Boloñesa', 'Bechamel'.
    // We'll add these as "Ingredients" with type "Producción" if we strictly follow a nested model,
    // but let's just create the Lasagna Recipe directly with raw components + aggregation for the seed.

    const lasagnaRecipe = await createRecipeWithCost({
        name: 'Lasagna Boloñesa Tradicional',
        yield: 6, yieldUnit: 'porciones',
        category: 'Plato Principal',
        targetMargin: 45
    }, [
        { ingredientId: getIng('Harina 00').id, quantity: 0.5, unit: 'kg' }, // Representing dough
        { ingredientId: getIng('Carne Molida Res').id, quantity: 0.6, unit: 'kg' }, // Meat
        { ingredientId: getIng('Tomates Pelados').id, quantity: 1, unit: 'latas' }, // Sauce
        { ingredientId: getIng('Queso Mozzarella').id, quantity: 0.4, unit: 'kg' },
        { ingredientId: getIng('Queso Parmesano').id, quantity: 0.1, unit: 'kg' },
        { ingredientId: packLasagna.id, quantity: 6, unit: 'und' }, // 6 trays
    ]);

    // 6. Create Products
    console.log('📦 Creating products...');

    const products = await Promise.all([
        prisma.product.create({
            data: {
                name: 'Lasagna Boloñesa (Porción)',
                description: 'Deliciosa lasagna con salsa boloñesa y bechamel casera',
                price: 8.50,
                currentStock: 12,
                minStock: 5,
                category: 'Pastas',
                recipeId: lasagnaRecipe.id,
            }
        }),
        prisma.product.create({
            data: {
                name: 'Lasagna Boloñesa (Familiar)',
                description: 'Bandeja familiar para 4-6 personas',
                price: 35.00,
                currentStock: 4,
                minStock: 2,
                category: 'Pastas',
                recipeId: lasagnaRecipe.id,
            }
        }),
        prisma.product.create({
            data: {
                name: 'Ravioles de Ricotta (Docena)',
                description: 'Ravioles rellenos de ricotta y espinaca',
                price: 12.00,
                currentStock: 20,
                minStock: 10,
                category: 'Pastas',
            }
        }),
        prisma.product.create({
            data: {
                name: 'Salsa Boloñesa (Frasco)',
                description: 'Nuestra salsa secreta en frasco de 500ml',
                price: 9.00,
                currentStock: 30,
                minStock: 15,
                category: 'Salsas',
                recipeId: bologneseRecipe.id,
            }
        }),
        prisma.product.create({
            data: {
                name: 'Fettuccine Fresco (500g)',
                description: 'Pasta fresca al huevo',
                price: 6.00,
                currentStock: 15,
                minStock: 5,
                category: 'Pastas',
                recipeId: doughRecipe.id,
            }
        })
    ]);

    // 7. Create Sales History
    console.log('💰 Creating sales history...');

    const paymentMethods = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];
    const now = new Date();

    // Create sales for the last 30 days
    for (let i = 0; i < 50; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);

        // Randomize items
        const numItems = Math.floor(Math.random() * 3) + 1;
        const saleItems = [];
        let subtotal = 0;

        for (let j = 0; j < numItems; j++) {
            const prod = products[Math.floor(Math.random() * products.length)];
            const qty = Math.floor(Math.random() * 2) + 1;
            const totalItem = Number(prod.price) * qty;

            saleItems.push({
                productId: prod.id,
                quantity: qty,
                unitPrice: prod.price,
                subtotal: totalItem
            });
            subtotal += totalItem;
        }

        await prisma.sale.create({
            data: {
                createdAt: date,
                subtotal: subtotal,
                total: subtotal,
                discount: 0,
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                status: 'COMPLETED',
                items: {
                    create: saleItems
                }
            }
        });
    }

    console.log('🏁 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
