/*
  Warnings:

  - Added the required column `removed` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Member` ADD COLUMN `removed` BOOLEAN NOT NULL;
