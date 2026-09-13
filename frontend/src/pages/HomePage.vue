<script setup lang="ts">
import { computed } from "vue";

const hasToken = computed(() => Boolean(localStorage.getItem("token")));
</script>

<template>
  <section class="home page-frame">
    <div class="home-hero">
      <div class="hero-copy">
        <div class="hero-badge">UNINOTE ARCHIVUM</div>
        <h1>
          課堂筆記，<br />成為可搜尋的學院典藏。
        </h1>
        <p>
          用公開筆記、私人收藏與文字型 PDF，建立屬於你的學習索引。每份資料都能被整理、尋回，並留下清楚的脈絡。
        </p>

        <div class="hero-actions">
          <router-link :to="hasToken ? '/search' : '/login'" class="primary-action">
            {{ hasToken ? "開始搜尋" : "開始使用" }}
          </router-link>
          <router-link :to="hasToken ? '/notes' : '/register'" class="secondary-action">
            {{ hasToken ? "查看筆記庫" : "建立帳號" }}
          </router-link>
        </div>
      </div>

      <div class="product-preview" aria-label="UniNote search preview">
        <div class="preview-bar">
          <span>INDEX</span>
          <b>MMXXVI</b>
        </div>
        <div class="preview-search">工程數學 傅立葉</div>
        <div class="preview-result main">
          <b>82.4</b>
          <div>
            <strong>工程數學 Fourier Series 筆記</strong>
            <small>標題與內容相符</small>
          </div>
        </div>
        <div class="preview-result">
          <b>74.1</b>
          <div>
            <strong>PDF 匯入：期中重點</strong>
            <small>PDF 內容相符</small>
          </div>
        </div>
        <div class="preview-grid">
          <span>公開卷冊</span>
          <span>標籤索引</span>
          <span>排序註記</span>
        </div>
      </div>
    </div>

    <div class="bento-grid">
      <article class="bento-card wide dark">
        <span>Caput I / 搜尋</span>
        <h2>像翻開目錄一樣，直接抵達需要的重點。</h2>
        <p>以課程、主題、分類與標籤縮小範圍，把散落的課堂資料整理成可回頭查閱的知識索引。</p>
      </article>

      <article class="bento-card color-one">
        <span>Caput II / PDF</span>
        <h3>匯入文字型 PDF</h3>
        <p>將講義與考前整理收入筆記庫，之後用課程、主題或考試關鍵字快速找回。</p>
      </article>

      <article class="bento-card color-two">
        <span>Caput III / 收藏</span>
        <h3>收藏重要學習資料</h3>
        <p>看到常用或之後想讀的內容，可以先收藏起來，複習時快速回到重點。</p>
      </article>

      <article class="bento-card mini metric">
        <strong>共享</strong>
        <span>公開筆記與私人筆記</span>
      </article>

      <article class="bento-card mini metric lime">
        <strong>整理</strong>
        <span>課程、分類與標籤</span>
      </article>
    </div>
  </section>
</template>

<style scoped>
.home { padding: 18px 0 64px; }
.home-hero {
  position: relative;
  min-height: 610px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 480px);
  gap: 44px;
  align-items: center;
  padding: 42px;
  border: 1px solid var(--line-strong);
  border-radius: 6px;
  background:
    linear-gradient(90deg, rgba(111,36,48,.08), transparent 18%, transparent 82%, rgba(35,79,159,.08)),
    rgba(255,250,240,.78);
  box-shadow: var(--shadow-hard);
}
.home-hero::before,
.home-hero::after {
  content: "";
  position: absolute;
  pointer-events: none;
}
.home-hero::before {
  inset: 14px;
  border: 1px solid rgba(183,121,34,.38);
}
.home-hero::after {
  inset: 25px;
  border: 1px solid rgba(35,79,159,.16);
}
.hero-copy,
.product-preview {
  position: relative;
  z-index: 1;
}
.hero-badge { width: fit-content; margin-bottom: 22px; padding: 7px 12px; border: 1px solid rgba(183,121,34,.44); border-radius: 999px; color: var(--wine); background: rgba(255,250,240,.78); font-size: 12px; font-weight: 900; letter-spacing: 0.12em; }
h1 { max-width: 790px; margin: 0; color: var(--ink); font-size: clamp(50px, 6.4vw, 92px); line-height: 1.02; letter-spacing: 0; text-wrap: balance; }
.hero-copy p { max-width: 630px; margin: 26px 0 0; color: var(--muted); font-size: 18px; line-height: 1.85; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
.product-preview { position: relative; padding: 22px; border: 1px solid rgba(183,121,34,.42); border-radius: 4px; background: rgba(255,250,240,.94); box-shadow: 0 20px 46px rgba(56, 39, 23, .18); overflow: hidden; }
.product-preview::before { content:""; position:absolute; inset:10px; border:1px solid rgba(111,36,48,.16); pointer-events:none; }
.preview-bar { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-bottom: 16px; border-bottom: 1px solid var(--line); color: var(--subtle); font-size: 12px; font-weight: 850; }
.preview-bar b { color: var(--ink); }
.preview-search { margin: 18px 0; padding: 15px 16px; border: 1px solid var(--line-strong); border-radius: 3px; color: #4f3a24; background: #fff7e8; font-weight: 850; }
.preview-result { display: grid; grid-template-columns: 74px 1fr; gap: 14px; align-items: center; padding: 16px; border: 1px solid var(--line); border-radius: 4px; background: rgba(255,255,255,.62); }
.preview-result + .preview-result { margin-top: 10px; }
.preview-result.main { border-color: rgba(35,79,159,.34); background: linear-gradient(180deg, #eef4ff, rgba(255,250,240,.92)); }
.preview-result b { color: var(--blue); font-size: 29px; font-family: Georgia, serif; }
.preview-result strong, .preview-result small { display: block; }
.preview-result strong { color: var(--ink); }
.preview-result small { margin-top: 4px; color: var(--muted); }
.preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
.preview-grid span { padding: 12px; border-radius: 3px; background: #f4ead5; color: #57422b; font-size: 13px; font-weight: 820; text-align: center; border:1px solid rgba(198,179,146,.65); }
.bento-grid { display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 16px; }
.bento-card { min-height: 190px; padding: 24px; border: 1px solid var(--line-strong); border-radius: 5px; background: rgba(255,250,240,0.82); box-shadow: var(--shadow-soft); }
.bento-card span { color: var(--subtle); font-size: 12px; font-weight: 850; letter-spacing: 0.04em; text-transform: uppercase; }
.bento-card h2, .bento-card h3 { margin: 14px 0 10px; color: var(--ink); letter-spacing: 0; }
.bento-card h2 { font-size: 31px; line-height: 1.18; }
.bento-card h3 { font-size: 23px; }
.bento-card p { margin: 0; color: var(--muted); line-height: 1.75; }
.wide { grid-column: span 1; }
.dark { color: white; background: linear-gradient(135deg, #151c2d, #263758); border-color: rgba(199,151,56,.36); }
.dark h2, .dark p { color: white; }
.color-one { background: #fff4df; }
.color-two { background: #edf4ff; }
.metric { min-height: 160px; display: grid; align-content: end; background: #151d2c; color: white; }
.metric strong { font-size: 38px; line-height: 1; letter-spacing: 0; }
.metric span { color: #cbd5e1; }
.metric.lime { background: #e0c36f; color: #231b16; }
.metric.lime span { color: #57422b; }
@media (max-width: 980px) { .home-hero, .bento-grid { grid-template-columns: 1fr; } .home-hero { min-height: 0; } }
@media (max-width: 560px) { .home { padding-top: 8px; } .home-hero { padding: 26px 18px; } h1 { font-size: 46px; } .hero-actions { flex-direction: column; } .bento-card h2 { font-size: 28px; } .preview-result { grid-template-columns: 1fr; } }
</style>
