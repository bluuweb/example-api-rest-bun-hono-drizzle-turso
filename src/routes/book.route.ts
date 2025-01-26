import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { envs } from "../utils/validate.env";

export const bookRouter = new Hono();

bookRouter.get(
	"/",
	jwt({
		secret: envs.JWT_SECRET
	}),
	async (c) => {
		const payload = c.get("jwtPayload");

		return c.json({ message: "👋 Hello from the book route", payload });
	}
);

export default bookRouter;
