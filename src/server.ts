import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";
import { authRouter } from "./routes/auth.route";
import { bookRouter } from "./routes/book.route";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();

app.route("/api/v1/auth", authRouter);
app.route("/api/v1/book", bookRouter);

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
