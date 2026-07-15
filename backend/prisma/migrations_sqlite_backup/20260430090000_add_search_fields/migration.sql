-- Add fields required by the Search API proposal.
ALTER TABLE "Note" ADD COLUMN "content" TEXT;
ALTER TABLE "Note" ADD COLUMN "category" TEXT;
ALTER TABLE "Note" ADD COLUMN "views" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Note" ADD COLUMN "likes" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Note_course_idx" ON "Note"("course");
CREATE INDEX "Note_category_idx" ON "Note"("category");
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");
