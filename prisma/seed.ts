
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
    await prisma.expense.deleteMany();
    await prisma.user.deleteMany();
    await prisma.userBranch.deleteMany();
    await prisma.branch.deleteMany();
    await prisma.tenant.deleteMany();

    // 2. Create Demo Tenant
    console.log('🏢 Creating Demo Restaurant tenant...');
    const tenant = await prisma.tenant.create({
        data: { name: 'Restaurante Demo', slug: 'demo', isDemo: true }
    });
    const branch1 = await prisma.branch.create({
        data: { name: 'Sucursal Norte', tenantId: tenant.id }
    });
    const branch2 = await prisma.branch.create({
        data: { name: 'Sucursal Sur', tenantId: tenant.id }
    });

    const branchesList = [branch1, branch2];

    // 3. Create Users
    console.log('👤 Creating users...');
    const adminPassword = await bcrypt.hash('Otulett@052911', 10);
    const demoPassword = await bcrypt.hash('Demo1234!', 10);

    const admin = await prisma.user.create({
        data: {
            name: 'Otuletta',
            email: 'otuletta@kdx.com',
            password: adminPassword,
            role: 'ADMIN',
            isSuperAdmin: true,
            tenantId: tenant.id
        },
    });

    const demoUser = await prisma.user.create({
        data: {
            name: 'Usuario Demo',
            email: 'demo@kdxcore.com',
            password: demoPassword,
            role: 'STAFF',
            isSuperAdmin: false,
            tenantId: tenant.id
        },
    });

    // Assign users to branches
    await prisma.userBranch.createMany({
        data: [
            { userId: admin.id, branchId: branch1.id },
            { userId: admin.id, branchId: branch2.id },
            { userId: demoUser.id, branchId: branch1.id },
        ]
    });

    console.log('✅ Users created (admin + demo)');

    // 4. Create Suppliers
    console.log('🚚 Creating suppliers...');
    const suppliers = await Promise.all([
        prisma.supplier.create({
            data: { name: 'Importadora Italiana', email: 'contacto@importitalia.com', phone: '555-0101', notes: 'Harinas y tomates importados', tenantId: tenant.id }
        }),
        prisma.supplier.create({
            data: { name: 'Carnes Premium', email: 'ventas@carnespremium.com', phone: '555-0102', notes: 'Carne de res y cerdo de alta calidad', tenantId: tenant.id }
        }),
        prisma.supplier.create({
            data: { name: 'Lácteos del Sur', email: 'pedidos@lacteossur.com', phone: '555-0103', notes: 'Quesos frescos', tenantId: tenant.id }
        }),
        prisma.supplier.create({
            data: { name: 'La Huerta Fresca', email: 'info@lahuerta.com', phone: '555-0104', notes: 'Verduras semanales', tenantId: tenant.id }
        }),
        prisma.supplier.create({
            data: { name: 'EcoPack', email: 'ventas@ecopack.com', phone: '555-0105', notes: 'Envases biodegradables', tenantId: tenant.id }
        }),
    ]);

    const [supItalia, supCarnes, supLacteos, supHuerta, supPack] = suppliers;

    // 5. Create Ingredients
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
                currentStock: Math.floor(Math.random() * 50) + 10,
                tenantId: tenant.id
            }
        });
        ingredients.push(created);
    }

    // Packaging
    const packagingData = [
        { name: 'Bandeja Aluminio Lasagna', unitCost: 0.30, currentStock: 200 },
        { name: 'Caja Ravioles', unitCost: 0.25, currentStock: 150 },
        { name: 'Frasco Vidrio 500ml', unitCost: 0.60, currentStock: 100 },
        { name: 'Etiqueta KDX', unitCost: 0.05, currentStock: 500 },
    ];

    for (const pack of packagingData) {
        await prisma.packaging.create({ data: { ...pack, tenantId: tenant.id } });
    }

    const packLasagna = await prisma.ingredient.create({ data: { name: 'Bandeja Aluminio', unit: 'und', avgCost: 0.30, category: 'Empaque', currentStock: 200, supplierId: supPack.id, tenantId: tenant.id } });
    const packJar = await prisma.ingredient.create({ data: { name: 'Frasco Vidrio', unit: 'und', avgCost: 0.60, category: 'Empaque', currentStock: 100, supplierId: supPack.id, tenantId: tenant.id } });

    const getIng = (name: string) => ingredients.find(i => i.name === name) || ingredients[0];

    const createRecipeWithCost = async (data: any, ingredientsList: { ingredientId: string, quantity: number, unit: string }[]) => {
        let totalCost = 0;
        for (const item of ingredientsList) {
            const ing = await prisma.ingredient.findUnique({ where: { id: item.ingredientId } });
            if (ing) totalCost += Number(ing.avgCost) * item.quantity;
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
                tenantId: tenant.id,
                ingredients: { create: ingredientsList }
            }
        });
    };

    // 6. Create Recipes
    console.log('👨‍🍳 Creating recipes...');
    const doughRecipe = await createRecipeWithCost({
        name: 'Masa Pasta Fresca', yield: 1, yieldUnit: 'kg',
        category: 'Base', targetMargin: 40
    }, [
        { ingredientId: getIng('Harina 00').id, quantity: 0.6, unit: 'kg' },
        { ingredientId: getIng('Sémola').id, quantity: 0.2, unit: 'kg' },
        { ingredientId: getIng('Huevos').id, quantity: 8, unit: 'und' },
        { ingredientId: getIng('Aceite de Oliva').id, quantity: 0.02, unit: 'lt' },
    ]);

    const bologneseRecipe = await createRecipeWithCost({
        name: 'Salsa Boloñesa', yield: 2, yieldUnit: 'kg',
        category: 'Salsa', targetMargin: 40
    }, [
        { ingredientId: getIng('Carne Molida Res').id, quantity: 0.8, unit: 'kg' },
        { ingredientId: getIng('Carne Molida Cerdo').id, quantity: 0.4, unit: 'kg' },
        { ingredientId: getIng('Tomates Pelados').id, quantity: 2, unit: 'latas' },
        { ingredientId: getIng('Cebolla').id, quantity: 0.3, unit: 'kg' },
        { ingredientId: getIng('Ajo').id, quantity: 0.05, unit: 'kg' },
        { ingredientId: getIng('Aceite de Oliva').id, quantity: 0.05, unit: 'lt' },
    ]);

    const bechamelRecipe = await createRecipeWithCost({
        name: 'Salsa Bechamel', yield: 1, yieldUnit: 'kg',
        category: 'Salsa', targetMargin: 40
    }, [
        { ingredientId: getIng('Harina 00').id, quantity: 0.1, unit: 'kg' },
        { ingredientId: getIng('Sal').id, quantity: 0.01, unit: 'kg' },
        { ingredientId: getIng('Pimienta Negra').id, quantity: 0.005, unit: 'kg' },
    ]);

    const lasagnaRecipe = await createRecipeWithCost({
        name: 'Lasagna Boloñesa Tradicional', yield: 6, yieldUnit: 'porciones',
        category: 'Plato Principal', targetMargin: 45
    }, [
        { ingredientId: getIng('Harina 00').id, quantity: 0.5, unit: 'kg' },
        { ingredientId: getIng('Carne Molida Res').id, quantity: 0.6, unit: 'kg' },
        { ingredientId: getIng('Tomates Pelados').id, quantity: 1, unit: 'latas' },
        { ingredientId: getIng('Queso Mozzarella').id, quantity: 0.4, unit: 'kg' },
        { ingredientId: getIng('Queso Parmesano').id, quantity: 0.1, unit: 'kg' },
        { ingredientId: packLasagna.id, quantity: 6, unit: 'und' },
    ]);

    // 7. Create Products
    console.log('📦 Creating products...');
    const products = await Promise.all([
        prisma.product.create({
            data: { name: 'Lasagna Boloñesa (Porción)', description: 'Deliciosa lasagna con salsa boloñesa y bechamel casera', price: 8.50, currentStock: 12, minStock: 5, category: 'Pastas', recipeId: lasagnaRecipe.id, tenantId: tenant.id }
        }),
        prisma.product.create({
            data: { name: 'Lasagna Boloñesa (Familiar)', description: 'Bandeja familiar para 4-6 personas', price: 35.00, currentStock: 4, minStock: 2, category: 'Pastas', recipeId: lasagnaRecipe.id, tenantId: tenant.id }
        }),
        prisma.product.create({
            data: { name: 'Ravioles de Ricotta (Docena)', description: 'Ravioles rellenos de ricotta y espinaca', price: 12.00, currentStock: 20, minStock: 10, category: 'Pastas', tenantId: tenant.id }
        }),
        prisma.product.create({
            data: { name: 'Salsa Boloñesa (Frasco)', description: 'Nuestra salsa secreta en frasco de 500ml', price: 9.00, currentStock: 30, minStock: 15, category: 'Salsas', recipeId: bologneseRecipe.id, tenantId: tenant.id }
        }),
        prisma.product.create({
            data: { name: 'Fettuccine Fresco (500g)', description: 'Pasta fresca al huevo', price: 6.00, currentStock: 15, minStock: 5, category: 'Pastas', recipeId: doughRecipe.id, tenantId: tenant.id }
        }),
        prisma.product.create({
            data: { name: 'Tiramisú Artesanal', description: 'Postre italiano clásico', price: 7.50, currentStock: 8, minStock: 3, category: 'Postres', tenantId: tenant.id }
        }),
        prisma.product.create({
            data: { name: 'Cannoli Siciliano (3 und)', description: 'Cannoli rellenos de ricotta dulce', price: 6.50, currentStock: 10, minStock: 4, category: 'Postres', tenantId: tenant.id }
        }),
    ]);

    // 8. Create 60+ Days of Sales History
    console.log('💰 Creating 60-day sales history...');
    const paymentMethods = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];
    const now = new Date();
    const customerNames = [null, 'María García', 'Juan Pérez', 'Ana López', 'Carlos Rodríguez', 'Sofía Martínez', null, null, 'Pedro Sánchez', null];

    for (let i = 0; i < 120; i++) {
        const daysAgo = Math.floor(Math.random() * 60);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        date.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);

        const numItems = Math.floor(Math.random() * 4) + 1;
        const saleItems = [];
        let subtotal = 0;

        for (let j = 0; j < numItems; j++) {
            const prod = products[Math.floor(Math.random() * products.length)];
            const qty = Math.floor(Math.random() * 3) + 1;
            const totalItem = Number(prod.price) * qty;
            saleItems.push({
                productId: prod.id,
                quantity: qty,
                unitPrice: prod.price,
                subtotal: totalItem
            });
            subtotal += totalItem;
        }

        const discount = Math.random() > 0.9 ? Math.floor(Math.random() * 5) + 1 : 0;

        await prisma.sale.create({
            data: {
                createdAt: date,
                subtotal: subtotal,
                total: subtotal - discount,
                discount: discount,
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                status: 'COMPLETED',
                customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
                tenantId: tenant.id,
                branchId: branchesList[Math.floor(Math.random() * branchesList.length)].id,
                items: { create: saleItems }
            }
        });
    }

    // 9. Create Purchase Orders
    console.log('🛒 Creating purchase history...');
    const poStatuses = ['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'];

    for (let i = 0; i < 30; i++) {
        const daysAgo = Math.floor(Math.random() * 60);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);

        const status = poStatuses[Math.floor(Math.random() * poStatuses.length)];
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const branch = branchesList[Math.floor(Math.random() * branchesList.length)];

        const numItems = Math.floor(Math.random() * 5) + 2;
        const poItems = [];
        let totalAmount = 0;

        for (let j = 0; j < numItems; j++) {
            const ing = ingredients[Math.floor(Math.random() * ingredients.length)];
            const qty = Math.floor(Math.random() * 20) + 5;
            const cost = Number(ing.avgCost) * qty;
            poItems.push({
                ingredientId: ing.id,
                quantity: qty,
                estimatedCost: ing.avgCost,
                actualCost: status === 'RECEIVED' ? ing.avgCost : null,
                received: status === 'RECEIVED'
            });
            totalAmount += cost;
        }

        await prisma.purchaseOrder.create({
            data: {
                tenantId: tenant.id,
                branchId: branch.id,
                supplierId: supplier.id,
                status: status,
                totalAmount: totalAmount,
                notes: `Orden de compra para ${supplier.name}`,
                sentAt: status !== 'DRAFT' ? date : null,
                receivedAt: status === 'RECEIVED' ? new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000) : null,
                createdAt: date,
                items: { create: poItems }
            }
        });
    }

    // 10. Create Expenses (Fixed Costs)
    console.log('💸 Creating expense history...');
    const expenseCategories = [
        { category: 'RENT', description: 'Alquiler local principal', amount: 2500 },
        { category: 'PAYROLL', description: 'Nómina quincenal', amount: 4200 },
        { category: 'UTILITIES', description: 'Electricidad', amount: 380 },
        { category: 'UTILITIES', description: 'Agua', amount: 120 },
        { category: 'UTILITIES', description: 'Internet', amount: 85 },
        { category: 'SUPPLIES', description: 'Productos de limpieza', amount: 150 },
        { category: 'MARKETING', description: 'Publicidad redes sociales', amount: 200 },
        { category: 'OTHER', description: 'Mantenimiento equipos', amount: 350 },
    ];

    for (let month = 0; month < 2; month++) {
        for (const exp of expenseCategories) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - month);
            date.setDate(Math.floor(Math.random() * 28) + 1);

            await prisma.expense.create({
                data: {
                    tenantId: tenant.id,
                    category: exp.category,
                    description: exp.description,
                    amount: exp.amount + (Math.random() * 50 - 25), // slight variation
                    date: date,
                    recurring: ['RENT', 'PAYROLL', 'UTILITIES'].includes(exp.category),
                }
            });
        }
    }

    // 11. Create Production Batches
    console.log('🍳 Creating production batches...');
    const recipes = [doughRecipe, bologneseRecipe, bechamelRecipe, lasagnaRecipe];
    for (let i = 0; i < 15; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        const recipe = recipes[Math.floor(Math.random() * recipes.length)];

        await prisma.productionBatch.create({
            data: {
                tenantId: tenant.id,
                branchId: branchesList[Math.floor(Math.random() * branchesList.length)].id,
                recipeId: recipe.id,
                quantity: Math.floor(Math.random() * 5) + 1,
                status: 'COMPLETED',
                producedAt: date,
                createdAt: date,
            }
        });
    }

    // 12. Create Production Macros
    console.log('⚡ Creating production macros...');
    await Promise.all([
        prisma.productionMacro.create({ data: { tenantId: tenant.id, name: 'Lote 12 Lasañas', recipeId: lasagnaRecipe.id, quantity: 12, icon: '🍝', color: '#EF4444', sortOrder: 1 } }),
        prisma.productionMacro.create({ data: { tenantId: tenant.id, name: 'Batch Masa AM', recipeId: doughRecipe.id, quantity: 5, icon: '🫓', color: '#F59E0B', sortOrder: 2 } }),
        prisma.productionMacro.create({ data: { tenantId: tenant.id, name: 'Salsa Semanal', recipeId: bologneseRecipe.id, quantity: 10, icon: '🍅', color: '#10B981', sortOrder: 3 } }),
    ]);

    console.log('🏁 Seed completed successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log('   Admin: otuletta@kdx.com / Otulett@052911');
    console.log('   Demo:  demo@kdxcore.com / Demo1234!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
