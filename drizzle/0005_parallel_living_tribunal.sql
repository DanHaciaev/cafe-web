ALTER TABLE `order_items` ADD `refunded_quantity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `refunded_amount` real DEFAULT 0 NOT NULL;