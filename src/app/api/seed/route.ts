import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as bcrypt from 'bcryptjs';

export async function GET() {
    try {
        console.log('🌱 Starting REMOTE DEMO seed...');

        // 1. Clean Demo Database
        console.log('🧹 Cleaning OLD demo data...');
        const demoWhere = { isDemo: true };

        // Transaction to ensure cleanup is atomic
        await prisma.$transaction([
            prisma.saleItem.deleteMany({ where: { sale: demoWhere } }),
            prisma.sale.deleteMany({ where: demoWhere }),
            prisma.cashRegister.deleteMany({ where: demoWhere }),
            prisma.productionBatch.deleteMany({ where: demoWhere }),
            prisma.productionMacro.deleteMany({ where: demoWhere }),
            prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrder: demoWhere } }),
            prisma.purchaseOrder.deleteMany({ where: demoWhere }),
            prisma.product.deleteMany({ where: demoWhere }),
            prisma.recipeIngredient.deleteMany({ where: { recipe: demoWhere } }),
            prisma.recipe.deleteMany({ where: demoWhere }),
            prisma.ingredient.deleteMany({ where: demoWhere }),
            prisma.supplier.deleteMany({ where: demoWhere }),
            prisma.packaging.deleteMany({ where: demoWhere }),
            prisma.user.deleteMany({ where: { email: 'demo@salsealo.com' } })
        ]);

        // 2. Create Tenant, Branch and User
        console.log('🏢 Creating Demo Tenant, Branch & User...');

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
            const { category, ...supplierData } = s;
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
            // Salsas (Simplified for speed)
            { name: 'Salsa Pizza Pomodoro', unit: 'lt', cost: 120.00, supplier: 'Varios', category: 'Salsas', stock: 30 },
            // Empaques
            { name: 'Caja Hamburguesa', unit: 'unid', cost: 8.00, supplier: 'Empaques', category: 'Empaques', stock: 500 },
            { name: 'Caja Pizza 12"', unit: 'unid', cost: 15.00, supplier: 'Empaques', category: 'Empaques', stock: 300 },
        ];

        const ingMap = new Map();
        for (const i of ingredientsData) {
            const supId = suppliersMap.get(i.supplier) || suppliersMap.get('Varios');
            const created = await prisma.ingredient.create({
                data: {
                    name: `[DEMO] ${i.name}`, unit: i.unit, avgCost: i.cost, currentStock: i.stock, minStock: 10,
                    supplierId: supId, category: i.category, isDemo: true, isActive: true, tenantId: tenant.id
                }
            });
            ingMap.set(i.name, created.id);
        }
        const getIngId = (name: string) => ingMap.get(name);

        // 5. Create Recipes
        console.log('👨‍🍳 Creating Recipes...');
        const recipesData = [
            {
                name: '[DEMO] Hamburguesa Clásica', yield: 1, unit: 'unid', price: 350.00, category: 'Hamburguesas', margin: 55, prepTime: 12,
                ingredients: [
                    { name: 'Pan Brioche Burger', qty: 1, unit: 'unid' }, { name: 'Carne Molida Angus', qty: 0.15, unit: 'kg' },
                    { name: 'Queso Cheddar Lonjas', qty: 0.05, unit: 'paq' }, { name: 'Lechuga Repollada', qty: 0.05, unit: 'unid' },
                    { name: 'Tomate Barceló', qty: 0.05, unit: 'lb' }, { name: 'Caja Hamburguesa', qty: 1, unit: 'unid' },
                ]
            },
            {
                name: '[DEMO] Pizza Pepperoni', yield: 1, unit: 'unid', price: 600.00, category: 'Pizzas', margin: 65, prepTime: 20,
                ingredients: [
                    { name: 'Masa Pizza 12"', qty: 1, unit: 'unid' }, { name: 'Salsa Pizza Pomodoro', qty: 0.10, unit: 'lt' },
                    { name: 'Queso Mozzarella Rallado', qty: 0.3, unit: 'lb' }, { name: 'Pepperoni', qty: 0.1, unit: 'kg' },
                    { name: 'Caja Pizza 12"', qty: 1, unit: 'unid' },
                ]
            }
        ];

        const recipesMap = new Map();
        for (const r of recipesData) {
            let calCost = 0;
            const recipeIngs = [];
            for (const i of r.ingredients) {
                const ingId = getIngId(i.name);
                if (!ingId) continue;
                const sourceIng = ingredientsData.find(d => d.name === i.name);
                if (sourceIng) calCost += sourceIng.cost * i.qty;
                recipeIngs.push({ ingredientId: ingId, quantity: i.qty, unit: i.unit });
            }

            const created = await prisma.recipe.create({
                data: {
                    name: r.name, yield: r.yield, yieldUnit: r.unit, category: r.category, targetMargin: r.margin,
                    calculatedCost: calCost, suggestedPrice: r.price, prepTime: r.prepTime, isDemo: true, isActive: true,
                    tenantId: tenant.id,
                    ingredients: { create: recipeIngs }
                }
            });
            recipesMap.set(r.name, created);
        }

        // 6. Create Products
        console.log('📦 Creating Products...');
        const productsData = [
            { name: '[DEMO] Classic Burger', desc: 'Nuestra hamburguesa insignia.', price: 350, cat: 'Hamburguesas', recipe: '[DEMO] Hamburguesa Clásica' },
            { name: '[DEMO] Pizza Pepperoni', desc: 'La favorita de todos.', price: 600, cat: 'Pizzas', recipe: '[DEMO] Pizza Pepperoni' },
            { name: '[DEMO] Coca Cola', desc: 'Lata 330ml.', price: 80, cat: 'Bebidas', recipe: null },
            { name: '[DEMO] Cerveza Presidente', desc: 'Botella Pequeña.', price: 180, cat: 'Bebidas', recipe: null },
        ];

        const productsList = [];
        for (const p of productsData) {
            let recipeId = null;
            if (p.recipe) recipeId = recipesMap.get(p.recipe)?.id;
            const created = await prisma.product.create({
                data: {
                    name: p.name, description: p.desc, price: p.price, currentStock: 50, minStock: 10,
                    category: p.cat, recipeId: recipeId, isDemo: true, isActive: true, tenantId: tenant.id
                }
            });
            productsList.push(created);
        }

        // 7. Generate Sales History (Including TODAY)
        console.log('💰 Generating Sales History (60 days)...');
        const totalDays = 60; // 60 days of history
        const paymentMethods = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

        for (let i = 0; i <= totalDays; i++) { // <= ensures we hit "0 days ago" which is TODAY
            const date = new Date();
            date.setDate(date.getDate() - (totalDays - i));

            // Explicitly set NOW for the last iteration (today) to ensure it's not 00:00:00
            if (i === totalDays) {
                date.setHours(new Date().getHours());
            }

            // More orders on weekends or TODAY
            const dayOfWeek = date.getDay();
            let dailyOrders = Math.floor(Math.random() * 4) + 2;
            if (dayOfWeek === 0 || dayOfWeek === 6 || i === totalDays) { // Boost weekend and TODAY
                dailyOrders += Math.floor(Math.random() * 5) + 5;
            }

            for (let j = 0; j < dailyOrders; j++) {
                const orderDate = new Date(date);
                if (i !== totalDays) {
                    orderDate.setHours(11 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
                } else {
                    // For TODAY, randomize between morning and now
                    const nowHour = new Date().getHours();
                    const minHour = 9;
                    const randomHour = Math.floor(Math.random() * (nowHour - minHour + 1)) + minHour;
                    orderDate.setHours(randomHour, Math.floor(Math.random() * 60));
                }

                const numItems = Math.floor(Math.random() * 3) + 1;
                const saleItems = [];
                let subtotal = 0;

                for (let k = 0; k < numItems; k++) {
                    const prod = productsList[Math.floor(Math.random() * productsList.length)];
                    const qty = Math.floor(Math.random() * 2) + 1;
                    const totalItem = Number(prod.price) * qty;

                    saleItems.push({
                        productId: prod.id, quantity: qty, unitPrice: prod.price, subtotal: totalItem
                    });
                    subtotal += totalItem;
                }

                await prisma.sale.create({
                    data: {
                        createdAt: orderDate, subtotal: subtotal, total: subtotal, discount: 0,
                        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                        status: 'COMPLETED', isDemo: true, tenantId: tenant.id, branchId: branch.id, items: { create: saleItems }
                    }
                });
            }
        }

        return NextResponse.json({ success: true, message: "Demo data seeded successfully including Today!" });
    } catch (error) {
        console.error("Error seeding data:", error);
        return NextResponse.json({ error: "Failed to seed data", details: String(error) }, { status: 500 });
    }
}
