import { XAdd } from "redis-stream";
import { prisma } from "store/client";

async function main() {
  const websites = await prisma.website.findMany({
    select: {
      url: true,
      id: true,
    },
  });
  console.log(`Pushing ${websites.length} websites to Redis stream...`);
  await XAdd(websites);
}

setInterval(
  () => {
    main();
  },
  3 * 60 * 1000,
);
