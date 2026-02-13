import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Inspecting Users...');
    const users = await prisma.user.findMany();
    users.forEach(u => {
        console.log(`- ${u.name} (${u.email}) | Role: ${u.role}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
