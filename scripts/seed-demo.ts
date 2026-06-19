import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting ROBUST DEMO seed...');

    // 1. Clean Demo Database
    console.log('🧹 Cleaning OLD demo data...');
    try {
        const demoWhere = { isDemo: true };
        await prisma.saleItem.deleteMany({ where: { sale: demoWhere } });
        await prisma.sale.deleteMany({ where: demoWhere });
        await prisma.cashRegister.deleteMany({ where: demoWhere });
        await prisma.productionBatch.deleteMany({ where: demoWhere });
        await prisma.productionMacro.deleteMany({ where: demoWhere });
        await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: demoWhere } });
        await prisma.purchaseOrder.deleteMany({ where: demoWhere });
        await prisma.product.deleteMany({ where: demoWhere });
        await prisma.recipeIngredient.deleteMany({ where: { recipe: demoWhere } });
        await prisma.recipe.deleteMany({ where: demoWhere });

        // Clean ingredients and related
        const demoIngredients = await prisma.ingredient.findMany({ where: demoWhere, select: { id: true } });
        const demoIngIds = demoIngredients.map(i => i.id);
        if (demoIngIds.length > 0) {
            await prisma.stockMovement.deleteMany({ where: { ingredientId: { in: demoIngIds } } });
            await prisma.priceHistory.deleteMany({ where: { ingredientId: { in: demoIngIds } } });
        }
        await prisma.ingredient.deleteMany({ where: demoWhere });
        await prisma.supplier.deleteMany({ where: demoWhere });
        await prisma.packaging.deleteMany({ where: demoWhere });

        // Reset User
        await prisma.user.deleteMany({ where: { email: 'demo@salsealo.com' } });

    } catch (error) {
        console.error("Error cleaning demo data:", error);
    }

    // 2. Create User, Tenant and Branch
    console.log('👤 Creating Demo Tenant, Branch & User...');

    let tenant = await prisma.tenant.findFirst({ where: { slug: 'demo' } });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: { name: 'Salsealo Demo', slug: 'demo', isDemo: true }
        });
    }

    let branch = await prisma.branch.findFirst({ where: { tenantId: tenant.id } });
    if (!branch) {
        branch = await prisma.branch.create({
            data: { name: 'Demo Central', tenantId: tenant.id }
        });
    }

    const demoPassword = await bcrypt.hash('Demo123!', 10);
    await prisma.user.create({
        data: {
            name: 'Demo Admin',
            email: 'demo@salsealo.com',
            password: demoPassword,
            role: 'DEMO',
            tenantId: tenant.id,
        },
    });

    // 3. Create Suppliers
    console.log('🚚 Creating Suppliers...');
    const suppliersData = [
        { name: '[DEMO] Avidesa Carnes', email: 'ventas@avidesa.demo', phone: '809-555-0101', category: 'Carnes' },
        { name: '[DEMO] Vegetales del Valle', email: 'pedidos@valle.demo', phone: '809-555-0102', category: 'Verduras' },
        { name: '[DEMO] Distribuidora Corripio', email: 'ventas@corripio.demo', phone: '809-555-0103', category: 'Varios' },
        { name: '[DEMO] Panadería Moderna', email: 'ordenes@panaderia.demo', phone: '809-555-0104', category: 'Panadería' },
        { name: '[DEMO] Empaques Dominicanos', email: 'contacto@empaques.demo', phone: '809-555-0105', category: 'Empaques' },
        { name: '[DEMO] Lácteos Rica', email: 'ventas@rica.demo', phone: '809-555-0106', category: 'Lácteos' },
    ];

    const suppliersMap = new Map();
    for (const s of suppliersData) {
        const { category, ...supplierData } = s; // Extract category
        const created = await prisma.supplier.create({
            data: { ...supplierData, isDemo: true, tenantId: tenant.id }
        });
        suppliersMap.set(category, created.id);
    }

    // 4. Create Ingredients
    console.log('🍅 Creating Ingredients...');
    const ingredientsData = [
        // Carnes
        { name: 'Carne Molida Angus', unit: 'kg', cost: 350.00, supplier: 'Carnes', category: 'Carnes', stock: 50 },
        { name: 'Pechuga de Pollo', unit: 'kg', cost: 210.00, supplier: 'Carnes', category: 'Carnes', stock: 40 },
        { name: 'Tocineta Ahumada', unit: 'kg', cost: 450.00, supplier: 'Carnes', category: 'Carnes', stock: 20 },
        { name: 'Pepperoni', unit: 'kg', cost: 380.00, supplier: 'Carnes', category: 'Embutidos', stock: 15 },

        // Verduras
        { name: 'Tomate Barceló', unit: 'lb', cost: 35.00, supplier: 'Verduras', category: 'Verduras', stock: 100 },
        { name: 'Lechuga Repollada', unit: 'unid', cost: 45.00, supplier: 'Verduras', category: 'Verduras', stock: 50 },
        { name: 'Cebolla Roja', unit: 'lb', cost: 25.00, supplier: 'Verduras', category: 'Verduras', stock: 60 },
        { name: 'Papas 3/8 Congelada', unit: 'lb', cost: 42.00, supplier: 'Varios', category: 'Congelados', stock: 200 },
        { name: 'Albahaca Fresca', unit: 'oz', cost: 15.00, supplier: 'Verduras', category: 'Hierbas', stock: 20 },

        // Lácteos & Varios
        { name: 'Queso Cheddar Lonjas', unit: 'paq', cost: 350.00, supplier: 'Lácteos', category: 'Lácteos', stock: 30 },
        { name: 'Queso Mozzarella Rallado', unit: 'lb', cost: 220.00, supplier: 'Lácteos', category: 'Lácteos', stock: 50 },
        { name: 'Huevo', unit: 'carton', cost: 180.00, supplier: 'Varios', category: 'Huevo', stock: 10 },

        // Panadería & Secos
        { name: 'Pan Brioche Burger', unit: 'unid', cost: 18.00, supplier: 'Panadería', category: 'Panadería', stock: 200 },
        { name: 'Masa Pizza 12"', unit: 'unid', cost: 25.00, supplier: 'Panadería', category: 'Masas', stock: 100 },
        { name: 'Harina Trigo', unit: 'lb', cost: 22.00, supplier: 'Varios', category: 'Secos', stock: 100 },
        { name: 'Pan Rallado', unit: 'lb', cost: 30.00, supplier: 'Panadería', category: 'Secos', stock: 20 },

        // Salsas
        { name: 'Salsa Pizza Pomodoro', unit: 'lt', cost: 120.00, supplier: 'Varios', category: 'Salsas', stock: 30 },
        { name: 'Salsa Ketchup', unit: 'gal', cost: 300.00, supplier: 'Varios', category: 'Salsas', stock: 5 },
        { name: 'Mayonesa', unit: 'gal', cost: 450.00, supplier: 'Varios', category: 'Salsas', stock: 5 },

        // Empaques
        { name: 'Caja Hamburguesa', unit: 'unid', cost: 8.00, supplier: 'Empaques', category: 'Empaques', stock: 500 },
        { name: 'Caja Pizza 12"', unit: 'unid', cost: 15.00, supplier: 'Empaques', category: 'Empaques', stock: 300 },
        { name: 'Servilletas', unit: 'paq', cost: 50.00, supplier: 'Empaques', category: 'Empaques', stock: 50 },
    ];

    const ingMap = new Map();
    for (const i of ingredientsData) {
        const supId = suppliersMap.get(i.supplier) || suppliersMap.get('Varios');
        const created = await prisma.ingredient.create({
            data: {
                name: `[DEMO] ${i.name}`,
                unit: i.unit,
                avgCost: i.cost,
                currentStock: i.stock,
                minStock: 10,
                supplierId: supId,
                category: i.category,
                isDemo: true,
                isActive: true,
                tenantId: tenant.id
            }
        });
        ingMap.set(i.name, created.id);
    }
    const getIngId = (name: string) => ingMap.get(name);

    // 5. Create Recipes
    console.log('👨‍🍳 Creating Recipes...');
    const recipesData = [
        {
            name: '[DEMO] Hamburguesa Clásica',
            yield: 1, unit: 'unid', price: 350.00, category: 'Hamburguesas',
            margin: 55, prepTime: 12,
            ingredients: [
                { name: 'Pan Brioche Burger', qty: 1, unit: 'unid' },
                { name: 'Carne Molida Angus', qty: 0.15, unit: 'kg' }, // 150g
                { name: 'Queso Cheddar Lonjas', qty: 0.05, unit: 'paq' }, // 1 slice approx
                { name: 'Lechuga Repollada', qty: 0.05, unit: 'unid' },
                { name: 'Tomate Barceló', qty: 0.05, unit: 'lb' },
                { name: 'Caja Hamburguesa', qty: 1, unit: 'unid' },
            ]
        },
        {
            name: '[DEMO] Bacon Cheese Burger',
            yield: 1, unit: 'unid', price: 450.00, category: 'Hamburguesas',
            margin: 60, prepTime: 15,
            ingredients: [
                { name: 'Pan Brioche Burger', qty: 1, unit: 'unid' },
                { name: 'Carne Molida Angus', qty: 0.15, unit: 'kg' },
                { name: 'Queso Cheddar Lonjas', qty: 0.1, unit: 'paq' }, // 2 slices
                { name: 'Tocineta Ahumada', qty: 0.05, unit: 'kg' },
                { name: 'Caja Hamburguesa', qty: 1, unit: 'unid' },
            ]
        },
        {
            name: '[DEMO] Pizza Pepperoni',
            yield: 1, unit: 'unid', price: 600.00, category: 'Pizzas',
            margin: 65, prepTime: 20,
            ingredients: [
                { name: 'Masa Pizza 12"', qty: 1, unit: 'unid' },
                { name: 'Salsa Pizza Pomodoro', qty: 0.10, unit: 'lt' },
                { name: 'Queso Mozzarella Rallado', qty: 0.3, unit: 'lb' },
                { name: 'Pepperoni', qty: 0.1, unit: 'kg' },
                { name: 'Caja Pizza 12"', qty: 1, unit: 'unid' },
            ]
        },
        {
            name: '[DEMO] Pizza Margarita',
            yield: 1, unit: 'unid', price: 500.00, category: 'Pizzas',
            margin: 70, prepTime: 18,
            ingredients: [
                { name: 'Masa Pizza 12"', qty: 1, unit: 'unid' },
                { name: 'Salsa Pizza Pomodoro', qty: 0.10, unit: 'lt' },
                { name: 'Queso Mozzarella Rallado', qty: 0.3, unit: 'lb' },
                { name: 'Albahaca Fresca', qty: 0.5, unit: 'oz' },
                { name: 'Caja Pizza 12"', qty: 1, unit: 'unid' },
            ]
        },
        {
            name: '[DEMO] Chicken Fingers (6pz)',
            yield: 1, unit: 'orden', price: 295.00, category: 'Entradas',
            margin: 60, prepTime: 10,
            ingredients: [
                { name: 'Pechuga de Pollo', qty: 0.3, unit: 'kg' },
                { name: 'Harina Trigo', qty: 0.1, unit: 'lb' },
                { name: 'Huevo', qty: 0.1, unit: 'carton' },
                { name: 'Caja Hamburguesa', qty: 1, unit: 'unid' }, // Reusing box
            ]
        }
    ];

    const recipesMap = new Map();
    for (const r of recipesData) {
        // Calculate cost roughly
        let calCost = 0;
        const recipeIngs = [];
        for (const i of r.ingredients) {
            const ingId = getIngId(i.name);
            if (!ingId) continue;
            // find cost from array 
            const sourceIng = ingredientsData.find(d => d.name === i.name);
            if (sourceIng) {
                const cost = sourceIng.cost * i.qty;
                calCost += cost;
            }
            recipeIngs.push({
                ingredientId: ingId,
                quantity: i.qty,
                unit: i.unit
            });
        }

        const created = await prisma.recipe.create({
            data: {
                name: r.name,
                yield: r.yield,
                yieldUnit: r.unit,
                category: r.category,
                targetMargin: r.margin,
                calculatedCost: calCost,
                suggestedPrice: r.price,
                prepTime: r.prepTime,
                isDemo: true,
                isActive: true,
                tenantId: tenant.id,
                ingredients: {
                    create: recipeIngs
                }
            }
        });
        recipesMap.set(r.name, created);
    }

    // 6. Create Products (linked to recipes + Standalone)
    console.log('📦 Creating Products...');
    const productsData = [
        // Linked to recipes
        { name: '[DEMO] Classic Burger', desc: 'Nuestra hamburguesa insignia.', price: 350, cat: 'Hamburguesas', recipe: '[DEMO] Hamburguesa Clásica' },
        { name: '[DEMO] Bacon Cheeseburger', desc: 'Con extra tocino crujiente.', price: 450, cat: 'Hamburguesas', recipe: '[DEMO] Bacon Cheese Burger' },
        { name: '[DEMO] Pizza Pepperoni', desc: 'La favorita de todos.', price: 600, cat: 'Pizzas', recipe: '[DEMO] Pizza Pepperoni' },
        { name: '[DEMO] Pizza Margarita', desc: 'Fresca y ligera.', price: 500, cat: 'Pizzas', recipe: '[DEMO] Pizza Margarita' },
        { name: '[DEMO] Chicken Fingers', desc: '6 piezas con salsa.', price: 295, cat: 'Entradas', recipe: '[DEMO] Chicken Fingers (6pz)' },

        // Standalone
        { name: '[DEMO] Papas Fritas', desc: 'Papas fritas corte 3/8.', price: 150, cat: 'Acompañantes', recipe: null },
        { name: '[DEMO] Coca Cola', desc: 'Lata 330ml.', price: 80, cat: 'Bebidas', recipe: null },
        { name: '[DEMO] Agua Dasani', desc: 'Botella 500ml.', price: 50, cat: 'Bebidas', recipe: null },
        { name: '[DEMO] Brownie con Helado', desc: 'Postre de la casa.', price: 250, cat: 'Postres', recipe: null },
        { name: '[DEMO] Cerveza Presidente', desc: 'Botella Pequeña.', price: 180, cat: 'Bebidas', recipe: null },
    ];

    const productsMap = [];
    for (const p of productsData) {
        let recipeId = null;
        if (p.recipe) {
            recipeId = recipesMap.get(p.recipe)?.id;
        }

        const created = await prisma.product.create({
            data: {
                name: p.name,
                description: p.desc,
                price: p.price,
                currentStock: Math.floor(Math.random() * 50) + 10,
                minStock: 10,
                category: p.cat,
                recipeId: recipeId,
                isDemo: true,
                isActive: true,
                tenantId: tenant.id
            }
        });
        productsMap.push(created);
    }

    // 7. Generate Rich Sales History (60 Days)
    console.log('💰 Generating Sales History (60 days)...');

    // Simulate a trend: more sales on weekends, growing trend
    const totalDays = 60;
    const paymentMethods = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

    for (let i = 0; i < totalDays; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (totalDays - i)); // Go from past to present

        // Weekend multiplier
        const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
        let dailyOrders = Math.floor(Math.random() * 5) + 3; // Base 3-8 orders
        if (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5) {
            dailyOrders += Math.floor(Math.random() * 5) + 5; // Add 5-10 orders on weekends
        }

        // Create orders for this day
        for (let j = 0; j < dailyOrders; j++) {
            // Random time between 11:00 and 23:00
            const orderDate = new Date(date);
            orderDate.setHours(11 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60));

            const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items
            const saleItems = [];
            let subtotal = 0;

            for (let k = 0; k < numItems; k++) {
                const prod = productsMap[Math.floor(Math.random() * productsMap.length)];
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
                    createdAt: orderDate,
                    subtotal: subtotal,
                    total: subtotal,
                    discount: 0,
                    paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                    status: 'COMPLETED',
                    isDemo: true,
                    tenantId: tenant.id,
                    branchId: branch.id,
                    items: {
                        create: saleItems
                    }
                }
            });
        }

        if (i % 10 === 0) process.stdout.write('.'); // progress
    }
    console.log('\n✅ Data Generated Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
