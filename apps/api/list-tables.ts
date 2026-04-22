import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function list() {
    try {
        const tables: any[] = await prisma.$queryRawUnsafe(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);
        console.log('--- TABELAS ENCONTRADAS NO SCHEMA PUBLIC ---');
        tables.forEach(t => console.log(`- ${t.table_name}`));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

list();
