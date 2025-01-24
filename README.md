# API REST con Bun, Hono, Zod, Drizzle ORM y Turso

## Bun

Bun es un entorno de ejecución rápido y moderno para JavaScript y TypeScript. Está diseñado para ser una alternativa más rápida a Node.js y otros entornos de ejecución de JavaScript. Bun pretende mejorar la velocidad y la eficiencia en la ejecución de aplicaciones JavaScript, incluyendo tiempos de inicio más rápidos y un mejor rendimiento general.

Bun no utiliza V8. En su lugar, Bun está construido utilizando JavaScriptCore, el motor de JavaScript desarrollado por Apple y utilizado en Safari. JavaScriptCore, también conocido como "JSC", es conocido por su rendimiento eficiente y su capacidad para ejecutar código JavaScript rápidamente.

## Hono

Hono es un marco de trabajo (framework) ligero y rápido para construir aplicaciones web en JavaScript y TypeScript. Se inspira en otros marcos minimalistas y prioriza la simplicidad y el rendimiento. Hono utiliza una arquitectura modular, lo que permite a los desarrolladores agregar funcionalidades adicionales según sea necesario, sin aumentar significativamente el tamaño base de la aplicación.

## Drizzle ORM

Drizzle ORM es un ORM (Object-Relational Mapping) para TypeScript. Está diseñado para ser fácil de usar y rápido de desarrollar. Drizzle ORM se basa en TypeORM y proporciona una capa de abstracción para simplificar la creación de modelos de datos.

## Turso DB

Turso es una base de datos compatible con SQLite creada en libSQL, la bifurcación de contribución abierta de SQLite.

## Primeros pasos

```sh
bun init
```

```json
"scripts": {
  "dev": "bun --watch src/server.ts"
}
```

### Primeros pasos con Hono

```sh
bun add hono
```

src\server.ts

```ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({ message: "Hello, World!" });
});

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
};
```

src/routes/auth.route.ts

```ts
import { Hono } from "hono";

export const authRouter = new Hono();

// /api/v1/auth

authRouter.post("/login", async (c) => {
  const { email, password } = await c.req.json();
  // TODO: 1. validar el req.json() con un schema

  // TODO: 2. buscar el usuario en la base de datos

  // TODO: 3. comparar la contraseña con la contraseña hasheada

  // TODO: 4. generar un token JWT

  // TODO: 5. devolver el token JWT
  return c.json({ email, password });
});

authRouter.post("/register", async (c) => {
  const { email, password } = await c.req.json();

  // TODO: 1. validar el req.json() con un schema

  // TODO: 2. buscar el usuario en la base de datos

  // TODO: 3. si el usuario NO existe, crearlo

  // TODO: 4. devolver el usuario creado

  return c.json({ email, password });
});

export default authRouter;
```

## Validación con Zod

```sh
bun add zod
bun add @hono/zod-validator
```

src/routes/auth.route.ts

```ts
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

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
    }),
});

// /api/v1/auth
authRouter.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  ...
  return c.json({ email, password });
});

authRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, username } = c.req.valid("json");
  ...
  return c.json({ email, password, username });
});

export default authRouter;
```

## Conexión a la base de datos con Drizzle ORM

- [Tutorial Drizzle Turso](https://orm.drizzle.team/docs/tutorials/drizzle-with-turso)

```sh
bun add drizzle
```

## JWT

Generar palabra secreta segura:

```sh
bun -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

src\routes\auth.route.ts

```ts
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

authRouter.post("/register", zValidator("json", registerSchema), async (c) => {
  const { email, password, username } = c.req.valid("json");

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (user) {
    return c.json({ message: "🚫 User already exists" }, 400);
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

  return c.json(newUser);
});

export default authRouter;
```

## Rutas protegidas

src/index.ts

```ts
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
```

src\routes\book.route.ts

```ts
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
```
