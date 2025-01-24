CREATE TABLE `users_table` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text,
	`email` text NOT NULL,
	`password` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_email_unique` ON `users_table` (`email`);