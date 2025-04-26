/*
  Warnings:

  - The primary key for the `product` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE `purchaseitem` DROP FOREIGN KEY `PurchaseItem_productId_fkey`;

-- DropIndex
DROP INDEX `PurchaseItem_productId_fkey` ON `purchaseitem`;

-- AlterTable
ALTER TABLE `product` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `purchaseitem` MODIFY `productId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
