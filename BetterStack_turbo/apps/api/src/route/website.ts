import { Router, type Router as RouterType } from "express";
import { prisma } from "store/client";
import { authMiddleware } from "../auth/middleware.js";

export function websiteRouter(): RouterType {
  const router = Router();

  router.post("/website", authMiddleware, async (req, res) => {
    try {
      const { url } = req.body;
        console.log(req.user, "creating website with url:", url);
      const userId = req.user?.userId;
      if (!url || !userId) {
        return res
          .status(400)
          .json({ message: "url and user_id are required", website_id: "" });
      }

      if (!(await prisma.user.findUnique({ where: { id: userId } }))) {
        return res
          .status(400)
          .json({ message: "Invalid user_id", website_id: "" });
      }
      const website = await prisma.website.create({
        data: {
          url,
          user_id:userId,
        },
      });

      return res.status(201).json({
        message: `Website created with URL: ${url}`,
        website_id: website.id,
      });
    } catch (error) {
      console.error("create website error:", error);
      return res
        .status(500)
        .json({ message: "Failed to create website", website_id: "" });
    }
  });

  router.get("/websites", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res
          .status(400)
          .json({ message: "user_id query parameter is required" });
      }

      const websites = await prisma.website.findMany({
        where: { user_id:userId },
      });

      return res.status(200).json({ websites });
    } catch (error) {
      console.error("get websites error:", error);
      return res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  router.get("/websites/search", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const query = String(req.query.q ?? "").trim();

      if (!userId) {
        return res.status(401).json({ message: "Missing user session" });
      }

      const websites = await prisma.website.findMany({
        where: {
          user_id: userId,
          ...(query
            ? {
                url: {
                  contains: query,
                  mode: "insensitive",
                },
              }
            : {}),
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return res.status(200).json({ websites, query });
    } catch (error) {
      console.error("search websites error:", error);
      return res.status(500).json({ message: "Failed to search websites" });
    }
  });

  router.get("/website/:websiteId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { websiteId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Missing user session" });
      }

      const website = await prisma.website.findFirst({
        where: {
          id: websiteId,
          user_id: userId,
        },
      });

      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      const ticks = await prisma.websiteTick.findMany({
        where: { website_id: websiteId },
        include: { region: true },
        orderBy: { time_checked: "desc" },
        take: 90,
      });

      return res.status(200).json({ website, ticks });
    } catch (error) {
      console.error("get website detail error:", error);
      return res.status(500).json({ message: "Failed to fetch website detail" });
    }
  });

  router.delete("/website/:websiteId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { websiteId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Missing user session" });
      }

      const website = await prisma.website.findFirst({
        where: {
          id: websiteId,
          user_id: userId,
        },
      });

      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      await prisma.websiteTick.deleteMany({
        where: { website_id: websiteId },
      });

      await prisma.website.delete({
        where: { id: websiteId },
      });

      return res.status(200).json({ message: "Website deleted", website_id: websiteId });
    } catch (error) {
      console.error("delete website error:", error);
      return res.status(500).json({ message: "Failed to delete website" });
    }
  });

  router.get("/websites/:websiteId/ticks", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { websiteId } = req.params;

      if (!userId) {
        return res.status(401).json({ message: "Missing user session" });
      }

      const website = await prisma.website.findFirst({
        where: { id: websiteId, user_id: userId },
      });

      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }

      const ticks = await prisma.websiteTick.findMany({
        where: { website_id: websiteId },
        include: { region: true },
        orderBy: { time_checked: "desc" },
        take: 24,
      });

      return res.status(200).json({ websiteId, ticks });
    } catch (error) {
      console.error("get website ticks error:", error);
      return res.status(500).json({ message: "Failed to fetch website ticks" });
    }
  });

  router.get("/status/:websiteId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { websiteId } = req.params;
      const website = await prisma.website.findFirst({
        where: { id: websiteId, user_id: userId },
        include: { ticks: { orderBy: [{ time_checked: "desc" }], take: 1 } },
      });
      if (!website) {
        return res.status(403).json({ message: "not found" });
        return;
      }
      const latestTick = website.ticks[0];
      const status = latestTick ? latestTick.status_code : "Unknown";
      return res.status(200).json({ status });
    } catch (error) {
      console.error("get website status error:", error);
      return res
        .status(500)
        .json({ message: "Failed to fetch website status" });
    }
  });
  return router;
}
