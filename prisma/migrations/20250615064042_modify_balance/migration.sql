/*
  Warnings:

  - You are about to drop the column `balance` on the `purchase` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Purchase` DROP COLUMN `balance`,
    ADD COLUMN `balanced` BOOLEAN NOT NULL DEFAULT false;
