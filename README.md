# UniNote Search API MVP

UniNote Search API MVP 是一個以「學習筆記搜尋」為核心的全端專案。  
這一版不是要一次做完整的筆記平台，而是先把專案範圍縮小到 **Search API、Ranking、Filter、Pagination、Cache 與前端搜尋展示頁**，讓系統可以被實際操作、觀察與驗證。

目前專案的重點是：

- 使用者可以註冊、登入、建立筆記與收藏筆記
- 使用者可以透過 `/search` 搜尋筆記資料
- 搜尋結果可以依照相關度、最新、熱門排序
- 後端會計算每篇筆記的 Ranking Score
- 前端會顯示 scoreBreakdown，讓使用者知道為什麼這篇筆記排在前面
- 系統使用 in-memory cache 示範重複查詢時的 cache hit / miss

---

## 專案定位

原本 UniNote 可以延伸成完整的學習筆記平台，例如上傳檔案、社群互動、推薦系統、AI 問答、全文檢索與 RAG。

但本階段先不把範圍拉太大，而是聚焦在一個可以展示、可以測試、可以解釋的核心問題：

> 使用者輸入查詢條件後，系統能不能找出相關筆記，並用一套可解釋的 Ranking 規則排序？

因此本專案目前定位為：

```txt
UniNote Search API MVP
= 筆記資料管理
+ 搜尋條件處理
+ 候選資料召回
+ Rule-based Ranking
+ 分數明細展示
+ Cache Demo
```

---

## 為什麼先做 Search API MVP

如果一開始就做完整平台，會同時碰到太多問題：

- 權限系統
- 檔案解析
- 大型資料庫
- 搜尋引擎
- 推薦系統
- AI 問答
- RAG
- 高併發快取

這樣容易變成系統看起來很大，但核心邏輯說不清楚。

所以目前先做 Search API MVP，目標是先回答三個問題：

1. 使用者輸入關鍵字後，系統能不能找到相關筆記？
2. 系統能不能用一套明確規則排序？
3. 排序結果能不能被使用者或工程師理解與驗證？

---

## 技術棧

### Frontend

- Vue 3
- TypeScript
- Vite
- Vue Router
- axios
- CSS scoped style + global design system

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- in-memory cache

---

## 目前功能

### Auth

- 使用者註冊
- 使用者登入
- JWT 驗證
- 前端登入保護
- 登出功能

### Notes

- 新增筆記
- 筆記列表
- 筆記詳情
- 刪除筆記
- 筆記欄位包含 title、description、content、course、category、tags、views、likes、favorites、createdAt
- 支援 PUBLIC / PRIVATE 可見性

### Favorites

- 收藏筆記
- 取消收藏
- 查看我的收藏

### Search

提供搜尋 API：

```txt
GET /search
```

支援 query params：

```txt
q=關鍵字
course=課程
category=分類
tag=標籤
sort=relevance | latest | popular
page=1
pageSize=10
```

範例：

```txt
GET /search?q=工程數學&sort=relevance&page=1&pageSize=10
GET /search?q=自控&sort=relevance
GET /search?q=期中考&tag=考古題
GET /search?course=熱力學&sort=popular
```

---

## Search API 流程

目前搜尋流程設計如下：

```txt
使用者輸入 query / filters
↓
1. Normalize Params：整理 q、course、category、tag、sort、page
↓
2. Query Expansion：處理簡單同義詞，例如「自控」對應「自動控制、控制系統」
↓
3. Cache Check：確認同條件搜尋是否已經有快取
↓
4. Candidate Retrieval：用 SQL contains 召回候選筆記
↓
5. Feature Calculation：計算 title、course、tag、category、description、content 等分數
↓
6. Ranking Scoring：計算 relevance、quality、popularity、recency
↓
7. Sorting：依 relevance / latest / popular 排序
↓
8. Pagination：排序後才分頁
↓
9. API Response：回傳 data、meta、score、scoreDetail
↓
10. Cache Set：將搜尋結果暫存 60 秒
```

---

## Ranking 設計

本專案目前使用 **rule-based ranking**。  
這一版不先做 AI ranking 或機器學習排序，原因是 rule-based scoring 比較容易實作、debug，也比較容易在展示時說明。

### Feature 分數

每篇筆記會先被轉成多個 0 到 100 的 feature：

| Feature | 說明 |
|---|---|
| `titleMatch` | 標題與查詢詞的符合程度 |
| `courseMatch` | 課程名稱與查詢詞的符合程度 |
| `categoryMatch` | 分類與查詢詞的符合程度 |
| `tagMatch` | 標籤與查詢詞的符合程度 |
| `descriptionMatch` | 描述與查詢詞的符合程度 |
| `contentMatch` | 內容與查詢詞的符合程度 |
| `quality` | 內容完整度，例如是否有描述、內容、課程、分類、標籤、檔案 |
| `popularity` | 熱門度，例如 views、likes、favorites |
| `recency` | 新鮮度，依 createdAt 計算 |

### Relevance Score

相關性分數會綜合多個文字欄位：

```txt
relevance =
titleMatch * 0.32
+ tagMatch * 0.20
+ courseMatch * 0.18
+ categoryMatch * 0.10
+ descriptionMatch * 0.10
+ contentMatch * 0.10
```

設計理由：

- title 最能代表筆記主題，所以權重最高
- tag 是人工分類訊號，對「期中考、考古題、公式整理」很有幫助
- course 對學習筆記搜尋很重要
- category、description、content 作為補充判斷

### Total Score

最後總分：

```txt
total =
relevance * 0.55
+ quality * 0.15
+ popularity * 0.20
+ recency * 0.10
```

設計理由：

- 搜尋結果最重要的是相關性，所以 relevance 最高
- quality 避免空內容或低品質資料排太前面
- popularity 反映使用者互動
- recency 讓新資料有機會曝光，但不讓新資料直接壓過相關性

---

## API Response 範例

```json
{
  "data": [
    {
      "id": 1,
      "title": "工程數學（一）期中考重點整理",
      "course": "工程數學",
      "category": "考試整理",
      "score": 82.45,
      "scoreDetail": {
        "titleMatch": 85,
        "courseMatch": 100,
        "categoryMatch": 0,
        "tagMatch": 70,
        "descriptionMatch": 70,
        "contentMatch": 45,
        "relevance": 74.4,
        "quality": 91,
        "popularity": 48.6,
        "recency": 65,
        "total": 70.86
      }
    }
  ],
  "meta": {
    "q": "工程數學",
    "course": "",
    "category": "",
    "tag": "",
    "sort": "relevance",
    "page": 1,
    "pageSize": 10,
    "total": 32,
    "totalPages": 4,
    "cache": "miss",
    "candidateLimit": 1000
  }
}
```

---

## Cache 設計

目前使用 in-memory cache，TTL 為 60 秒。

目的：

- 示範熱門搜尋結果快取概念
- 減少短時間內重複查詢
- 不依賴 Redis，方便本機展示

目前 cache 流程：

```txt
搜尋條件產生 cache key
↓
如果 cache hit：直接回傳快取資料
↓
如果 cache miss：查資料庫、算分、排序、分頁
↓
把結果存進 cache，TTL 60 秒
```

---

## 專案結構

```txt
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    index.ts
    lib/
      prisma.ts
    middlewares/
      authMiddleware.ts
    routes/
      authRoutes.ts
      noteRoutes.ts
      favoriteRoutes.ts
      searchRoutes.ts
    services/
      authService.ts
      searchService.ts
    utils/
      ranking.ts
      cache.ts
    types/
      express/
        index.d.ts

frontend/
  src/
    main.ts
    App.vue
    styles.css
    router/
      index.ts
    services/
      api.ts
    types/
      note.ts
    components/
      Navbar.vue
      NoteCard.vue
    pages/
      HomePage.vue
      LoginPage.vue
      RegisterPage.vue
      NotesPage.vue
      SearchPage.vue
      CreateNotePage.vue
      FavoritesPage.vue
      NoteDetailPage.vue
```

---

## 本機啟動方式

### 建議環境

本專案建議使用 Node 22 LTS。  
目前已提供 `.nvmrc`，使用 nvm 的話可以在專案根目錄執行：

```bash
nvm install
nvm use
node -v
```

建議看到的版本是：

```txt
v22.x.x
```

不建議使用 Node 24 執行 Prisma migration。  
在部分環境中，Node 24 可能讓 `npx prisma migrate status` 出現 `Schema engine error`。

### 1. Backend

```bash
cd backend
npm install
```

建立 `.env`：

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://uninote:uninote_password@localhost:55432/uninote_dev?schema=public"
TEST_DATABASE_URL="postgresql://uninote:uninote_password@localhost:55432/uninote_test?schema=public"
JWT_SECRET="dev_only_change_me"
FRONTEND_URL="http://localhost:5173"
MAX_UPLOAD_MB=10
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
```

也可以參考：

```txt
backend/.env.example
```

`JWT_SECRET` 在本機可以使用測試值，但 production 一定要換成長且隨機的 secret，不可以使用 README 範例值或 `dev_secret`。

### PostgreSQL Local Environment

此 PostgreSQL schema branch 使用：

```prisma
provider = "postgresql"
```

SQLite migration history 已保留在備份資料夾；本分支的 Prisma runtime、seed 與 migration 目標是 PostgreSQL。Integration tests 仍待下一階段遷移到 PostgreSQL test DB。

PostgreSQL dev/test database 規劃：

```txt
dev DB:  uninote_dev
test DB: uninote_test
```

啟動 PostgreSQL container：

```bash
docker compose up -d
```

如果人在 `backend/` 目錄，也可以使用：

```bash
npm run db:pg:up
```

查看 container 狀態：

```bash
docker compose ps
```

查看 PostgreSQL logs：

```bash
docker compose logs -f postgres
```

或在 `backend/` 目錄使用：

```bash
npm run db:pg:logs
```

停止 container：

```bash
docker compose down
```

或在 `backend/` 目錄使用：

```bash
npm run db:pg:down
```

建立 test database：

```bash
docker exec -it uninote-postgres psql -U uninote -d uninote_dev -c "CREATE DATABASE uninote_test;"
```

如果 database 已存在，PostgreSQL 會回報已存在錯誤；這代表不需要重建。

本機 `.env` 使用：

```env
DATABASE_URL="postgresql://uninote:uninote_password@localhost:55432/uninote_dev?schema=public"
TEST_DATABASE_URL="postgresql://uninote:uninote_password@localhost:55432/uninote_test?schema=public"
```

執行 Prisma：

```bash
npx prisma migrate status
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```

Backend 預設：

```txt
http://localhost:3000
```

測試 API：

```txt
http://localhost:3000/
http://localhost:3000/search?q=工程數學
```

`/search`、`/notes`、`/favorites` 等資料 API 需要登入後帶上 JWT：

```txt
Authorization: Bearer <token>
```

### 2. Frontend

開另一個 terminal：

```bash
cd frontend
npm install
npm run dev
```

Frontend 預設：

```txt
http://localhost:5173
```

如果前端部署到不同網址，backend 的 `FRONTEND_URL` 必須設定成該網址，否則瀏覽器會被 CORS 白名單擋下。

---

## Security Hardening

目前 backend 已加入基本 production hardening：

- 使用 `helmet` 設定常見 HTTP security headers
- 關閉 Express `x-powered-by` fingerprint
- CORS 不再全開，只允許 `FRONTEND_URL`
- development 若未設定 `FRONTEND_URL`，預設允許 `http://localhost:5173`
- 一般 API rate limit 預設為 15 分鐘 300 次，可用 `API_RATE_LIMIT_WINDOW_MS`、`API_RATE_LIMIT_MAX` 調整
- auth API rate limit 預設為 15 分鐘 20 次，可用 `AUTH_RATE_LIMIT_WINDOW_MS`、`AUTH_RATE_LIMIT_MAX` 調整
- 未匹配路由統一回傳 `{ "error": "Route not found" }`
- 全域錯誤處理在 production 不回傳 stack trace

`FRONTEND_URL` 必須設定成實際前端網址。Production 若沒有設定正確來源，瀏覽器會因 CORS 白名單拒絕跨來源請求。

### 筆記可見性模式

目前系統採用「共享筆記庫 + 私人筆記」模式：

| Visibility | 說明 |
|---|---|
| `PUBLIC` | 公開筆記，所有登入使用者都可以搜尋、查看詳情與收藏 |
| `PRIVATE` | 私人筆記，只有作者本人可以搜尋、查看詳情與收藏 |

刪除規則：

- 不論 `PUBLIC` 或 `PRIVATE`，只有作者本人可以刪除自己的筆記。
- 非作者不能刪除公開筆記。
- 其他使用者不能透過 id 查看私人筆記，會得到 `404`。

搜尋預設範圍：

```txt
scope=all
= 目前使用者自己的筆記
+ 所有 PUBLIC 筆記
```

可用 scope：

```txt
GET /notes?scope=all
GET /notes?scope=mine
GET /notes?scope=public

GET /search?scope=all
GET /search?scope=mine
GET /search?scope=public
```

新增筆記與 PDF 匯入若沒有指定 visibility，預設為 `PUBLIC`，因此 seed 與舊資料會成為共享資源。

Production 環境至少需要設定：

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>?schema=public"
JWT_SECRET="replace_with_a_long_random_secret"
FRONTEND_URL="https://your-frontend-domain.com"
MAX_UPLOAD_MB=10
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
```

注意：

- production 不可以使用 `dev_secret`、`dev_only_change_me` 或任何範例 secret。
- production 不建議使用 `prisma migrate dev`，正式部署應使用 `prisma migrate deploy`。
- seed 資料只適合本機展示，不應自動跑到 production。

Production migration 指令：

```bash
npm run prisma:deploy
```

---

## 測試帳號

Seed 會建立測試帳號：

```txt
email: test@uninotes.com
password: 123456
```

---

## Demo 操作流程

### 1. 登入

進入：

```txt
/login
```

使用測試帳號登入。

### 2. 查看筆記列表

進入：

```txt
/notes
```

確認 seed 筆記資料有成功建立。

### 3. 測試搜尋

進入：

```txt
/search
```

建議測試：

```txt
工程數學
微積分
自控
熱力學
材料力學
流體力學
機械設計
期中考
考古題
```

### 4. 測試排序

在 `/search` 頁面切換：

```txt
相關度
最新
熱門
```

### 5. 測試 Ranking 明細

展開搜尋結果中的 Ranking 明細，觀察：

```txt
Relevance
Quality
Popularity
Freshness
Title
Course
Tag
Category
Description
Content
Text Similarity
```

### 6. 測試 PDF 匯入

進入：

```txt
/create
```

在「匯入文字型 PDF」區塊選擇可選取文字的 PDF，填入 course、category、tags 後送出。

成功後進入 `/search`，搜尋 PDF 內容中的關鍵字，確認該 PDF Note 可以被搜尋到，並出現在 Ranking 明細中。

目前只支援文字型 PDF。掃描型 PDF 需要 OCR，本版本暫不支援。

API：

```txt
POST /notes/upload-pdf
Content-Type: multipart/form-data

file: PDF 檔案
title: 筆記標題，可選
course: 課程名稱，可選
category: 分類，可選
tags: 標籤，可選
```

### 7. 測試 Cache

同一組條件連續搜尋兩次：

```txt
第一次：cache miss
第二次：cache hit
```

---

## Acceptance Criteria

這一段是用來確認目前功能是否真的完成。  
每個情境都應該可以在前端操作，或用 API 直接測試。

| 編號 | 使用情境 | 操作 | 預期結果 | 狀態 |
|---|---|---|---|---|
| AC-01 | 使用者可以登入系統 | 使用 `test@uninotes.com / 123456` 登入 | 登入成功後進入筆記或搜尋頁 | 待測 |
| AC-02 | 使用者可以看到筆記資料 | 進入 `/notes` | 顯示 seed 筆記列表 | 待測 |
| AC-03 | 使用者可以搜尋課程筆記 | 在 `/search` 輸入「工程數學」 | 出現工程數學相關筆記 | 待測 |
| AC-04 | 系統可以處理別名搜尋 | 搜尋「自控」 | 可以找到自動控制、控制系統相關資料 | 待測 |
| AC-05 | 系統可以依 relevance 排序 | sort 選擇「相關度」 | score 較高的筆記排在前面 | 待測 |
| AC-06 | 系統可以依 latest 排序 | sort 選擇「最新」 | createdAt 較新的資料排在前面 | 待測 |
| AC-07 | 系統可以依 popular 排序 | sort 選擇「熱門」 | views、likes、favorites 較高的資料較前面 | 待測 |
| AC-08 | 使用者可以展開 Ranking 明細 | 點開 scoreBreakdown | 顯示 relevance、quality、popularity、recency 與各欄位 match 分數 | 待測 |
| AC-09 | 系統可以處理無結果搜尋 | 搜尋不存在的亂碼 | 顯示查無結果，不應出現系統錯誤 | 待測 |
| AC-10 | 系統可以展示 cache | 同條件搜尋兩次 | 第一次 miss，第二次 hit | 待測 |
| AC-11 | 使用者可以新增筆記 | 進入 `/create` 建立筆記 | 新筆記出現在 `/notes`，也能被 `/search` 找到 | 待測 |
| AC-12 | 使用者可以收藏筆記 | 點擊收藏 | 該筆記出現在 `/favorites` | 待測 |

---

## 人工測試 Query

| Query | 主要測試目標 |
|---|---|
| 工程數學 | 課程名稱與內容相關性 |
| 微積分 | 中英文與基礎課程資料 |
| 自控 | 同義詞 mapping：自控、自動控制、控制系統 |
| 熱力學 | 熱流領域課程 |
| 流體力學 | 熱流與課程搜尋 |
| 材料力學 | 力學課程搜尋 |
| 機械設計 | 機設相關資料 |
| 期中考 | tag / category 搜尋 |
| 考古題 | 考試整理資料搜尋 |
| Python | 程式與資料類課程搜尋 |
| 半導體 | 跨領域課程搜尋 |
| 專題 | 專題與實驗資料搜尋 |
| 公式整理 | tag 或 description 命中 |
| 實驗報告 | category 搜尋 |
| 熱傳學 | 熱流細分課程 |
| 控制系統 | 控制相關資料 |
| 工場實習 | 製造與實習課程 |
| 有限元素 | 進階工程分析 |
| 機器學習 | 跨資工與理工課程 |
| 電工學 | 電學相關課程 |

---

## 目前限制

目前版本仍是 MVP，有幾個限制：

- 搜尋使用 SQL contains，不是正式全文檢索引擎
- Ranking 是 rule-based scoring，不是機器學習排序
- Cache 使用 in-memory，server 重啟後會消失
- PostgreSQL branch 尚未完成 integration tests 遷移，下一階段會改用 PostgreSQL test DB
- 尚未建立 SearchEvent、ClickEvent、DownloadEvent 等行為紀錄
- 尚未做 A/B Testing 或 CTR 評估
- PDF 解析僅支援文字型 PDF，尚未支援掃描型 PDF / OCR
- 尚未支援 Vector Search 或 RAG

---

## 後續可延伸方向

### V2：搜尋精準度提升

- PostgreSQL Full-text Search
- BM25
- 同義詞表
- 拼字修正
- 更完整的 Query Understanding

### V3：搜尋行為紀錄

- SearchEvent
- ClickEvent
- FavoriteEvent
- DownloadEvent
- Zero Result Rate
- Top 1 CTR
- Search-to-Favorite Rate

### V4：語意搜尋與個人化

- Embedding
- Vector Search
- RAG
- Personalized Ranking
- A/B Testing

---

## 開發者說明

目前專案的核心檔案：

| 檔案 | 功能 |
|---|---|
| `backend/src/services/searchService.ts` | 搜尋主流程，包含 query normalize、candidate retrieval、cache、排序、分頁 |
| `backend/src/utils/ranking.ts` | Ranking 分數計算與 scoreBreakdown |
| `backend/src/utils/cache.ts` | in-memory cache |
| `backend/src/routes/searchRoutes.ts` | `/search` API route |
| `frontend/src/pages/SearchPage.vue` | 搜尋展示頁與 Ranking 視覺化 |
| `frontend/src/types/note.ts` | 前端 Note、SearchMeta、ScoreDetail 型別 |

---

## 專案目前目標

本階段的目標不是做出最完整的 AI 搜尋系統，而是先完成一套：

```txt
可執行
可展示
可解釋
可驗證
可逐步擴充
```

的 Search API MVP。

完成這一版後，後續才會考慮導入更正式的 full-text search、vector search、行為紀錄與學習式排序。
