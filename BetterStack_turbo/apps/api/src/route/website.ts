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

  router.get("/status/:websiteId", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { websiteId } = req.params;
      const website = await prisma.website.findUnique({
        where: { id: websiteId, user_id:userId },
        include: { ticks: { orderby: [{ createdAt: "desc" }], take: 1 } },
      });
      if (!website) {
        res.status(403).json({ message: "not found" });
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
