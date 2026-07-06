-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('ANIME', 'MANGA');

-- CreateEnum
CREATE TYPE "MediaFormat" AS ENUM ('TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC', 'MANGA', 'NOVEL', 'ONE_SHOT');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('FINISHED', 'RELEASING', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS');

-- CreateEnum
CREATE TYPE "Genre" AS ENUM ('ACTION', 'ADVENTURE', 'COMEDY', 'DRAMA', 'FANTASY', 'HORROR', 'MAGICAL_GIRL', 'MECHA', 'MUSIC', 'MYSTERY', 'PSYCHOLOGICAL', 'ROMANCE', 'SCI_FI', 'SLICE_OF_LIFE', 'SPORTS', 'SUPERNATURAL', 'THRILLER');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaList" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaListItem" (
    "id" UUID NOT NULL,
    "mediaListId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" UUID NOT NULL,
    "malId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "MediaType" NOT NULL DEFAULT 'ANIME',
    "format" "MediaFormat" NOT NULL DEFAULT 'TV',
    "status" "MediaStatus" NOT NULL DEFAULT 'RELEASING',
    "bannerImgURL" TEXT,
    "avgScore" DOUBLE PRECISION,
    "malAvgScore" DOUBLE PRECISION,
    "releaseYear" INTEGER NOT NULL,
    "genre" "Genre" NOT NULL,
    "createAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MediaListItem_mediaListId_mediaId_key" ON "MediaListItem"("mediaListId", "mediaId");

-- AddForeignKey
ALTER TABLE "MediaList" ADD CONSTRAINT "MediaList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaListItem" ADD CONSTRAINT "MediaListItem_mediaListId_fkey" FOREIGN KEY ("mediaListId") REFERENCES "MediaList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaListItem" ADD CONSTRAINT "MediaListItem_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
