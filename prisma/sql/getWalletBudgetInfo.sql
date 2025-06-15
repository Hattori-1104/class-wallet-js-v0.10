-- Active: 1749879791721@@127.0.0.1@3306@class-wallet-js
SELECT
  wallet.id as walletId,
  wallet.name as walletName,
  part.id as partId,
  part.name as partName,
  part.budget as partBudget,
  IFNULL(plannedUsage, 0) AS plannedUsage,
  IFNULL(actualUsage, 0) as actualUsage
FROM
  wallet
  INNER JOIN part on wallet.id = part.walletId
  LEFT JOIN (
    SELECT
      purchase.partId,
      SUM(purchase.plannedUsage) AS plannedUsage
    FROM
      purchase
      LEFT JOIN purchasereceiptsubmission ON purchase.id = purchasereceiptsubmission.purchaseId
      LEFT JOIN purchaseaccountantapproval ON purchase.id = purchaseaccountantapproval.purchaseId
      LEFT JOIN purchaseteacherapproval ON purchase.id = purchaseteacherapproval.purchaseId
    WHERE
      purchasereceiptsubmission.purchaseId IS NULL
      AND canceled IS FALSE
      AND purchaseaccountantapproval.approved IS NOT FALSE
      AND purchaseteacherapproval.approved IS NOT FALSE
    GROUP BY
      partId
  ) AS plannedUsageTable ON part.id = plannedUsageTable.partId
  LEFT JOIN (
    SELECT
      purchase.partId,
      SUM(purchasecompletion.actualUsage) AS actualUsage
    FROM
      purchase
      LEFT JOIN purchasecompletion ON purchase.id = purchasecompletion.purchaseId
    WHERE
      purchasecompletion.purchaseId IS NOT NULL
      AND canceled IS FALSE
    GROUP BY
      partId
  ) AS actualUsageTable ON part.id = actualUsageTable.partId
WHERE
  wallet.id = ?
ORDER BY
  wallet.name DESC;