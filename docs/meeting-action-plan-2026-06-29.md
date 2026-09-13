# 2026-06-29 業師會議行動清單

> 依會議逐字稿整理。原始轉錄有大量辨識錯字，因此只採納能由上下文與現有程式互相驗證的技術方向。

## 專案主軸

先完成一個可操作、可測試、可解釋的學習筆記搜尋 MVP：使用者上傳或建立文字筆記，系統建立可搜尋文字，以關鍵字、篩選與 ranking 找出最相關文件。

現階段不要加入 RAG、向量資料庫或大型 AI 功能。先把前端、後端、資料庫、PDF 文字擷取與搜尋 ranking 的完整流程穩定下來。

## 已具備

- Vue 前端與 Express API 可完成 production build。
- 註冊、登入、筆記建立／刪除、收藏及 PUBLIC／PRIVATE 權限。
- 關鍵字、課程、分類、標籤、scope、排序及分頁搜尋。
- PDF 文字型檔案解析；掃描型 PDF 會明確提示尚未支援 OCR。
- Rule-based ranking、token overlap similarity、分數明細及 60 秒 cache。
- API 存活檢查 `/health/live` 與資料庫就緒檢查 `/health/ready`。
- PostgreSQL migration、seed 與 integration tests。

## 現在依序完成

1. 啟動 Docker Desktop，再執行 `docker compose up -d`。
2. 在 `backend/` 執行 `npm test`，確認資料庫整合測試全部通過。
3. 執行 migration 與 seed，分別啟動 backend、frontend，走一次人工驗收流程。
4. 準備至少 20 至 50 筆涵蓋不同課程、標籤和關鍵字的示範資料。
5. 建立一份固定搜尋評估表：每個 query 先人工標記預期前 3 名，再比較實際排序。
6. 根據評估結果調整 ranking 權重，記錄每次調整前後的 Precision@3 或命中率。
7. 錄製 2 至 3 分鐘 demo，並將專案推到 GitHub，讓履歷可以連到實際成果。

## 人工驗收情境

- 新使用者可註冊、登入與登出。
- 建立一篇 PUBLIC 與一篇 PRIVATE 筆記。
- 另一帳號只能搜尋及查看 PUBLIC 筆記。
- 搜尋「自控」可召回「自動控制」或「控制系統」相關筆記。
- course、category、tag、scope、sort 與分頁可正確組合。
- 同一查詢第二次回傳 `meta.cache = hit`。
- 文字型 PDF 可建立筆記；掃描 PDF 顯示不支援 OCR。
- 收藏、取消收藏、刪除本人筆記與帳號設定可正常操作。
- `/health/live` 回 200；資料庫運作時 `/health/ready` 回 200。

## 下一版再評估

- PaddleOCR（會議轉錄為類似「PedOSR」）處理掃描型 PDF。
- PostgreSQL 原生全文搜尋或專用搜尋引擎，以取代資料量擴大後的 `contains` candidate retrieval。
- 更正式的離線 ranking evaluation、自動化效能測試與 Redis cache。

