import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod";
import { db } from "../db";
import { usersTable } from "../db/schema";

if (!process.env.JWT_SECRET) {
  throw new Error("🚫 JWT_SECRET is required");
}

export const authRouter = new Hono();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({
    message: "🚫 Invalid email address",
  }),
  password: z.string().min(6, {
    message: "🚫 Password must be at least 6 characters long",
  }),
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

// /api/v1/auth
authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
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
