// import './index.css'

// import { createApp } from 'vue'
// import router from './router'
// import App from './App.vue'

// import { Button, setConfig, frappeRequest, resourcesPlugin } from 'frappe-ui'

// let app = createApp(App)

// setConfig('resourceFetcher', frappeRequest)

// app.use(router)
// app.use(resourcesPlugin)

// app.component('Button', Button)
// app.mount('#app')
import { createApp, h } from "vue";
import { FrappeUI, setConfig, frappeRequest } from "frappe-ui";
import HoverListDialog from "./components/HoverListDialog.vue";
import "./index.css";

setConfig("resourceFetcher", frappeRequest);

window.mountHoverEffectListView = function (el, props = {}) {
  if (!el) return null;

  const app = createApp({
    render() {
      return h(HoverListDialog, props);
    },
  });

  app.use(FrappeUI);
  app.mount(el);
  return app;
};