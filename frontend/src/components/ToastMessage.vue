<script setup lang="ts">
withDefaults(defineProps<{
  type?: "success" | "error" | "warning" | "info";
  message: string;
  inline?: boolean;
}>(), {
  type: "info",
  inline: false,
});
</script>

<template>
  <div :class="['toast-message', type, { inline }]" role="status" aria-live="polite">
    <span class="toast-dot"></span>
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.toast-message {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 200;
  max-width: min(380px, calc(100vw - 32px));
  padding: 13px 14px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--shadow-hard);
  backdrop-filter: blur(18px);
}

.toast-message.inline {
  position: static;
  max-width: none;
  margin: 0 0 14px;
  box-shadow: none;
}

.toast-dot {
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  margin-top: 6px;
  border-radius: 999px;
  background: #64748b;
}

.toast-message p {
  margin: 0;
  color: #334155;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.55;
}

.toast-message.success {
  border-color: #bbf7d0;
  background: rgba(240, 253, 244, 0.96);
}

.toast-message.success .toast-dot { background: #16a34a; }
.toast-message.success p { color: #166534; }

.toast-message.error {
  border-color: #fecdd3;
  background: rgba(255, 241, 242, 0.96);
}

.toast-message.error .toast-dot { background: #dc2626; }
.toast-message.error p { color: #b42318; }

.toast-message.warning {
  border-color: #fed7aa;
  background: rgba(255, 247, 237, 0.96);
}

.toast-message.warning .toast-dot { background: #d97706; }
.toast-message.warning p { color: #7c2d12; }

.toast-message.info {
  border-color: #bfdbfe;
  background: rgba(239, 246, 255, 0.96);
}

.toast-message.info .toast-dot { background: #2563eb; }
.toast-message.info p { color: #1d4ed8; }

@media (max-width: 560px) {
  .toast-message {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
