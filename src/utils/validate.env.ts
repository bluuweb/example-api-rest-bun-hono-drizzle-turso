import zod from "zod";

const envSchema = zod.object({
	TURSO_DATABASE_URL: zod
		.string()
		.min(1, "La URL de la base de datos no puede estar vacía")
		.url("Debe ser una URL válida de Turso")
		.refine((url) => url.startsWith("libsql://"), {
			message: "La URL de Turso debe comenzar con libsql://"
		}),
	TURSO_AUTH_TOKEN: zod.string().min(1, "El token de autenticación no puede estar vacío"),
	JWT_SECRET: zod
		.string({
			message: "EL JWT_SECRET es requerido para validar los JWT"
		})
		.base64({ message: "El JWT_SECRET no esta en Base64" }),
	PORT: zod.number().optional()
});

const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
	const issues = envValidation.error.issues;
	console.error("❌ Error en las variables de entorno:");
	issues.forEach(({ path, message }) => console.error(`➔ ${path.join(".")}: ${message}`));
	process.exit(1);
}

export const envs = envValidation.data;
