#!/usr/bin/env ts-node

import { Prisma, PrismaClient} from "@prisma/client";
import * as fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// Helper function to log to file
function logToFile(message: string) {
  const systemLog = "/var/log/cron.log";
  const localLog = path.resolve("cron.log");
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  let logPath = systemLog;

  try {
    // Check if the system log file exists and is writable
    fs.accessSync(systemLog, fs.constants.W_OK);
  } catch (err) {
    // If not writable (or doesn’t exist), fall back to local
    logPath = localLog;
  }

  try {
    fs.appendFileSync(logPath, logEntry);
  } catch (err) {
    // Final fallback: log to console
    console.error(`Failed to write to ${logPath}:`, err);
    console.log(logEntry.trim());
  }
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
