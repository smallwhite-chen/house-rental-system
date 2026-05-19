-- CreateEnum
CREATE TYPE "PropertyKind" AS ENUM ('WHOLE_BUILDING', 'MULTI_UNIT');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "kind" "PropertyKind" NOT NULL DEFAULT 'MULTI_UNIT';
