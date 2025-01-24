import { Hono } from "hono";
import { jwt } from "hono/jwt";

export const bookRouter = new Hono();

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error("🚫 JWT_SECRET is required");
}

bookRouter.get(
  "/",
  jwt({
    secret: JWT_SECRET,
  }),
  async (c) => {
    const payload = c.get("jwtPayload");

    return c.json({ message: "👋 Hello from the book route", payload });
  }
);

export default bookRouter;
