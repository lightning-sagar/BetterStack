import { PrismaClient } from "./prisma/generated/client";
import { PrismaPg } from "@prisma/adapter-pg"

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  }),
})