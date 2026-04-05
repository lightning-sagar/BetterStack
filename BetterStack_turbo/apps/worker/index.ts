require("dotenv").config();
import axios from "axios";
import { XReadGroup, BulkXAck } from "redis-stream";
import { prisma } from "store/client";

const Region_Input = process.env.REGION_ID || process.env.REGION_NAME || "india";
const Worker_Id = process.env.WORKER_ID || "1";
const Consumer_Group = process.env.CONSUMER_GROUP || "worker-group";

const resolveRegionId = async () => {
  const byId = await prisma.region.findUnique({
    where: { id: Region_Input },
    select: { id: true },
  });

  if (byId) {
    return byId.id;
  }

  const byName = await prisma.region.findUnique({
    where: { name: Region_Input },
    select: { id: true },
  });

  if (byName) {
    return byName.id;
  }

  const created = await prisma.region.create({
    data: { name: Region_Input },
    select: { id: true },
  });

  console.log(`Created missing region '${Region_Input}' with id ${created.id}`);
  return created.id;
};

// read all the stream
// process the stream and store it into the DB.
// Acknowledge the stream that it has been processed.
// it should probably routed through a queue in a bluk DB request to avoid overloading the DB.

async function main() {
  const regionId = await resolveRegionId();

  while (1) {
    const res = await XReadGroup(Worker_Id, Consumer_Group);
    console.log("XReadGroup Result:", res);
    if (!res || res.length === 0) {
      console.log("No messages to process");
      continue;
    }
    const processingResults = await Promise.all(
      res.map(async (item) => {
        const { url, id } = item.message;
        console.log(`Processing item with URL: ${url} and ID: ${id}`);
        const startTime = Date.now();

        try {
          await axios.get(`https://${url}`);
          const endTime = Date.now();
          await prisma.websiteTick.create({
            data: {
              response_time_ms: endTime - startTime,
              website_id: id,
              status_code: "Up",
              time_checked: new Date(),
              region_id: regionId,
            },
          });
          console.log(
            `Successfully processed item with URL: ${url} and ID: ${id}`,
          );
          return { streamId: item.id, persisted: true };
        } catch (err) {
          const endTime = Date.now();
          try {
            await prisma.websiteTick.create({
              data: {
                response_time_ms: endTime - startTime,
                website_id: id,
                status_code: "Down",
                time_checked: new Date(),
                region_id: regionId,
              },
            });
            console.log(`Marked website down for URL: ${url} and ID: ${id}`);
            return { streamId: item.id, persisted: true };
          } catch (dbErr) {
            console.error(
              `Failed to persist tick for URL: ${url} and ID: ${id}`,
              dbErr,
            );
            return { streamId: item.id, persisted: false };
          }
        } finally {
          console.log(
            `Finished processing item with URL: ${url} and ID: ${id}`,
          );
        }
      }),
    );

    const ackIds = processingResults
      .filter((result) => result.persisted)
      .map((result) => result.streamId);

    console.log(
      `Processed ${processingResults.length} items, acknowledging ${ackIds.length}.`,
    );
    await BulkXAck(Consumer_Group, ackIds);
  }
}

main()
  .catch((error) => {
    console.error("Worker failed:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
