CREATE TABLE `refund_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`refund_id` integer NOT NULL,
	`order_item_id` integer NOT NULL,
	`quantity` integer NOT NULL,
	`amount` real NOT NULL,
	FOREIGN KEY (`refund_id`) REFERENCES `refunds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`amount` real NOT NULL,
	`reason` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
