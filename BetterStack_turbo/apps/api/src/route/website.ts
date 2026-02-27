import { Router, type Router as RouterType } from "express";
import { prisma } from "store/client";

export function websiteRouter(): RouterType {
  const router = Router();

  router.post("/website", async (req, res) => {
    try {
      const { url, user_id: userId } = req.body;

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
          userId,
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

  router.get("/websites/:user_id", async (req, res) => {
    try {
      const userId = req.params.user_id;

      if (!userId) {
        return res
          .status(400)
          .json({ message: "user_id query parameter is required" });
      }

      const websites = await prisma.website.findMany({
        where: { userId },
      });

      return res.status(200).json({ websites });
    } catch (error) {
      console.error("get websites error:", error);
      return res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  return router;
}
