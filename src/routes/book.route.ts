// book.route.ts
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { z } from "zod";
import { db } from "../db";
import { booksTable } from "../db/schema";

export const bookRouter = new Hono();

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error("🚫 JWT_SECRET is required");
}

// Esquema de validación Zod
const bookSchema = z.object({
  title: z.string().min(3, "🚫 Title must be at least 3 characters"),
  author: z.string().min(3, "🚫 Author must be at least 3 characters"),
});

// Middleware JWT
const jwtMiddleware = jwt({ secret: JWT_SECRET });

// Obtener todos los libros del usuario
bookRouter.get("/", jwtMiddleware, async (c) => {
  const payload = c.get("jwtPayload");

  const books = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.userId, payload.id));

  return c.json(books);
});

// Crear nuevo libro
bookRouter.post(
  "/",
  jwtMiddleware,
  zValidator("json", bookSchema),
  async (c) => {
    const payload = c.get("jwtPayload");
    const { title, author } = c.req.valid("json");

    const [newBook] = await db
      .insert(booksTable)
      .values({ title, author, userId: payload.id })
      .returning();

    return c.json(newBook, 201);
  }
);

// Actualizar libro
bookRouter.put(
  "/:id",
  jwtMiddleware,
  zValidator("json", bookSchema),
  async (c) => {
    const payload = c.get("jwtPayload");
    const bookId = c.req.param("id");
    const { title, author } = c.req.valid("json");

    const [updatedBook] = await db
      .update(booksTable)
      .set({ title, author })
      .where(
        and(
          eq(booksTable.id, parseInt(bookId)),
          eq(booksTable.userId, payload.id)
        )
      )
      .returning();

    if (!updatedBook) {
      return c.json({ message: "🚫 Book not found or unauthorized" }, 404);
    }

    return c.json(updatedBook);
  }
);

// Eliminar libro
bookRouter.delete("/:id", jwtMiddleware, async (c) => {
  const payload = c.get("jwtPayload");
  const bookId = c.req.param("id");

  const [deletedBook] = await db
    .delete(booksTable)
    .where(
      and(
        eq(booksTable.id, parseInt(bookId)),
        eq(booksTable.userId, payload.id)
      )
    )
    .returning();

  if (!deletedBook) {
    return c.json({ message: "🚫 Book not found or unauthorized" }, 404);
  }

  return c.json({ message: "✅ Book deleted successfully" });
});

export default bookRouter;
