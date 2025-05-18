/*
  Warnings:

  - You are about to drop the column `isCanceled` on the `purchase` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `purchase` DROP COLUMN `isCanceled`,
    ADD COLUMN `canceled` BOOLEAN NOT NULL DEFAULT false;
