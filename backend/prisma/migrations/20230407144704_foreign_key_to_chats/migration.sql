/*
  Warnings:

  - Added the required column `cid` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Message` ADD COLUMN `cid` VARCHAR(100) NOT NULL;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_cid_fkey` FOREIGN KEY (`cid`) REFERENCES `Chat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
