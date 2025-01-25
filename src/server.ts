import { Hono } from "hono";
import type { JwtVariables } from "hono/jwt";
import { authRouter } from "./routes/auth.route";
import { bookRouter } from "./routes/book.route";
import exampleRouter from "./routes/example.route";

import { apiReference } from "@scalar/hono-api-reference";
import { openAPISpecs } from "hono-openapi";
import { resolver } from "hono-openapi/zod";
import { z } from "zod";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();

app.route("/api/v1/example", exampleRouter);
app.route("/api/v1/auth", authRouter);
app.route("/api/v1/book", bookRouter);

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Hono",
        version: "1.0.0",
        description: "API for greeting an creating users",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local server",
        },
      ],
    },
    defaultOptions: {
      GET: {
        responses: {
          400: {
            description: "Zod Error",
            content: {
              "application/json": {
                schema: resolver(
                  z
                    .object({
                      status: z.literal(400),
                      message: z.string(),
                    })
                    .openapi({ ref: "Bad Request" })
                ),
              },
            },
          },
        },
      },
    },
  })
);

app.get(
  "/",
  apiReference({
    theme: "saturn",
    spec: {
      url: "/openapi",
    },
  })
);

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
