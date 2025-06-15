-- Active: 1749879791721@@127.0.0.1@3306@class-wallet-js
SELECT
  `Part`.id,
  `Part`.name,
  IFNULL(`plannedUsage`, 0) as `plannedUsage`,
  IFNULL(`actualUsage`, 0) as `actualUsage`
FROM `Part`
  LEFT JOIN (
    SELECT
      `Purchase`.`partId`,
      SUM(`Purchase`.`plannedUsage`) AS `plannedUsage`
    FROM
      `Purchase`
      LEFT JOIN `PurchaseReceiptSubmission` ON `Purchase`.id = `PurchaseReceiptSubmission`.`purchaseId`
      LEFT JOIN `PurchaseAccountantApproval` ON `Purchase`.id = `PurchaseAccountantApproval`.`purchaseId`
      LEFT JOIN `PurchaseTeacherApproval` ON `Purchase`.id = `PurchaseTeacherApproval`.`purchaseId`
    WHERE
      `PurchaseReceiptSubmission`.`purchaseId` IS NULL
      AND `canceled` IS FALSE
      AND `PurchaseAccountantApproval`.`approved` IS NOT FALSE
      AND `PurchaseTeacherApproval`.`approved` IS NOT FALSE
    GROUP BY
      `partId`
  ) AS `PlannedUsageTable` ON `Part`.id = `PlannedUsageTable`.`partId`
  LEFT JOIN (
    SELECT
      `Purchase`.`partId`,
      SUM(`PurchaseCompletion`.`actualUsage`) AS `actualUsage`
    FROM
      `Purchase`
      LEFT JOIN `PurchaseCompletion` ON `Purchase`.id = `PurchaseCompletion`.`purchaseId`
    WHERE
      `PurchaseCompletion`.`purchaseId` IS NOT NULL
      AND `canceled` IS FALSE
    GROUP BY
      `partId`
  ) AS `ActualUsageTable` ON `Part`.id = `ActualUsageTable`.`partId`
WHERE `Part`.id = ?;
