<script setup lang="ts">
import { computed } from "vue";

const hasToken = computed(() => Boolean(localStorage.getItem("token")));

const primaryPath = computed(() => (hasToken.value ? "/search" : "/login"));
const secondaryPath = computed(() => (hasToken.value ? "/notes" : "/register"));
</script>

<template>
  <section class="home-page page-shell">
    <div class="hero-section">
      <div class="hero-copy">
        <p class="page-eyebrow">UniNote Search API MVP</p>

        <h1>
          讓筆記搜尋，<br />
          變得可排序、可解釋、可驗證。
        </h1>

        <p class="hero-desc">
          uniNote 是一個學習筆記搜尋系統原型。它不只是把筆記列出來，
          而是把搜尋、篩選、Ranking Score、Pagination 與 Cache 狀態做成可以展示與討論的產品流程。
        </p>

        <div class="hero-actions">
          <router-link :to="primaryPath" class="primary-action">
            {{ hasToken ? "前往搜尋系統" : "開始登入" }}
          </router-link>

          <router-link :to="secondaryPath" class="secondary-action">
            {{ hasToken ? "查看筆記列表" : "建立帳號" }}
          </router-link>
        </div>

        <div class="hero-metrics">
          <div>
            <strong>5</strong>
            <span>Ranking Signals</span>
          </div>

          <div>
            <strong>3</strong>
            <span>Sort Modes</span>
          </div>

          <div>
            <strong>60s</strong>
            <span>Cache Demo</span>
          </div>
        </div>
      </div>

      <div class="hero-card">
        <div class="window-bar">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div class="search-box-preview">
          <small>Search query</small>
          <strong>工程數學 傅立葉</strong>
        </div>

        <div class="result-list">
          <div class="result-card highlight">
            <div>
              <p>傅立葉級數重點整理</p>
              <span>titleMatch + contentMatch + recency</span>
            </div>
            <b>9.4</b>
          </div>

          <div class="result-card">
            <div>
              <p>偏微分方程筆記</p>
              <span>contentMatch + popularity</span>
            </div>
            <b>7.8</b>
          </div>

          <div class="result-card">
            <div>
              <p>工程數學期中考整理</p>
              <span>course filter + latest sort</span>
            </div>
            <b>6.9</b>
          </div>
        </div>
      </div>
    </div>

    <div class="feature-grid">
      <article>
        <span>01</span>
        <h3>Search API</h3>
        <p>支援關鍵字、課程、分類、標籤、排序與分頁，讓資料查詢有完整流程。</p>
      </article>

      <article>
        <span>02</span>
        <h3>Ranking Score</h3>
        <p>依照標題、描述、內容、熱門度與新近度計算分數，讓排序邏輯可解釋。</p>
      </article>

      <article>
        <span>03</span>
        <h3>Cache Demo</h3>
        <p>顯示 cache hit / miss，讓重複查詢的效能差異可以被觀察。</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.home-page {
  margin: 0 auto;
}

.hero-section {
  min-height: calc(100vh - 140px);
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 34px;
  align-items: center;
}

.hero-copy {
  padding: 28px 0;
}

.hero-copy h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(46px, 6vw, 78px);
  line-height: 1.03;
  letter-spacing: -0.08em;
}

.hero-desc {
  max-width: 640px;
  margin: 24px 0 0;
  color: #64748b;
  font-size: 17px;
  line-height: 1.9;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 34px;
  max-width: 560px;
}

.hero-metrics div {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
}

.hero-metrics strong {
  display: block;
  color: #111827;
  font-size: 30px;
  letter-spacing: -0.05em;
}

.hero-metrics span {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
}

.hero-card {
  position: relative;
  padding: 22px;
  border: 1px solid rgba(203, 213, 225, 0.88);
  border-radius: 34px;
  background:
    radial-gradient(circle at top right, rgba(66, 99, 235, 0.2), transparent 35%),
    rgba(255, 255, 255, 0.86);
  box-shadow: 0 34px 90px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(18px);
}

.window-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.window-bar span {
  width: 11px;
  height: 11px;
  border-radius: 999px;
  background: #cbd5e1;
}

.search-box-preview {
  padding: 18px;
  border: 1px solid #dbeafe;
  border-radius: 22px;
  background: #eff6ff;
}

.search-box-preview small {
  display: block;
  margin-bottom: 7px;
  color: #4263eb;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.search-box-preview strong {
  color: #172033;
  font-size: 22px;
}

.result-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.result-card {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: white;
}

.result-card.highlight {
  border-color: #93c5fd;
  background: linear-gradient(135deg, #eff6ff, #ffffff);
}

.result-card p {
  margin: 0 0 6px;
  color: #172033;
  font-weight: 950;
}

.result-card span {
  color: #64748b;
  font-size: 13px;
  font-weight: 750;
}

.result-card b {
  color: #4263eb;
  font-size: 28px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 38px;
}

.feature-grid article {
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
}

.feature-grid span {
  color: #4263eb;
  font-size: 13px;
  font-weight: 950;
}

.feature-grid h3 {
  margin: 12px 0 8px;
  color: #111827;
  font-size: 22px;
  letter-spacing: -0.04em;
}

.feature-grid p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .hero-section {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 44px 0;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
  }
}
</style>
