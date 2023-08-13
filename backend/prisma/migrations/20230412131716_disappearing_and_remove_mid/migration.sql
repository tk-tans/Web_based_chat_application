/*
  Warnings:

  - The primary key for the `Member` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `mid` on the `Message` table. All the data in the column will be lost.
  - Added the required column `disappearing_mode` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disappearing` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `uid` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Message` DROP FOREIGN KEY `Message_mid_fkey`;

-- AlterTable
ALTER TABLE `Chat` ADD COLUMN `disappearing_mode` BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE `Member` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`uid`, `cid`);

-- AlterTable
ALTER TABLE `Message` DROP COLUMN `mid`,
    ADD COLUMN `disappearing` BOOLEAN NOT NULL,
    ADD COLUMN `uid` VARCHAR(100) NOT NULL;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_uid_cid_fkey` FOREIGN KEY (`uid`, `cid`) REFERENCES `Member`(`uid`, `cid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
