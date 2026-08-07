import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('👤 Creating users only...');

    const adminPassword = await bcrypt.hash('Otulett@052911', 10);
    const ownerPassword = await bcrypt.hash('Salsealo2026@', 10);

    // Check if users already exist
    const existingAdmin = await prisma.user.findUnique({
        where: { email: 'otuletta@salsealo.com' }
    });

    if (existingAdmin) {
        console.log('⚠️ Users already exist!');
        return;
    }

    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: { name: 'Salsealo Default', slug: 'salsealo' }
        });
    }

    await prisma.user.create({
        data: {
            name: 'Otuletta',
            email: 'otuletta@salsealo.com',
            password: adminPassword,
            role: 'ADMIN',
            tenantId: tenant.id
        },
    });

    await prisma.user.create({
        data: {
            name: 'Mtuletta',
            email: 'mtuletta@salsealo.com',
            password: ownerPassword,
            role: 'OWNER',
            tenantId: tenant.id
        },
    });

    await prisma.user.create({
        data: {
            name: 'Nathaly',
            email: 'nathaly@salsealo.com',
            password: ownerPassword,
            role: 'OWNER',
            tenantId: tenant.id
        },
    });

    console.log('✅ Users created successfully!');
    console.log('\n📋 Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Admin:');
    console.log('   Email: otuletta@salsealo.com');
    console.log('   Password: Otulett@052911');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Owner 1:');
    console.log('   Email: mtuletta@salsealo.com');
    console.log('   Password: Salsealo2026@');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Owner 2:');
    console.log('   Email: nathaly@salsealo.com');
    console.log('   Password: Salsealo2026@');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
