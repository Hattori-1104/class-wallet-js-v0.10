/*
  Warnings:

  - You are about to drop the column `actualUsage` on the `purchase` table. All the data in the column will be lost.
  - You are about to drop the column `receiptNumber` on the `purchase` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `purchase` DROP COLUMN `actualUsage`,
    DROP COLUMN `receiptNumber`;
