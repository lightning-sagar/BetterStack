import { Router, type Router as RouterType } from "express";
import { prisma } from "store/client";
import { authMiddleware } from "../auth/middleware.js";

function parseDateRange(fromRaw?: string, toRaw?: string): { from?: Date; to?: Date } {
  const from = fromRaw ? new Date(fromRaw) : undefined;
  const to = toRaw ? new Date(toRaw) : undefined;
    //@ts-ignore
  return {
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
  };
}

export function alertsRouter(): RouterType {
  const router = Router();

  router.get("/incidents", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const limit = Math.min(Number(req.query.limit ?? 8), 100);
      const { from, to } = parseDateRange(String(req.query.from ?? ""), String(req.query.to ?? ""));

      if (!userId) {
        return res.status(401).json({ message: "Missing user session" });
      }

      const ticks = await prisma.websiteTick.findMany({
        where: {
          website: {
            user_id: userId,
          },
          ...(from || to
            ? {
                time_checked: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
        include: {
          website: true,
          region: true,
        },
        orderBy: {
          time_checked: "desc",
        },
        take: Number.isFinite(limit) && limit > 0 ? limit : 8,
      });

      const incidents = ticks.map((tick: any) => ({
        id: tick.id,
        website_id: tick.website_id,
        website_url: tick.website?.url ?? "Unknown",
        status: tick.status_code,
        response_time_ms: tick.response_time_ms,
        region: tick.region?.name ?? "Unknown",
        time_checked: tick.time_checked,
        title: tick.status_code === "Down" ? "Availability alert" : "Routine health check",
      }));

      return res.status(200).json({ incidents, range: { from, to } });
    } catch (error) {
      console.error("get incidents error:", error);
      return res.status(500).json({ message: "Failed to fetch incidents" });
    }
  });

  router.get("/incidents/down-websites", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { from, to } = parseDateRange(String(req.query.from ?? ""), String(req.query.to ?? ""));

      if (!userId) {
        return res.status(401).json({ message: "Missing user session" });
      }

      const downTicks = await prisma.websiteTick.findMany({
        where: {
          status_code: "Down",
          website: {
            user_id: userId,
          },
          ...(from || to
            ? {
                time_checked: {
                  ...(from ? { gte: from } : {}),
                  ...(to ? { lte: to } : {}),
                },
              }
            : {}),
        },
        include: {
          website: true,
          region: true,
        },
        orderBy: {
          time_checked: "desc",
        },
        take: 300,
      });

      const map = new Map<string, { website_id: string; website_url: string; down_count: number; latest_down_at: Date; regions: Set<string> }>();

      for (const tick of downTicks as any[]) {
        const key = tick.website_id;
        const current = map.get(key);
        if (!current) {
          map.set(key, {
            website_id: tick.website_id,
            website_url: tick.website?.url ?? "Unknown",
            down_count: 1,
            latest_down_at: tick.time_checked,
            regions: new Set([tick.region?.name ?? "Unknown"]),
          });
        } else {
          current.down_count += 1;
          if (tick.time_checked > current.latest_down_at) {
            current.latest_down_at = tick.time_checked;
          }
          current.regions.add(tick.region?.name ?? "Unknown");
        }
      }

      const websites = [...map.values()]
        .sort((a, b) => b.down_count - a.down_count)
        .slice(0, 12)
        .map((item) => ({
          website_id: item.website_id,
          website_url: item.website_url,
          down_count: item.down_count,
          latest_down_at: item.latest_down_at,
          regions: [...item.regions],
        }));

      return res.status(200).json({ websites, range: { from, to } });
    } catch (error) {
      console.error("get down websites error:", error);
      return res.status(500).json({ message: "Failed to fetch down websites" });
    }
  });

  router.get("/alerts", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Missing user session" });
      }

      const ticks = await prisma.websiteTick.findMany({
        where: {
          status_code: "Down",
          website: {
            user_id: userId,
          },
        },
        include: {
          website: true,
          region: true,
        },
        orderBy: {
          time_checked: "desc",
        },
        take: 50,
      });

      const alerts = ticks.map((tick: any) => ({
        id: tick.id,
        website_id: tick.website_id,
        website_url: tick.website?.url ?? "Unknown",
        status: tick.status_code,
        response_time_ms: tick.response_time_ms,
        region: tick.region?.name ?? "Unknown",
        time_checked: tick.time_checked,
        title: "Availability alert",
        message: `${tick.website?.url ?? "Website"} latency/availability issue in ${tick.region?.name ?? "unknown region"}`,
      }));

      return res.status(200).json({ alerts });
    } catch (error) {
      console.error("get alerts error:", error);
      return res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  router.get("/alerts/summary", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Missing user session" });
      }

      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const activeAlerts = await prisma.websiteTick.count({
        where: {
          status_code: "Down",
          time_checked: {
            gte: last24h,
          },
          website: {
            user_id: userId,
          },
        },
      });

      return res.status(200).json({
        active_alerts: activeAlerts,
        status: "coming_soon",
      });
    } catch (error) {
      console.error("get alerts summary error:", error);
      return res.status(500).json({ message: "Failed to fetch alerts summary" });
    }
  });

  return router;
}
