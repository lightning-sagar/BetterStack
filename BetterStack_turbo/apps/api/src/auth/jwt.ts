import jwt from "jsonwebtoken";

type JwtPayload = {
  userId: string;
  username: string;
  email: string;
};

const JWT_SECRET = process.env.JWT_SECRET ?? "change_this_in_env";

export function createAuthToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}