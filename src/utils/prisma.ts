import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../../generated/prisma/client.js";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

export default prisma;
