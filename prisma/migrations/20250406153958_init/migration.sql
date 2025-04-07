/*
  Warnings:

  - You are about to drop the column `IsShared` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `product` DROP COLUMN `IsShared`,
    ADD COLUMN `isShared` BOOLEAN NOT NULL DEFAULT false;
