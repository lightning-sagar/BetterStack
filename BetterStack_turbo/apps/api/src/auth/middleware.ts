import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

type AuthPayload = {
    userId: string;
    username: string;
    email: string;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const jwtSecret: string = process.env.JWT_SECRET ?? "change_this_in_env";
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1] as string;
    try {
        const decoded = jwt.verify(token, jwtSecret);
        if (typeof decoded !== "object" || !decoded || !("userId" in decoded)) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        req.user = decoded as AuthPayload;
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};