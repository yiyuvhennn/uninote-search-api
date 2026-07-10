<script setup lang="ts">
import { computed } from "vue";

const hasToken = computed(() => Boolean(localStorage.getItem("token")));
</script>

<template>
  <section class="home page-frame">
    <div class="home-hero">
      <div class="hero-copy">
        <div class="hero-badge">UniNote Search API</div>
        <h1>
          讓課堂筆記<br />被準確找到。
        </h1>
        <p>
          UniNote 將筆記內容、課程、標籤與 PDF 文字整理成可搜尋資料，並用可解釋的分數呈現排序原因。
        </p>

        <div class="hero-actions">
          <router-link :to="hasToken ? '/search' : '/login'" class="primary-action">
            {{ hasToken ? "進入搜尋艙" : "開始體驗" }}
          </router-link>
          <router-link :to="hasToken ? '/notes' : '/register'" class="secondary-action">
            {{ hasToken ? "查看筆記庫" : "建立帳號" }}
          </router-link>
        </div>
      </div>

      <div class="product-preview" aria-label="UniNote search preview">
        <div class="preview-bar">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="preview-search">工程數學 傅立葉</div>
        <div class="preview-result main">
          <b>82.4</b>
          <div>
            <strong>工程數學 Fourier Series 筆記</strong>
            <small>title + content + textSimilarity</small>
          </div>
        </div>
        <div class="preview-result">
          <b>74.1</b>
          <div>
            <strong>PDF 匯入：期中重點</strong>
            <small>PDF text matched</small>
          </div>
        </div>
        <div class="preview-grid">
          <span>Cache Hit</span>
          <span>Tag Filter</span>
          <span>Score Detail</span>
        </div>
      </div>
    </div>

    <div class="bento-grid">
      <article class="bento-card wide dark">
        <span>01 / Search</span>
        <h2>搜尋結果不只列出來，也說明為什麼排在前面。</h2>
        <p>關鍵字、課程、分類、標籤、排序與分頁都在同一個流程中運作，方便展示 Search API 的完整行為。</p>
      </article>

      <article class="bento-card color-one">
        <span>02 / Ranking</span>
        <h3>分數不是黑盒</h3>
        <p>每筆結果會呈現 title、content、textSimilarity、popularity、recency 等訊號。</p>
      </article>

      <article class="bento-card color-two">
        <span>03 / PDF</span>
        <h3>文字型 PDF 也能搜尋</h3>
        <p>PDF 文字會被抽出並加入 searchText，和手動建立的筆記一起排序。</p>
      </article>

      <article class="bento-card mini metric">
        <strong>9</strong>
        <span>Signals</span>
      </article>

      <article class="bento-card mini metric lime">
        <strong>60s</strong>
        <span>Cache TTL</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.home { padding: 44px 0 64px; }
.home-hero { min-height: 560px; display: grid; grid-template-columns: 1fr 0.9fr; gap: 42px; align-items: center; }
.hero-badge { width: fit-content; margin-bottom: 18px; padding: 8px 10px; border: 1px solid #bbf7d0; border-radius: 8px; color: #047857; background: #ecfdf3; font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
h1 { max-width: 720px; margin: 0; color: var(--ink); font-size: clamp(46px, 7vw, 84px); line-height: 1.02; letter-spacing: 0; }
.hero-copy p { max-width: 620px; margin: 24px 0 0; color: var(--muted); font-size: 18px; line-height: 1.85; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
.product-preview { padding: 18px; border: 1px solid var(--line); border-radius: 14px; background: #ffffff; box-shadow: var(--shadow-hard); }
.preview-bar { display: flex; gap: 7px; padding-bottom: 16px; border-bottom: 1px solid var(--line); }
.preview-bar span { width: 10px; height: 10px; border-radius: 50%; background: #d0d5dd; }
.preview-search { margin: 18px 0; padding: 14px 15px; border: 1px solid #d0d5dd; border-radius: 10px; color: #344054; background: #f9fafb; font-weight: 750; }
.preview-result { display: grid; grid-template-columns: 74px 1fr; gap: 14px; align-items: center; padding: 15px; border: 1px solid var(--line); border-radius: 12px; background: #ffffff; }
.preview-result + .preview-result { margin-top: 10px; }
.preview-result.main { border-color: #bfdbfe; background: #eff6ff; }
.preview-result b { color: #245fd6; font-size: 28px; }
.preview-result strong, .preview-result small { display: block; }
.preview-result strong { color: var(--ink); }
.preview-result small { margin-top: 4px; color: var(--muted); }
.preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
.preview-grid span { padding: 12px; border-radius: 10px; background: #f2f4f7; color: #475467; font-size: 13px; font-weight: 750; text-align: center; }
.bento-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 14px; }
.bento-card { min-height: 190px; padding: 22px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255,255,255,0.86); box-shadow: var(--shadow-soft); }
.bento-card span { color: var(--subtle); font-size: 12px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.bento-card h2, .bento-card h3 { margin: 14px 0 10px; color: var(--ink); letter-spacing: 0; }
.bento-card h2 { font-size: 31px; line-height: 1.18; }
.bento-card h3 { font-size: 23px; }
.bento-card p { margin: 0; color: var(--muted); line-height: 1.75; }
.wide { grid-column: span 1; }
.dark { color: white; background: #18212f; }
.dark h2, .dark p { color: white; }
.color-one { background: #fff7ed; }
.color-two { background: #eff6ff; }
.metric { min-height: 160px; display: grid; align-content: end; background: #111827; color: white; }
.metric strong { font-size: 56px; line-height: 0.9; letter-spacing: 0; }
.metric span { color: #cbd5e1; }
.metric.lime { background: #d9f99d; color: #111827; }
.metric.lime span { color: #365314; }
@media (max-width: 980px) { .home-hero, .bento-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { h1 { font-size: 54px; } .hero-actions { flex-direction: column; } .bento-card h2 { font-size: 28px; } }
</style>
