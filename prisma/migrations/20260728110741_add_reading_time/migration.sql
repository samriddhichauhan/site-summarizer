/*
  Warnings:

  - Added the required column `readingTime` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wordCount` to the `Note` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Note" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "readingTime" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Note" ("content", "createdAt", "id", "summary", "title", "url") SELECT "content", "createdAt", "id", "summary", "title", "url" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE UNIQUE INDEX "Note_url_key" ON "Note"("url");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
