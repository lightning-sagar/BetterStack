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

const STREAM_KEY = "betteruptime:website";

const ensureConsumerGroup = async (consumerGroup: string) => {
  try {
    await redis.sendCommand([
      "XGROUP",
      "CREATE",
      STREAM_KEY,
      consumerGroup,
      "0",
      "MKSTREAM",
    ]);
    console.log(`Created consumer group '${consumerGroup}' on ${STREAM_KEY}`);
  } catch (error) {
    // BUSYGROUP means the group already exists, which is fine.
    if (!(error instanceof Error) || !error.message.includes("BUSYGROUP")) {
      throw error;
    }
  }
};

const XAdd = async (websties: WebsiteAdd[]) => {
  websties.map(async ({ url: websiteUrl, id: websiteId }) => {
    await redis.XADD(STREAM_KEY, "*", {
      url: websiteUrl,
      id: websiteId,
    });
  });
};

const BulkXAdd = async (websties: WebsiteAdd[]) => {
  const multi = redis.multi();
  websties.forEach(({ url: websiteUrl, id: websiteId }) => {
    multi.XADD(STREAM_KEY, "*", {
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
  let res;
  try {
    res = await redis.XREADGROUP(
      consumerGroup,
      workerId,
      { key: STREAM_KEY, id: ">" },
      { COUNT: 10, BLOCK: 5000 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("NOGROUP")) {
      await ensureConsumerGroup(consumerGroup);
      res = await redis.XREADGROUP(
        consumerGroup,
        workerId,
        { key: STREAM_KEY, id: ">" },
        { COUNT: 10, BLOCK: 5000 },
      );
    } else {
      throw error;
    }
  }
  const messages = res ? res[0]?.messages || [] : [];
  console.log("XReadGroup Result:", res);
  // @ts-ignore
  return messages;
};

const XAck = async (consumerGroup: string, streamId: string) => {
  const res = await redis.XACK(STREAM_KEY, consumerGroup, streamId);
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
