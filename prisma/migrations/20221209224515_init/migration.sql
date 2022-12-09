/*
  Warnings:

  - You are about to drop the column `inStock` on the `FilmHistoryRecord` table. All the data in the column will be lost.
  - Added the required column `isInStock` to the `FilmHistoryRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `FilmHistoryRecord` DROP COLUMN `inStock`,
    ADD COLUMN `isInStock` BOOLEAN NOT NULL;
