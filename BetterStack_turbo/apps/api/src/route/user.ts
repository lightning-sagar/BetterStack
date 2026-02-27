import { Router, type Router as RouterType } from "express";
import { prisma } from "store/client";
import { createAuthToken } from "../auth/jwt.js";

export function userRouter(): RouterType {
  const router = Router();

  router.post("/signup", async (req, res) => {
    try {
      const { username, password, email } = req.body;

      if (!username || !password || !email) {
        return res.status(400).json({
          message: "username, password, and email are required",
          success: false,
        });
      }

      if (await prisma.user.findUnique({ where: { username, email } })) {
        return res
          .status(400)
          .json({ message: "Username already exists", success: false });
      }
      const user = await prisma.user.create({
        data: { username, password, email },
      });
      const token = createAuthToken({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      return res.status(201).json({
        message: `Sign up successful: ${user.id}`,
        success: true,
        token,
      });
    } catch (error) {
      console.error("signup error:", error);
      return res
        .status(500)
        .json({ message: "Sign up failed", success: false });
    }
  });

  router.post("/signin", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          message: "username and password are required",
          success: false,
        });
      }

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user || user.password !== password) {
        return res.status(401).json({
          message: "Sign in failed: invalid credentials",
          success: false,
        });
      }
      const token = createAuthToken({
        userId: user.id,
        username: user.username,
        email: user.email,
      });

      return res.status(200).json({
        message: `Sign in successful: ${user.id}`,
        success: true,
        token,
      });
    } catch (error) {
      console.error("signin error:", error);
      return res
        .status(500)
        .json({ message: "Sign in failed", success: false });
    }
  });

  return router;
}
