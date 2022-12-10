/*
  Warnings:

  - You are about to drop the column `format` on the `Film` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Film` DROP COLUMN `format`,
    ADD COLUMN `filmFormatId` INTEGER NULL;

-- CreateTable
CREATE TABLE `FilmFormat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `FilmFormat_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Film` ADD CONSTRAINT `Film_filmFormatId_fkey` FOREIGN KEY (`filmFormatId`) REFERENCES `FilmFormat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
