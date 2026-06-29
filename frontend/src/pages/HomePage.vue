<script setup lang="ts">
import { computed } from "vue";

const hasToken = computed(() => Boolean(localStorage.getItem("token")));
</script>

<template>
  <section class="home page-frame">
    <div class="home-hero">
      <div class="hero-copy">
        <div class="hero-badge">UniNote Search Lab</div>
        <h1>
          把筆記變成<br />一座會排序的知識雷達。
        </h1>
        <p>
          這不是普通筆記網站。UniNote 把 Search API、Ranking Score、Filter、Cache 狀態視覺化，讓使用者不只找到資料，也看懂系統為什麼這樣排。
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

      <div class="radar-card">
        <div class="radar-orbit orbit-a"></div>
        <div class="radar-orbit orbit-b"></div>
        <div class="radar-center">Search<br />Core</div>
        <div class="node node-one">Ranking</div>
        <div class="node node-two">Cache</div>
        <div class="node node-three">Filter</div>
      </div>
    </div>

    <div class="bento-grid">
      <article class="bento-card wide dark">
        <span>01 / Search cockpit</span>
        <h2>用一個搜尋艙，展示整套搜尋邏輯。</h2>
        <p>關鍵字、課程、分類、標籤、排序與分頁會在同一個介面中被操作，讓業師可以直接看到系統行為。</p>
      </article>

      <article class="bento-card color-one">
        <span>02 / Score</span>
        <h3>分數不是黑盒子</h3>
        <p>每筆結果會呈現 title、content、popularity、recency 等 Ranking signals。</p>
      </article>

      <article class="bento-card color-two">
        <span>03 / UX</span>
        <h3>讓使用者想探索</h3>
        <p>介面不再只是表格，而是像產品 Demo 一樣有情境、有重點、有節奏。</p>
      </article>

      <article class="bento-card mini metric">
        <strong>5</strong>
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
.home { padding: 28px 0 60px; }
.home-hero { min-height: 640px; display: grid; grid-template-columns: 1fr 0.85fr; gap: 40px; align-items: center; }
.hero-badge { width: fit-content; margin-bottom: 18px; padding: 10px 14px; border-radius: 999px; color: #111827; background: #a3e635; font-size: 13px; font-weight: 1000; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 18px 34px rgba(163, 230, 53, 0.26); }
h1 { max-width: 780px; margin: 0; color: #080f1f; font-size: clamp(52px, 8vw, 104px); line-height: 0.95; letter-spacing: -0.09em; }
.hero-copy p { max-width: 680px; margin: 26px 0 0; color: #526079; font-size: 18px; line-height: 1.9; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 13px; margin-top: 34px; }
.radar-card { position: relative; height: 520px; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 46px; background: radial-gradient(circle at 50% 45%, rgba(56, 103, 255, 0.34), transparent 25%), linear-gradient(145deg, #08111f, #111827 54%, #312e81); box-shadow: 0 40px 110px rgba(15, 23, 42, 0.28); overflow: hidden; }
.radar-card::before { content: ""; position: absolute; inset: 0; opacity: 0.16; background-image: linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px); background-size: 34px 34px; }
.radar-orbit { position: absolute; inset: 90px; border: 1px dashed rgba(255,255,255,0.28); border-radius: 50%; animation: spin 26s linear infinite; }
.orbit-b { inset: 145px; animation-duration: 18s; animation-direction: reverse; }
.radar-center { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 150px; height: 150px; display: grid; place-items: center; border-radius: 38px; color: #08111f; background: linear-gradient(135deg, #a3e635, #22d3ee); font-size: 21px; font-weight: 1000; line-height: 1.1; text-align: center; box-shadow: 0 24px 60px rgba(34, 211, 238, 0.28); }
.node { position: absolute; padding: 12px 15px; border-radius: 999px; color: white; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(12px); font-size: 13px; font-weight: 1000; }
.node-one { top: 92px; left: 76px; }
.node-two { right: 60px; top: 160px; }
.node-three { left: 120px; bottom: 110px; }
.bento-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 18px; }
.bento-card { min-height: 210px; padding: 26px; border: 1px solid rgba(148, 163, 184, 0.26); border-radius: 32px; background: rgba(255,255,255,0.82); box-shadow: var(--shadow-soft); }
.bento-card span { color: #64748b; font-size: 12px; font-weight: 1000; letter-spacing: 0.12em; text-transform: uppercase; }
.bento-card h2, .bento-card h3 { margin: 14px 0 10px; color: #0f172a; letter-spacing: -0.06em; }
.bento-card h2 { font-size: 34px; line-height: 1.1; }
.bento-card h3 { font-size: 25px; }
.bento-card p { margin: 0; color: #64748b; line-height: 1.75; }
.wide { grid-column: span 1; }
.dark { color: white; background: linear-gradient(135deg, #0f172a, #312e81); }
.dark h2, .dark p { color: white; }
.color-one { background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.color-two { background: linear-gradient(135deg, #eff6ff, #dbeafe); }
.metric { min-height: 160px; display: grid; align-content: end; background: #111827; color: white; }
.metric strong { font-size: 62px; line-height: 0.9; letter-spacing: -0.08em; }
.metric span { color: #cbd5e1; }
.metric.lime { background: #a3e635; color: #111827; }
.metric.lime span { color: #365314; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 980px) { .home-hero, .bento-grid { grid-template-columns: 1fr; } .radar-card { height: 420px; } }
@media (max-width: 560px) { h1 { font-size: 54px; } .hero-actions { flex-direction: column; } .bento-card h2 { font-size: 28px; } }
</style>
