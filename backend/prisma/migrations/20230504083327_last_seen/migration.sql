/*
  Warnings:

  - Added the required column `last_seen` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `devices_online` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Member` ADD COLUMN `last_seen` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `devices_online` INTEGER NOT NULL;
