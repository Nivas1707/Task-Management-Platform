
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Fixing tasks...');
    // Force update all tasks to set deletedAt to null
    // We use updateMany with an empty where clause to target all documents
    const result = await prisma.task.updateMany({
        where: {},
        data: { deletedAt: null }
    });
    console.log(`Updated ${result.count} tasks.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
