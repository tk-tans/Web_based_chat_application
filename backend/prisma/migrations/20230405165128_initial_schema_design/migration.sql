-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(100) NOT NULL,
    `username` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `password` VARCHAR(100) NOT NULL,
    `picture` VARCHAR(100) NULL,
    `online` BOOLEAN NOT NULL,
    `last_online` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Chat` (
    `id` VARCHAR(100) NOT NULL,
    `dm` BOOLEAN NOT NULL,
    `name` VARCHAR(100) NULL,
    `picture` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Member` (
    `id` VARCHAR(100) NOT NULL,
    `uid` VARCHAR(100) NOT NULL,
    `cid` VARCHAR(100) NOT NULL,
    `admin` BOOLEAN NOT NULL,

    UNIQUE INDEX `Member_uid_cid_key`(`uid`, `cid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `mid` VARCHAR(100) NOT NULL,
    `content` VARCHAR(100) NULL,
    `filePath` VARCHAR(100) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_cid_fkey` FOREIGN KEY (`cid`) REFERENCES `Chat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_mid_fkey` FOREIGN KEY (`mid`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
