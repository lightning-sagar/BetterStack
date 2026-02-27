import { Router, type Router as RouterType } from "express";
import { userRouter } from "./user.js";
import { websiteRouter } from "./website.js";

export function routes(): RouterType {
  const router = Router();

  router.get("/", (_req, res) => {
    res.status(200).send("Hello World!");
  });

  router.use(userRouter());
  router.use(websiteRouter());

  return router;
}
