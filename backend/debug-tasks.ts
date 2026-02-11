
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging Tasks ---');

    const users = await prisma.user.findMany();
    console.log(`Total Users: ${users.length}`);
    users.forEach(u => console.log(`User: ${u.id} (${u.email})`));

    const allTasks = await prisma.task.findMany();
    console.log(`\nTotal Tasks in DB: ${allTasks.length}`);
    allTasks.forEach(t => {
        console.log(`Task: ${t.id}, Title: ${t.title}, UserId: ${t.userId}, DeletedAt: ${t.deletedAt}`);
    });

    const activeTasks = await prisma.task.findMany({
        where: { deletedAt: null }
    });
    console.log(`\nActive Tasks (deletedAt: null): ${activeTasks.length}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
