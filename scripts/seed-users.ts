
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding users...');

    const users = [
        {
            name: 'Otule',
            email: 'Otuletta@salsealo.com',
            password: 'Otulett@052911',
            role: 'ADMIN',
        },
        {
            name: 'Malvyn Tuletta',
            email: 'Mtuletta@salsealo.com',
            password: 'Salsealo2026@',
            role: 'OWNER',
        },
        {
            name: 'Nathaly',
            email: 'Nathaly@salsealo.com',
            password: 'Salsealo2026@',
            role: 'OWNER',
        },
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const email = u.email.toLowerCase();

        // @ts-ignore
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
                role: u.role,
                name: u.name,
            },
            create: {
                email,
                name: u.name,
                password: hashedPassword,
                role: u.role,
            },
        });
        console.log(`User created/updated: ${user.email} (${user.role})`);
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
