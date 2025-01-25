// import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";
import { db } from "../db";
import { usersTable } from "../db/schema";

import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import "zod-openapi/extend";

if (!process.env.JWT_SECRET) {
  throw new Error("🚫 JWT_SECRET is required");
}

export const authRouter = new Hono();

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({
      message: "🚫 Invalid email address",
    })
    .openapi({
      example: "test@test.com",
      description: "User email",
      ref: "email",
    }),
  password: z
    .string()
    .min(6, {
      message: "🚫 Password must be at least 6 characters long",
    })
    .openapi({
      example: "123123",
      description: "User password",
      ref: "password",
    }),
});

const loginValidator = zValidator("json", loginSchema);

const openApiRoute = describeRoute({
  description: "Login to the application",
  responses: {
    200: {
      description: "Successful login response",
      content: {
        "application/json": {
          // schema: {
          //   type: "object",
          //   properties: {
          //     token: {
          //       type: "string",
          //       example:
          //         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiZXhwIjoxNjI4NzQ4NjE1fQ.1x5",
          //     },
          //   },
          // },
          schema: resolver(
            z.object({ token: z.string() }).openapi({
              example: {
                token:
                  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiZXhwIjoxNjI4NzQ4NjE1fQ.1x5",
              },
            })
          ),
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                example: "🚫 User not found",
              },
            },
          },
        },
      },
    },
    401: {
      description: "Invalid password",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: {
                type: "string",
                example: "🚫 Invalid password",
              },
            },
          },
        },
      },
    },
  },
});

authRouter.post("/login", openApiRoute, loginValidator, async (c) => {
  const { email, password } = c.req.valid("json");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user) {
    return c.json({ message: "🚫 User not found" }, 404);
  }

  const passwordMatch = await Bun.password.verify(password, user.password);

  if (!passwordMatch) {
    return c.json({ message: "🚫 Invalid password" }, 401);
  }

  const secret = process.env.JWT_SECRET as string;
  const payload = {
    id: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
  };

  const token = await sign(payload, secret);

  return c.json({ token });
});

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email({
    message: "🚫 Invalid email address",
  }),
  password: z.string().min(6, {
    message: "🚫 Password must be at least 6 characters long",
  }),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, {
      message: "🚫 Username must be at least 3 characters long",
    })
    .max(20, {
      message: "🚫 Username must be at most 20 characters long",
    })
    .optional(),
});

authRouter.post(
  "/register",
  zValidator("json", registerSchema),
  async ({ req, json }) => {
    // const { email, password, username } = await req.json()
    const { email, password, username } = req.valid("json");

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (user) {
      return json({ message: "🚫 User already exists" }, 400);
    }

    const hashedPassword = await Bun.password.hash(password);

    const [newUser] = await db
      .insert(usersTable)
      .values({
        email,
        password: hashedPassword,
        username,
      })
      .returning({ id: usersTable.id, email: usersTable.email });

    return json(newUser);
  }
);

export default authRouter;
