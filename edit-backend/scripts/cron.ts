#!/usr/bin/env ts-node

import { Prisma, PrismaClient} from "@prisma/client";
import * as fs from "fs";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// Helper function to log to file
function logToFile(message: string) {
    // const logPath = "/var/log/cron.log";
    const logPath = "cron.log";
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

async function updateArticlesReadsSummary() {
    try {
        const queryString = Prisma.sql`
            REPLACE INTO articlesReadsSummary (articles_id, read_count, updated_at)
            SELECT articles_id, COUNT(*) AS read_count, NOW()
            FROM articlesReads
            WHERE articlesReads_timestamp >= DATE_SUB(NOW(), INTERVAL 1 WEEK)
            GROUP BY articles_id`
        await prisma.$queryRaw(queryString);
        const msg = `Cron executed successfully.`;
        console.log(msg);
        logToFile(msg);
    } catch (err) {
        const msg = `Cron failed: ${err}`;
        console.error(msg);
        logToFile(msg);
    } finally {
        prisma.$disconnect();
    }
}

updateArticlesReadsSummary().then();
