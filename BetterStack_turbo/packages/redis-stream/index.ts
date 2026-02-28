require("dotenv").config();
import { createClient, type RedisClientType } from "redis";

const redis: RedisClientType = createClient({
  url: process.env.REDIS_URL,
});
redis.on("error", (err) => {
  console.log("Redis Client Error", err);
  redis.quit();
});

const connectRedis = async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
      console.log("Redis connected");
    }
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
  }
};
connectRedis();

type WebsiteAdd = {
  url: string;
  id: string;
};

const XAdd = async (websties: WebsiteAdd[]) => {
  websties.map(async ({ url: websiteUrl, id: websiteId }) => {
    await redis.XADD("betteruptime:website", "*", {
      url: websiteUrl,
      id: websiteId,
    });
  });
};

const BulkXAdd = async (websties: WebsiteAdd[]) => {
  const multi = redis.multi();
  websties.forEach(({ url: websiteUrl, id: websiteId }) => {
    multi.XADD("betteruptime:website", "*", {
      url: websiteUrl,
      id: websiteId,
    });
  });
  await multi.exec();
};
type XreadType = {
  id: string;
  message: {
    url: string;
    id: string;
  };
};
const XReadGroup = async (
  workerId: string,
  consumerGroup: string,
): Promise<XreadType[]> => {
  const res = await redis.XREADGROUP(
    consumerGroup,
    workerId,
    { key: "betteruptime:website", id: ">" },
    { COUNT: 10, BLOCK: 5000 },
  );
  const messages = res ? res[0]?.messages || [] : [];
  console.log("XReadGroup Result:", res);
  // @ts-ignore
  return messages;
};

const XAck = async (consumerGroup: string, streamId: string) => {
  const res = await redis.XACK("betteruptime:website", consumerGroup, streamId);
  console.log("XAck Result:", res);
  return res;
};

const BulkXAck = async (consumerGroup: string, streamIds: string[]) => {
  if (streamIds.length === 0) {
    return 0;
  }

  const ackResults = await Promise.all(
    streamIds.map((streamId) => XAck(consumerGroup, streamId)),
  );
  const totalAcked = ackResults.reduce((sum, value) => sum + value, 0);
  console.log("BulkXAck Result:", totalAcked);
  return totalAcked;
};
export { connectRedis, XAdd, BulkXAdd, XReadGroup, BulkXAck };
