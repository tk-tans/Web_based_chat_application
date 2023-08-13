/*
  Warnings:

  - Added the required column `lastMessage` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dark` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `lastMessage` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `dark` BOOLEAN NOT NULL;
