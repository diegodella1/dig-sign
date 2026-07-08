CREATE TABLE `layout_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `layout_presets_slug_unique` ON `layout_presets` (`slug`);--> statement-breakpoint
CREATE TABLE `screens` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`layout_preset_id` text,
	`fallback_playlist_id` text,
	`timezone` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`layout_preset_id`) REFERENCES `layout_presets`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `screens_slug_unique` ON `screens` (`slug`);--> statement-breakpoint
CREATE INDEX `screens_status_idx` ON `screens` (`status`);--> statement-breakpoint
CREATE TABLE `content_playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'ready' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_playlist_items` (
	`id` text PRIMARY KEY NOT NULL,
	`playlist_id` text NOT NULL,
	`asset_id` text,
	`slide_id` text,
	`sort_order` integer NOT NULL,
	`duration_seconds` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`playlist_id`) REFERENCES `content_playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`slide_id`) REFERENCES `slide_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `content_playlist_items_playlist_order_idx` ON `content_playlist_items` (`playlist_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `playlist_assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`screen_id` text NOT NULL,
	`playlist_id` text NOT NULL,
	`start_date` text,
	`end_date` text,
	`weekdays` text DEFAULT '[]' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`screen_id`) REFERENCES `screens`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`playlist_id`) REFERENCES `content_playlists`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `playlist_assignments_screen_status_idx` ON `playlist_assignments` (`screen_id`,`status`);
