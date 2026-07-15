-- AddSearchText
-- 讓 Note 可以儲存整理後的可搜尋文字，供文字相似度與候選搜尋使用。
ALTER TABLE "Note" ADD COLUMN "searchText" TEXT;
