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

      const user = await prisma.user.create({
        data: { username, password, email },
        select: {
          id: true,
          username: true,
          email: true,
        },
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
    } catch (error: any) {
      console.error("signup error:", error);
      if (error?.code === "P2002") {
        return res
          .status(400)
          .json({
            message: "Username or email already exists",
            success: false,
          });
      }
      if (error?.code === "P2022") {
        return res.status(500).json({
          message: "Database schema mismatch. Run Prisma sync/migrations.",
          success: false,
        });
      }
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
        console.log(user, "signin failed: invalid credentials");
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
    } catch (error: any) {
      console.error("signin error:", error);
      if (error?.code === "P2022") {
        return res.status(500).json({
          message: "Database schema mismatch. Run Prisma sync/migrations.",
          success: false,
        });
      }
      return res
        .status(500)
        .json({ message: "Sign in failed", success: false });
    }
  });

  return router;
}
