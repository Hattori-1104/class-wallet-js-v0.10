/*
  Warnings:

  - You are about to drop the column `purchasedAt` on the `purchase` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `purchase` DROP COLUMN `purchasedAt`,
    ADD COLUMN `reportedAt` DATETIME(3) NULL;
