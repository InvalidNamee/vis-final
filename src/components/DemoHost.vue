<script setup>
import { ref, onMounted, onBeforeUnmount, watch, inject } from 'vue';
import { contentKey } from '../state';
import demoTheme from '../styles/demo.css?raw';
const props = defineProps({ scene: Object, kase: Object });
const state = inject(contentKey), root = ref(null), error = ref('');
let mounted = null;
function cleanup() { const previous = mounted; mounted = null; if (previous?.unmount) { try { previous.unmount(); } catch (e) { console.error(e); } } }
function mount() {
  cleanup(); error.value = ''; if (!root.value) return; root.value.innerHTML = '';
  const demo = props.kase?.tabs?.demo;
  if (!demo?.mount) { error.value = '该案例没有可运行的演示入口。'; return; }
  mounted = demo;
  try { demo.mount(root.value, { scene: props.scene, kase: props.kase, K: state.host.K, atlas: state.host.ATLAS, demoTheme }); }
  catch (e) { cleanup(); root.value.innerHTML = ''; error.value = `演示加载失败：${e.message}`; }
}
onMounted(mount);
watch(() => [props.kase, props.scene], mount, { flush: 'post' });
onBeforeUnmount(cleanup);
</script>

<template><div class="atlas-demo-host"><p v-if="error" class="atlas-error" role="alert">{{ error }}</p><div ref="root" id="case-demo-root"></div></div></template>
