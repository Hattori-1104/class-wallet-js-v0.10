/*
  Warnings:

  - Added the required column `plannedUsage` to the `Purchase` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `purchase` ADD COLUMN `plannedUsage` INTEGER NOT NULL;
