import { drizzle } from "drizzle-orm/libsql";
import { envs } from "../utils/validate.env";

export const db = drizzle({
	connection: {
		url: envs.TURSO_DATABASE_URL,
		authToken: envs.TURSO_AUTH_TOKEN
	}
});

export type DB = typeof db;
