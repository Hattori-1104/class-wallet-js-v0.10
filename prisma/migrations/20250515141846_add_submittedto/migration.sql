/*
  Warnings:

  - Added the required column `submittedToId` to the `PurchaseReceiptSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `purchasereceiptsubmission` ADD COLUMN `submittedToId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `PurchaseReceiptSubmission` ADD CONSTRAINT `PurchaseReceiptSubmission_submittedToId_fkey` FOREIGN KEY (`submittedToId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
