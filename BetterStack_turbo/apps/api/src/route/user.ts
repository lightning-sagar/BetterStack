import { Router, type Router as RouterType } from "express";
import { prisma } from "store/client";
import { createAuthToken } from "../auth/jwt.js";
import { authMiddleware } from "../auth/middleware.js";

function buildUsername(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, " ");
}

export function userRouter(): RouterType {
  const router = Router();

  router.get("/me", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Missing user session", success: false });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found", success: false });
      }

      return res.status(200).json({ success: true, user });
    } catch (error) {
      console.error("get me error:", error);
      return res.status(500).json({ message: "Failed to fetch user", success: false });
    }
  });

  router.post("/signup", async (req, res) => {
    try {
      const { firstName, lastName, password, email } = req.body;
      const username = buildUsername(firstName ?? "", lastName ?? "");

      if (!firstName || !lastName || !password || !email) {
        return res.status(400).json({
          message: "firstName, lastName, password, and email are required",
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
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
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
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "email and password are required",
          success: false,
        });
      }

      const user = await prisma.user.findUnique({
        where: { email },
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
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
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

  router.post("/logout", authMiddleware, async (_req, res) => {
    return res.status(200).json({
      message: "Logout successful",
      success: true,
    });
  });

  router.patch("/user/username", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const username = String(req.body?.username ?? "").trim();

      if (!userId) {
        return res.status(401).json({ message: "Missing user session", success: false });
      }

      if (!username || username.length < 2) {
        return res.status(400).json({ message: "username must be at least 2 characters", success: false });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { username },
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

      return res.status(200).json({
        message: "Username updated",
        success: true,
        user,
        token,
      });
    } catch (error: any) {
      console.error("update username error:", error);
      if (error?.code === "P2002") {
        return res.status(400).json({ message: "Username already exists", success: false });
      }

      return res.status(500).json({ message: "Failed to update username", success: false });
    }
  });

  router.patch("/user/profile", authMiddleware, async (req, res) => {
    try {
      const userId = req.user?.userId;
      const username = typeof req.body?.username === "string" ? req.body.username.trim() : undefined;
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : undefined;
      const password = typeof req.body?.password === "string" ? req.body.password : undefined;

      if (!userId) {
        return res.status(401).json({ message: "Missing user session", success: false });
      }

      const data: { username?: string; email?: string; password?: string } = {};
      if (username) {
        if (username.length < 2) {
          return res.status(400).json({ message: "username must be at least 2 characters", success: false });
        }
        data.username = username;
      }

      if (email) {
        data.email = email;
      }

      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ message: "password must be at least 6 characters", success: false });
        }
        data.password = password;
      }

      if (!Object.keys(data).length) {
        return res.status(400).json({ message: "No profile fields to update", success: false });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data,
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

      return res.status(200).json({
        message: "Profile updated",
        success: true,
        user,
        token,
      });
    } catch (error: any) {
      console.error("update profile error:", error);
      if (error?.code === "P2002") {
        return res.status(400).json({ message: "Username or email already exists", success: false });
      }

      return res.status(500).json({ message: "Failed to update profile", success: false });
    }
  });

  return router;
}
