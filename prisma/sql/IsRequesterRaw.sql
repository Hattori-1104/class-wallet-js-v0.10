-- Active: 1749879791721@@127.0.0.1@3306@class-wallet-js

SELECT EXISTS (
  SELECT 1
  FROM `Purchase`
  WHERE `Purchase`.id = ? AND `Purchase`.`requestedById` = ?
) AS `IsRequesterFlag`;