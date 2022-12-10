-- AlterTable
ALTER TABLE `Film` ADD COLUMN `filmTypeId` INTEGER NULL;

-- CreateTable
CREATE TABLE `FilmType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `FilmType_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Film` ADD CONSTRAINT `Film_filmTypeId_fkey` FOREIGN KEY (`filmTypeId`) REFERENCES `FilmType`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
