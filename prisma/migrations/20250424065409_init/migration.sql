/*
  Warnings:

  - You are about to drop the `purchasestatereceipt` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `purchasestatereceipt` DROP FOREIGN KEY `PurchaseStateReceipt_stateId_fkey`;

-- DropTable
DROP TABLE `purchasestatereceipt`;

-- CreateTable
CREATE TABLE `PurchaseStateReceiptSubmission` (
    `stateId` VARCHAR(191) NOT NULL,
    `receiptIndex` INTEGER NOT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`stateId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PurchaseStateReceiptSubmission` ADD CONSTRAINT `PurchaseStateReceiptSubmission_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `PurchaseState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
