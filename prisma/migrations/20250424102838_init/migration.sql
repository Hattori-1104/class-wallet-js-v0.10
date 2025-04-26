-- CreateTable
CREATE TABLE `PurchaseStateFishingReturned` (
    `stateId` VARCHAR(191) NOT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`stateId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PurchaseStateFishingReturned` ADD CONSTRAINT `PurchaseStateFishingReturned_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `PurchaseState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
