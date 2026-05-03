# UniNote Search API

本專案以學生筆記資料為主，設計一套具備資料處理、搜尋、排序、篩選與基礎快取功能的 Search API 系統。

此版本不實作高併發，也不使用 Redis。專案重點放在 Search、Ranking、Filter、Pagination 與可展示的前端搜尋介面。

## 專案定位

原本的 UniNote 是筆記平台，包含註冊、登入、筆記新增、筆記列表、收藏等功能。

本次升級後，專案核心改為：

- `/notes`：負責筆記資料管理
- `/search`：負責搜尋、排序、篩選、分頁與 Ranking score
- 前端 `/search`：展示 Search API 的查詢結果與分數細節

## 技術棧

### Frontend

- Vue 3
- TypeScript
- Vite
- Vue Router
- axios

### Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- SQLite

## 核心功能

### Data Processing

筆記資料包含：

- title：標題
- description：描述
- content：可搜尋內容
- course：課程
- category：分類
- tags：標籤
- views：觀看數
- likes：按讚數
- favorites：收藏資料
- createdAt：建立時間

### Search

提供獨立搜尋接口：

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
GET /search?q=微積分&sort=relevance&page=1&pageSize=10
```

### Ranking

系統會根據筆記資料計算相關性分數：

```txt
Score = titleMatch * 5 + descriptionMatch * 2 + contentMatch * 2 + popularity * 3 + recency * 1
```

其中：

- titleMatch：標題是否命中關鍵字
- descriptionMatch：描述是否命中關鍵字
- contentMatch：內容是否命中關鍵字
- popularity：views、likes、favorites 綜合熱門度
- recency：30 天內資料的新近度

### Filter

支援：

- 課程篩選
- 分類篩選
- 標籤篩選

### Sort

支援：

- relevance：依 Ranking score 排序
- latest：依建立時間排序
- popular：依熱門度排序

### Pagination

回傳格式：

```json
{
  "data": [],
  "meta": {
    "q": "微積分",
    "course": "",
    "category": "",
    "tag": "",
    "sort": "relevance",
    "page": 1,
    "pageSize": 10,
    "total": 10,
    "totalPages": 1,
    "cache": "miss"
  }
}
```

### Cache

目前使用 in-memory cache，TTL 為 60 秒。

目的：

- 示範熱門搜尋結果快取概念
- 減少短時間內重複查詢
- 不依賴 Redis，方便專題展示

## 專案結構

```txt
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    index.ts
    routes/
      noteRoutes.ts
      searchRoutes.ts
    services/
      searchService.ts
    utils/
      ranking.ts
      cache.ts

frontend/
  src/
    pages/
      SearchPage.vue
      CreateNotePage.vue
      NotesPage.vue
    components/
      Navbar.vue
    types/
      note.ts
```

## 本機啟動方式

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name add-search-fields
npm run seed
npm run dev
```

Backend 預設：

```txt
http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend 預設：

```txt
http://localhost:5173
```

## 測試帳號

Seed 會建立測試帳號：

```txt
email: test@uninotes.com
password: 123456
```

## Demo 頁面

登入後進入：

```txt
/search
```

可以測試：

- 關鍵字搜尋
- 課程篩選
- 分類篩選
- 標籤篩選
- 相關性排序
- 最新排序
- 熱門排序
- Ranking score 明細
- Cache hit / miss

## 後續可延伸

目前刻意不先做高併發與 Redis。後續可以再延伸：

- Redis cache
- PostgreSQL full-text search
- 模糊搜尋 Fuzzy Search
- 搜尋索引 Index 優化
- 檔案內容解析 PDF text extraction
- 推薦系統 Recommendation System
- 向量搜尋 / RAG
