/*
  Warnings:

  - You are about to drop the column `created_At` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `created_At` on the `Website` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Website` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `Website` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Website" DROP CONSTRAINT "Website_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "created_At",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Website" DROP COLUMN "created_At",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "__diesel_schema_migrations" (
    "version" VARCHAR(50) NOT NULL,
    "run_on" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "__diesel_schema_migrations_pkey" PRIMARY KEY ("version")
);

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
