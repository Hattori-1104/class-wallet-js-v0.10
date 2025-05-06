-- CreateEnum
CREATE TYPE "Approval" AS ENUM ('Approved', 'Rejected', 'Pending');

-- CreateEnum
CREATE TYPE "State" AS ENUM ('Fulfilled', 'Pending');

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" INTEGER NOT NULL DEFAULT 0,
    "isBazaar" BOOLEAN NOT NULL DEFAULT false,
    "walletId" TEXT NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" INTEGER NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "plannedUsage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseState" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseStateRequest" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "byId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseStateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseStateAccountantApproval" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "byId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseStateAccountantApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseStateTeacherApproval" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "byId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseStateTeacherApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseStateGivenMoney" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseStateGivenMoney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseStateUsageReport" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "actualUsage" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseStateUsageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseStateReceiptSubmission" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "receiptIndex" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseStateReceiptSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseStateChangeReturn" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseStateChangeReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StudentToWallet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudentToWallet_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TeacherToWallet" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeacherToWallet_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PartStudents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartStudents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PartLeaders" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartLeaders_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_stateId_key" ON "Purchase"("stateId");

-- CreateIndex
CREATE INDEX "Purchase_partId_idx" ON "Purchase"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseStateRequest_stateId_key" ON "PurchaseStateRequest"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseStateAccountantApproval_stateId_key" ON "PurchaseStateAccountantApproval"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseStateTeacherApproval_stateId_key" ON "PurchaseStateTeacherApproval"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseStateGivenMoney_stateId_key" ON "PurchaseStateGivenMoney"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseStateUsageReport_stateId_key" ON "PurchaseStateUsageReport"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseStateReceiptSubmission_stateId_key" ON "PurchaseStateReceiptSubmission"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseStateChangeReturn_stateId_key" ON "PurchaseStateChangeReturn"("stateId");

-- CreateIndex
CREATE INDEX "_StudentToWallet_B_index" ON "_StudentToWallet"("B");

-- CreateIndex
CREATE INDEX "_TeacherToWallet_B_index" ON "_TeacherToWallet"("B");

-- CreateIndex
CREATE INDEX "_PartStudents_B_index" ON "_PartStudents"("B");

-- CreateIndex
CREATE INDEX "_PartLeaders_B_index" ON "_PartLeaders"("B");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "PurchaseState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateRequest" ADD CONSTRAINT "PurchaseStateRequest_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "PurchaseState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateRequest" ADD CONSTRAINT "PurchaseStateRequest_byId_fkey" FOREIGN KEY ("byId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateAccountantApproval" ADD CONSTRAINT "PurchaseStateAccountantApproval_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "PurchaseState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateAccountantApproval" ADD CONSTRAINT "PurchaseStateAccountantApproval_byId_fkey" FOREIGN KEY ("byId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateTeacherApproval" ADD CONSTRAINT "PurchaseStateTeacherApproval_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "PurchaseState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateTeacherApproval" ADD CONSTRAINT "PurchaseStateTeacherApproval_byId_fkey" FOREIGN KEY ("byId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateGivenMoney" ADD CONSTRAINT "PurchaseStateGivenMoney_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "PurchaseState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateUsageReport" ADD CONSTRAINT "PurchaseStateUsageReport_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "PurchaseState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateReceiptSubmission" ADD CONSTRAINT "PurchaseStateReceiptSubmission_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "PurchaseState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseStateChangeReturn" ADD CONSTRAINT "PurchaseStateChangeReturn_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "PurchaseState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentToWallet" ADD CONSTRAINT "_StudentToWallet_A_fkey" FOREIGN KEY ("A") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudentToWallet" ADD CONSTRAINT "_StudentToWallet_B_fkey" FOREIGN KEY ("B") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherToWallet" ADD CONSTRAINT "_TeacherToWallet_A_fkey" FOREIGN KEY ("A") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherToWallet" ADD CONSTRAINT "_TeacherToWallet_B_fkey" FOREIGN KEY ("B") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartStudents" ADD CONSTRAINT "_PartStudents_A_fkey" FOREIGN KEY ("A") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartStudents" ADD CONSTRAINT "_PartStudents_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartLeaders" ADD CONSTRAINT "_PartLeaders_A_fkey" FOREIGN KEY ("A") REFERENCES "Part"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartLeaders" ADD CONSTRAINT "_PartLeaders_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
