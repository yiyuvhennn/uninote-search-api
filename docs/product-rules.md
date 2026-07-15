# UniNote Product Rules

## 1. 系統定位

UniNote Search API 是一個以學生筆記資料為核心的搜尋與管理系統。

目前系統定位為「共享筆記庫 + 私人筆記」模式：

- 使用者可以建立、搜尋、查看、收藏筆記。
- 筆記可以設定為公開或私人。
- 公開筆記形成共享搜尋資源。
- 私人筆記只屬於作者本人。
- 搜尋結果使用 rule-based ranking，並提供可解釋的 scoreDetail。

本系統目前仍以 Search API、Ranking、Filter、Pagination、Cache、PDF 文字型匯入與基本權限控制為主要範圍。

## 2. 使用者角色

目前系統只有一般登入使用者角色。

一般登入使用者可以：

- 註冊與登入帳號。
- 建立 PUBLIC 或 PRIVATE note。
- 搜尋自己可見的 notes。
- 查看自己可見的 note 詳情。
- 收藏自己可見的 notes。
- 刪除自己建立的 notes。
- 修改自己的帳號資料與密碼。
- 刪除自己的帳號。

目前沒有管理員角色，也沒有後台管理介面。

## 3. PUBLIC Note 規則

PUBLIC note 是共享筆記庫的一部分。

PUBLIC note 規則如下：

- 所有登入使用者都可以搜尋。
- 所有登入使用者都可以查看詳情。
- 所有登入使用者都可以收藏。
- 只有作者本人可以刪除。
- 只有作者本人可以在未來的編輯功能中修改。

PUBLIC note 適合放置可被其他使用者參考的課堂筆記、整理資料、考前重點、文字型 PDF 匯入內容。

## 4. PRIVATE Note 規則

PRIVATE note 是作者本人的私人資料。

PRIVATE note 規則如下：

- 只有作者本人可以搜尋。
- 只有作者本人可以查看詳情。
- 只有作者本人可以收藏。
- 只有作者本人可以刪除。
- 只有作者本人可以在未來的編輯功能中修改。
- 其他使用者即使知道 note id，也不應取得資料。

當使用者嘗試存取不屬於自己的 PRIVATE note 時，系統應回傳 404，避免洩漏該 note 是否存在。

## 5. 搜尋 Scope 規則

搜尋支援三種 scope：`all`、`mine`、`public`。

### scope=all

`all` 是預設搜尋範圍。

搜尋範圍包含：

- 目前登入使用者自己建立的所有 notes。
- 所有 PUBLIC notes。

用途：

- 一般使用者預設搜尋體驗。
- 同時取得自己的私人資料與共享筆記庫資料。

### scope=mine

搜尋範圍只包含：

- 目前登入使用者自己建立的 notes。

用途：

- 使用者只想搜尋自己的資料。
- 包含自己建立的 PUBLIC notes 與 PRIVATE notes。

### scope=public

搜尋範圍只包含：

- visibility 為 PUBLIC 的 notes。

用途：

- 使用者只想搜尋共享筆記庫。
- 不包含自己的 PRIVATE notes。

### Scope 與 Filter 的關係

course、category、tag、keyword 等 filter 必須在 scope 限定後的可見資料範圍內套用。

例如：

- `scope=all&course=工程數學`：搜尋自己的工程數學 notes + PUBLIC 工程數學 notes。
- `scope=mine&tag=期中考`：只搜尋自己的期中考 notes。
- `scope=public&q=傅立葉`：只搜尋 PUBLIC notes 中與傅立葉相關的資料。

## 6. 收藏規則

使用者只能收藏自己可見的 note。

可以收藏：

- 自己建立的 note。
- 任何 PUBLIC note。

不可以收藏：

- 其他使用者的 PRIVATE note。

收藏列表規則：

- 只回傳目前登入使用者自己的 favorites。
- favorite 裡的 note 可以是自己的 note，也可以是 PUBLIC note。
- 不應回傳其他使用者的 favorite 紀錄。

刪除收藏規則：

- 使用者只能刪除自己的 favorite。
- 使用者不能刪除其他使用者的 favorite。

## 7. 刪除規則

Note 刪除規則：

- 只有 note 作者本人可以刪除該 note。
- PUBLIC note 也不能被非作者刪除。
- PRIVATE note 只能被作者本人刪除。
- 如果使用者嘗試刪除不屬於自己的 note，系統應回傳 404。

刪除 note 時，系統應一併處理該 note 相關資料：

- favorites
- noteTags
- note 本身
- search cache

Account 刪除規則：

- 使用者只能刪除自己的帳號。
- 使用者必須提供目前密碼。
- 使用者必須輸入指定確認文字。
- 刪除帳號時，只能刪除該使用者自己的資料。

## 8. PDF 匯入 Visibility 規則

PDF 匯入建立的 note 同樣必須遵守 visibility 規則。

PDF 匯入時可選擇：

- PUBLIC：匯入後成為共享筆記庫的一部分。
- PRIVATE：匯入後只有作者本人可以搜尋與查看。

如果前端或 API request 沒有提供 visibility，後端預設為 PUBLIC。

PDF 匯入仍只支援文字型 PDF：

- 成功解析文字後，PDF 文字會寫入 note content。
- searchText 會包含 PDF 文字、title、course、category、tags。
- 無文字 PDF 不應建立空 note。
- 掃描型 PDF 目前不支援 OCR。

## 9. 舊資料預設 PUBLIC 的原因

舊資料預設為 PUBLIC，原因如下：

- 原本 seed 筆記是專題展示用的共享搜尋資料。
- 若舊資料改成 PRIVATE，新註冊使用者會看不到任何搜尋資料。
- 系統目標是「共享筆記庫 + 私人筆記」，所以既有展示資料應保留共享特性。
- SQLite migration 採用 `visibility String @default("PUBLIC")`，可降低對既有資料與 migration 的破壞。

因此，未指定 visibility 的既有 notes 與新 notes 會預設為 PUBLIC。

## 10. 不做的範圍

本階段明確不包含以下功能：

- OCR
- RAG
- OpenAI API
- LangChain
- 向量資料庫
- Redis
- 推薦系統
- 管理員後台
- 多角色權限系統
- 大規模資料庫重構
- PostgreSQL migration

這些功能可能屬於後續版本，但不屬於目前 visibility / public-private 權限修正範圍。
