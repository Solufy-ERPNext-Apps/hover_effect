(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // ../hover_effect/hover_effect/public/js/hover_effect.js
  if (window.frappe) {
    frappe.provide("hover_effect");
  }
  (function inject_hover_styles() {
    if (document.getElementById("hover-effect-styles"))
      return;
    const css = `
        #hover-effect-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9998;
            background: rgba(0,0,0,0.18);
        }
        #hover-effect-backdrop.visible { display: block; }

        #custom-hover-popover {
            position: fixed;
            z-index: 9999;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 92vw;
            max-width: 1240px;
            height: 84vh;
            max-height: 860px;
            display: flex;
            flex-direction: column;
            background: var(--hover-pop-bg, #fff);
            border: 1px solid var(--hover-pop-border, #d1d8dd);
            border-radius: 14px;
            box-shadow: 0 24px 80px rgba(0,0,0,0.22), 0 2px 10px rgba(0,0,0,0.12);
            font-family: inherit;
            font-size: 13px;
            color: var(--hover-pop-text, #36414c);
            overflow: hidden;
        }
        #custom-hover-popover.hidden { display: none; }
        #hover-effect-backdrop.hidden { display: none !important; }

        .hover-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 22px 14px;
            border-bottom: 1px solid var(--hover-pop-border-soft, #ebeef0);
            flex-shrink: 0;
            background: var(--hover-pop-header, #fff);
        }
        .hover-header-copy {
            min-width: 0;
            flex: 1;
        }
        .hover-header-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
            margin-left: 14px;
        }
        .hover-kicker {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: var(--hover-pop-muted, #8d99a6);
            margin-bottom: 6px;
        }
        .hover-title { font-size: 17px; font-weight: 700; min-width: 0; flex: 1; letter-spacing: -0.01em; }
        .hover-title a { color: var(--hover-pop-link, #2490ef); text-decoration: none; }
        .hover-title a:hover { text-decoration: underline; }
        .hover-docname { font-weight: 700; }
        .hover-subtitle {
            margin-top: 6px;
            font-size: 12px;
            color: var(--hover-pop-muted, #8d99a6);
        }
        .hover-close {
            flex-shrink: 0; background: none; border: none;
            cursor: pointer; font-size: 20px; color: var(--hover-pop-muted, #8d99a6); line-height: 1;
            padding: 3px 8px; border-radius: 4px; transition: background 0.15s, color 0.15s;
        }
        .hover-close:hover { background: var(--hover-pop-surface, #f4f5f6); color: var(--hover-pop-text, #36414c); }
        .hover-ai-button {
            border: 1px solid var(--hover-pop-border, #d1d8dd);
            background: var(--hover-pop-surface-card, rgba(127,127,127,0.04));
            color: var(--hover-pop-text, #36414c);
            border-radius: 999px;
            padding: 7px 12px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .hover-ai-button:hover {
            background: var(--hover-pop-surface, #f4f5f6);
        }
        .hover-ai-secondary-button {
            border: 1px solid var(--hover-pop-border, #d1d8dd);
            background: transparent;
            color: var(--hover-pop-text, #36414c);
            border-radius: 999px;
            padding: 7px 12px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .hover-ai-secondary-button:hover {
            background: var(--hover-pop-surface, #f4f5f6);
        }
        .hover-ai-button.active {
            background: var(--hover-pop-link, #2490ef);
            border-color: var(--hover-pop-link, #2490ef);
            color: #fff;
        }
        .hover-ai-button[disabled] {
            opacity: 0.6;
            cursor: wait;
        }

        .hover-body {
            flex: 1;
            overflow-y: auto;
            padding: 18px 22px 22px;
            background: var(--hover-pop-bg, #fff);
        }
        .hover-layout {
            display: grid;
            grid-template-columns: minmax(320px, 0.95fr) minmax(420px, 1.35fr);
            gap: 18px;
        }
        .hover-layout.single-column {
            grid-template-columns: minmax(0, 1fr);
        }
        .hover-column {
            min-width: 0;
        }
        .hover-column.stack {
            display: grid;
            gap: 16px;
            align-content: start;
        }
        .hover-card {
            background: var(--hover-pop-surface-card, rgba(127,127,127,0.04));
            border: 1px solid var(--hover-pop-border-soft, #ebeef0);
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 16px;
        }
        .hover-card:last-child {
            margin-bottom: 0;
        }
        .hover-card.hero {
            padding: 18px;
        }
        .hover-body::-webkit-scrollbar { width: 6px; }
        .hover-body::-webkit-scrollbar-track { background: transparent; }
        .hover-body::-webkit-scrollbar-thumb { background: var(--hover-pop-border, #d1d8dd); border-radius: 4px; }

        .hover-meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px 24px;
            margin-bottom: 0;
        }
        .hover-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .hover-meta-label { font-size: 11px; font-weight: 700; color: var(--hover-pop-muted, #8d99a6); text-transform: uppercase; letter-spacing: 0.5px; }
        .hover-meta-value { font-size: 14px; color: var(--hover-pop-text, #36414c); word-break: break-word; }
        .hover-meta-value.hover-bold { font-size: 16px; font-weight: 700; color: var(--hover-pop-strong, #1a1a1a); }

        .hover-section { margin-bottom: 18px; }
        .hover-section:last-child { margin-bottom: 0; }
        .hover-section-title {
            font-size: 11.5px; font-weight: 800; color: var(--hover-pop-text, #36414c);
            text-transform: uppercase; letter-spacing: 0.6px;
            margin-bottom: 12px; padding-bottom: 6px;
            border-bottom: 2px solid var(--hover-pop-border-soft, #ebeef0);
        }
        .hover-field-section-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 12px 22px;
        }
        .hover-empty-note {
            padding: 14px 0 4px;
            color: var(--hover-pop-muted, #8d99a6);
            font-size: 13px;
        }
        .hover-ai-shell {
            display: grid;
            gap: 16px;
        }
        .hover-ai-note {
            margin-top: 10px;
            font-size: 12px;
            color: var(--hover-pop-muted, #8d99a6);
        }
        .hover-ai-root {
            min-width: 0;
        }
        .hover-ai-shell {
            display: grid;
            gap: 18px;
            width: 100%;
        }
        .hover-ai-banner {
            display: grid;
            gap: 10px;
            padding: 18px;
            border: 1px solid var(--hover-pop-border-soft, #ebeef0);
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(36, 144, 239, 0.08), rgba(64, 201, 162, 0.08));
        }
        .hover-ai-title {
            font-size: 28px;
            font-weight: 800;
            line-height: 1.1;
            letter-spacing: -0.03em;
        }
        .hover-ai-status {
            justify-self: start;
        }
        .hover-ai-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
        }
        .hover-ai-summary-item,
        .hover-ai-field,
        .hover-ai-linked-card,
        .hover-ai-table-wrap {
            padding: 14px;
            border-radius: 14px;
            border: 1px solid var(--hover-pop-border-soft, #ebeef0);
            background: var(--hover-pop-surface-card, rgba(127,127,127,0.04));
        }
        .hover-ai-main {
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
            gap: 18px;
        }
        .hover-ai-primary,
        .hover-ai-secondary {
            display: grid;
            gap: 16px;
            align-content: start;
        }
        .hover-ai-section {
            display: grid;
            gap: 12px;
        }
        .hover-ai-section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.12em;
            color: var(--hover-pop-muted, #8d99a6);
        }
        .hover-ai-field-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 12px;
        }
        .hover-ai-label {
            display: block;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--hover-pop-muted, #8d99a6);
            margin-bottom: 5px;
        }
        .hover-ai-value {
            display: block;
            font-size: 14px;
            color: var(--hover-pop-text, #36414c);
            word-break: break-word;
        }
        .hover-ai-linked-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 12px;
        }
        .hover-ai-table {
            width: 100%;
            border-collapse: collapse;
        }
        .hover-ai-table th,
        .hover-ai-table td {
            padding: 8px 10px 8px 0;
            border-bottom: 1px solid var(--hover-pop-border-soft, #ebeef0);
            text-align: left;
            vertical-align: top;
        }
        .hover-ai-table th {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--hover-pop-muted, #8d99a6);
        }
        .hover-ai-note {
            font-size: 12px;
            color: var(--hover-pop-muted, #8d99a6);
        }
        @media (max-width: 980px) {
            .hover-ai-main {
                grid-template-columns: 1fr;
            }
        }
        .hover-linked-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 14px;
        }
        .hover-linked-card {
            padding: 14px;
            border-radius: 12px;
            background: var(--hover-pop-surface-card, rgba(127,127,127,0.04));
            border: 1px solid var(--hover-pop-border-soft, #ebeef0);
        }
        .hover-linked-head {
            display: flex;
            flex-direction: column;
            gap: 3px;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--hover-pop-border-soft, #ebeef0);
        }
        .hover-linked-label {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: var(--hover-pop-muted, #8d99a6);
        }
        .hover-linked-title a {
            color: var(--hover-pop-link, #2490ef);
            text-decoration: none;
            font-size: 15px;
            font-weight: 700;
        }
        .hover-linked-title a:hover {
            text-decoration: underline;
        }
        .hover-linked-subtitle {
            font-size: 12px;
            color: var(--hover-pop-muted, #8d99a6);
        }

        .hover-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .hover-table thead th {
            text-align: left; font-weight: 700; font-size: 12px; color: var(--hover-pop-muted, #8d99a6);
            padding: 8px 12px 8px 0; border-bottom: 1px solid var(--hover-pop-border-soft, #ebeef0); white-space: nowrap;
        }
        .hover-table thead th.num,
        .hover-table tbody td.num,
        .hover-table tfoot  td.num { text-align: right; }
        .hover-table tbody tr { transition: background 0.1s; }
        .hover-table tbody tr:hover { background: var(--hover-pop-surface, #f5f8ff); }
        .hover-table tbody td {
            padding: 9px 12px 9px 0; border-bottom: 1px solid var(--hover-pop-border-soft, #f4f5f6);
            color: var(--hover-pop-text, #36414c); vertical-align: middle;
        }
        .hover-table tbody td.remarks { color: var(--hover-pop-muted, #8d99a6); font-size: 12px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hover-table tbody td a { color: var(--hover-pop-link, #2490ef); text-decoration: none; }
        .hover-table tbody td a:hover { text-decoration: underline; }
        .hover-table tfoot .total-row td {
            padding: 10px 12px 6px 0; border-top: 2px solid var(--hover-pop-border, #d1d8dd);
            font-size: 13px; font-weight: 700; color: var(--hover-pop-strong, #1a1a1a);
        }

        .status-pill {
            display: inline-block; padding: 2px 9px; border-radius: 10px;
            font-size: 11px; font-weight: 600; letter-spacing: 0.2px; white-space: nowrap;
        }
        .status-green  { background: #d4edda; color: #155724; }
        .status-blue   { background: #cce5ff; color: #004085; }
        .status-orange { background: #fff3cd; color: #856404; }
        .status-red    { background: #f8d7da; color: #721c24; }
        .status-grey   { background: #e9ecef; color: #495057; }

        .hover-loading {
            display: flex; align-items: center; justify-content: center;
            gap: 12px; padding: 60px 20px; color: var(--hover-pop-muted, #8d99a6); font-size: 14px;
            flex: 1;
        }
        .hover-spinner {
            width: 20px; height: 20px; border: 2px solid var(--hover-pop-border, #d1d8dd);
            border-top-color: var(--hover-pop-link, #2490ef); border-radius: 50%;
            animation: hover-spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes hover-spin { to { transform: rotate(360deg); } }
        .hover-error { padding: 40px; color: #b94a48; font-size: 14px; text-align: center; }
        [data-theme="dark"] #hover-effect-backdrop {
            background: rgba(0,0,0,0.45);
        }
        [data-theme="dark"] #custom-hover-popover {
            --hover-pop-bg: #14181d;
            --hover-pop-header: #181d23;
            --hover-pop-surface: #1d232b;
            --hover-pop-surface-card: rgba(255,255,255,0.03);
            --hover-pop-border: rgba(255,255,255,0.1);
            --hover-pop-border-soft: rgba(255,255,255,0.08);
            --hover-pop-text: #e8edf3;
            --hover-pop-strong: #ffffff;
            --hover-pop-muted: #95a3b8;
            --hover-pop-link: #5aa9ff;
        }
        @media (max-width: 980px) {
            .hover-layout {
                grid-template-columns: 1fr;
            }
        }
    `;
    const style = document.createElement("style");
    style.id = "hover-effect-styles";
    style.textContent = css;
    document.head.appendChild(style);
  })();
  $(document).ready(function() {
    var _a;
    if (!window.frappe || !frappe.call)
      return;
    const HOVER_SELECTOR = [
      "a[data-doctype][data-name]",
      ".document-link[data-doctype][data-name]",
      ".tree-label[data-doctype][data-name]",
      ".dt-cell__content a",
      ".list-row a",
      "table a"
    ].join(", ");
    const preview_cache = /* @__PURE__ */ new Map();
    const ai_cache = /* @__PURE__ */ new Map();
    const target_cache = /* @__PURE__ */ new Map();
    let hover_config = null;
    let hover_config_promise = null;
    let hover_timeout;
    let current_hovered = null;
    let current_target = null;
    let current_preview = null;
    let current_view_mode = "default";
    let ai_request_key = null;
    let slug_map = null;
    let enhance_timeout = null;
    let observer = null;
    const $backdrop = $(`<div id="hover-effect-backdrop" class="hidden"></div>`).appendTo("body");
    const $hover_popover = $(`<div id="custom-hover-popover" class="hidden"></div>`).appendTo(
      "body"
    );
    $(document).on("mouseenter.hover_effect", HOVER_SELECTOR, function() {
      clearTimeout(hover_timeout);
      const target = get_hover_target(this);
      if (!target)
        return;
      hover_timeout = setTimeout(() => maybe_show_hover_popover(target), 350);
    });
    $(document).on("mouseleave.hover_effect", HOVER_SELECTOR, function() {
      clearTimeout(hover_timeout);
    });
    $backdrop.on("click", hide_hover_popover);
    $(document).on("keydown.hover_effect", function(e) {
      if (e.key === "Escape")
        hide_hover_popover();
    });
    $hover_popover.on("click", function(e) {
      e.stopPropagation();
    });
    if ((_a = frappe.router) == null ? void 0 : _a.on) {
      frappe.router.on("change", hide_hover_popover);
      frappe.router.on("change", schedule_table_enhancement);
    }
    schedule_table_enhancement();
    setup_table_observer();
    function get_hover_target(element) {
      const $el = $(element);
      if ($el.closest("#custom-hover-popover").length)
        return null;
      const attr_target = get_attribute_target($el);
      if (attr_target)
        return attr_target;
      const list_target = get_list_target($el);
      if (list_target)
        return list_target;
      return get_href_target($el);
    }
    function get_attribute_target($el) {
      var _a2, _b;
      let doctype = $el.attr("data-doctype");
      let name = $el.attr("data-name");
      if (!doctype || !name) {
        const $parent = $el.closest("[data-doctype][data-name]");
        doctype = doctype || $parent.attr("data-doctype");
        name = name || $parent.attr("data-name");
      }
      if (!doctype || !name)
        return null;
      return {
        doctype: ((_a2 = frappe.utils) == null ? void 0 : _a2.unescape_html) ? frappe.utils.unescape_html(doctype) : doctype,
        name: ((_b = frappe.utils) == null ? void 0 : _b.unescape_html) ? frappe.utils.unescape_html(name) : name
      };
    }
    function get_list_target($el) {
      var _a2, _b, _c, _d, _e;
      if (!((_a2 = window.cur_list) == null ? void 0 : _a2.doctype))
        return null;
      const $row = $el.closest(".list-row, .list-row-container");
      if (!$row.length)
        return null;
      let name = $row.attr("data-name") || $row.find("[data-name]").attr("data-name");
      if (!name) {
        const idx = $(".list-row").index($row.closest(".list-row"));
        name = (_d = (_c = (_b = window.cur_list) == null ? void 0 : _b.data) == null ? void 0 : _c[idx]) == null ? void 0 : _d.name;
      }
      if (!name)
        return null;
      return {
        doctype: window.cur_list.doctype,
        name: ((_e = frappe.utils) == null ? void 0 : _e.unescape_html) ? frappe.utils.unescape_html(name) : name
      };
    }
    function get_href_target($el) {
      const href = $el.attr("href") || $el.closest("a").attr("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
        return null;
      }
      let url;
      try {
        url = new URL(href, window.location.origin);
      } catch (_error) {
        return null;
      }
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] !== "app" || parts.length < 3)
        return null;
      const name = decodeURIComponent(parts.slice(2).join("/"));
      if (!name)
        return null;
      return { doctype: resolve_doctype_from_slug(parts[1]), doctype_slug: parts[1], name };
    }
    function resolve_doctype_from_slug(slug) {
      var _a2, _b, _c, _d, _e;
      if (!slug || !((_a2 = frappe.router) == null ? void 0 : _a2.slug))
        return null;
      if (!slug_map) {
        slug_map = {};
        const doctypes = /* @__PURE__ */ new Set([(_b = window.cur_list) == null ? void 0 : _b.doctype]);
        (((_c = frappe.boot) == null ? void 0 : _c.link_preview_doctypes) || []).forEach((doctype) => doctypes.add(doctype));
        Object.keys(((_e = (_d = frappe.boot) == null ? void 0 : _d.user) == null ? void 0 : _e.can_read) || {}).forEach((doctype) => doctypes.add(doctype));
        ((hover_config == null ? void 0 : hover_config.allowed_doctypes) || []).forEach((doctype) => doctypes.add(doctype));
        doctypes.forEach((doctype) => {
          if (!doctype)
            return;
          slug_map[frappe.router.slug(doctype)] = doctype;
        });
      }
      return slug_map[slug] || null;
    }
    function show_hover_popover(target) {
      const { doctype, name } = target;
      const cache_key = `${doctype}::${name}`;
      current_target = target;
      $backdrop.removeClass("hidden").addClass("visible");
      $hover_popover.removeClass("hidden").html(
        `<div class="hover-header"><div class="hover-title">${frappe.utils.escape_html(
          doctype
        )}: <span class="hover-docname">${frappe.utils.escape_html(
          name
        )}</span></div><button class="hover-close" title="Close">&#x2715;</button></div><div class="hover-loading"><div class="hover-spinner"></div><span>Loading\u2026</span></div>`
      );
      if (preview_cache.has(cache_key)) {
        render_best_available_content(preview_cache.get(cache_key), doctype, name);
        return;
      }
      frappe.call({
        method: "hover_effect.api.get_hover_details",
        args: { doctype, name },
        callback: function(r) {
          if (!r || !r.message) {
            $hover_popover.html(`<div class="hover-error">Could not load details.</div>`);
            return;
          }
          preview_cache.set(cache_key, r.message);
          render_best_available_content(r.message, doctype, name);
        },
        error: function() {
          $hover_popover.html(`<div class="hover-error">Could not load details.</div>`);
        }
      });
    }
    async function maybe_show_hover_popover(target) {
      if (!target.doctype && target.doctype_slug) {
        const config = await get_hover_config();
        target.doctype = resolve_doctype_from_slug(target.doctype_slug) || resolve_allowed_doctype_from_slug(target.doctype_slug, config);
      }
      if (!target.doctype)
        return;
      const allowed = await is_hover_allowed(target.doctype);
      if (!allowed)
        return;
      const hover_key = `${target.doctype}::${target.name}`;
      if (current_hovered === hover_key && !$hover_popover.hasClass("hidden"))
        return;
      current_hovered = hover_key;
      show_hover_popover(target);
    }
    async function is_hover_allowed(doctype) {
      const config = await get_hover_config();
      return Boolean((config == null ? void 0 : config.enabled) && (config.allowed_doctypes || []).includes(doctype));
    }
    async function get_hover_config() {
      var _a2;
      if (hover_config)
        return hover_config;
      if ((_a2 = frappe.boot) == null ? void 0 : _a2.hover_effect) {
        hover_config = frappe.boot.hover_effect;
        return hover_config;
      }
      if (!hover_config_promise) {
        hover_config_promise = new Promise((resolve) => {
          frappe.call({
            method: "hover_effect.api.get_hover_config",
            callback: function(r) {
              hover_config = (r == null ? void 0 : r.message) || { enabled: false, allowed_doctypes: [] };
              slug_map = null;
              resolve(hover_config);
            },
            error: function() {
              hover_config = { enabled: false, allowed_doctypes: [] };
              slug_map = null;
              resolve(hover_config);
            }
          });
        });
      }
      return hover_config_promise;
    }
    function resolve_allowed_doctype_from_slug(slug, config) {
      var _a2, _b;
      if (!slug || !((_a2 = config == null ? void 0 : config.allowed_doctypes) == null ? void 0 : _a2.length) || !((_b = frappe.router) == null ? void 0 : _b.slug))
        return null;
      return config.allowed_doctypes.find((doctype) => frappe.router.slug(doctype) === slug) || null;
    }
    function hide_hover_popover() {
      clearTimeout(hover_timeout);
      $backdrop.removeClass("visible").addClass("hidden");
      $hover_popover.addClass("hidden").html("");
      current_hovered = null;
      current_target = null;
      current_preview = null;
      current_view_mode = "default";
      ai_request_key = null;
    }
    function get_current_theme_mode() {
      var _a2, _b;
      const rootTheme = (_a2 = document.documentElement) == null ? void 0 : _a2.getAttribute("data-theme");
      const bodyTheme = (_b = document.body) == null ? void 0 : _b.getAttribute("data-theme");
      return String(rootTheme || bodyTheme || "").toLowerCase() === "dark" ? "dark" : "light";
    }
    function get_ai_cache_key(doctype, name, themeMode = get_current_theme_mode()) {
      return `${doctype}::${themeMode}`;
    }
    function has_stored_ai_layout(doctype) {
      return Boolean(((hover_config == null ? void 0 : hover_config.stored_ai_layout_doctypes) || []).includes(doctype));
    }
    function setup_table_observer() {
      if (!window.MutationObserver || observer)
        return;
      observer = new MutationObserver(() => schedule_table_enhancement());
      observer.observe(document.body, { childList: true, subtree: true });
    }
    function schedule_table_enhancement() {
      clearTimeout(enhance_timeout);
      enhance_timeout = setTimeout(() => {
        enhance_page_tables();
      }, 250);
    }
    async function enhance_page_tables() {
      const config = await get_hover_config();
      if (!(config == null ? void 0 : config.enabled) || !(config.allowed_doctypes || []).length)
        return;
      $(".page-container table td, .layout-main table td, .frappe-card table td").not(".hover-effect-processed").each(function() {
        const $cell = $(this);
        $cell.addClass("hover-effect-processed");
        if ($cell.find("a, button, input, .ma-pill, .status-pill").length)
          return;
        const text = normalize_cell_text($cell.text());
        if (!is_link_candidate(text))
          return;
        resolve_cell_target(text).then((target) => {
          if (!target)
            return;
          convert_cell_to_link($cell, target, text);
        });
      });
    }
    function normalize_cell_text(text) {
      return String(text || "").replace(/\s+/g, " ").trim();
    }
    function is_link_candidate(text) {
      if (!text || text === "-")
        return false;
      if (text.length > 140)
        return false;
      if (/^[\d\s.,/%:-]+$/.test(text))
        return false;
      return true;
    }
    async function resolve_cell_target(text) {
      if (target_cache.has(text)) {
        return target_cache.get(text);
      }
      const promise = new Promise((resolve) => {
        frappe.call({
          method: "hover_effect.api.resolve_hover_target",
          args: { text },
          callback: function(r) {
            resolve((r == null ? void 0 : r.message) || null);
          },
          error: function() {
            resolve(null);
          }
        });
      });
      target_cache.set(text, promise);
      return promise;
    }
    function convert_cell_to_link($cell, target, label) {
      var _a2;
      if (!(target == null ? void 0 : target.doctype) || !(target == null ? void 0 : target.name) || !((_a2 = frappe.router) == null ? void 0 : _a2.slug))
        return;
      const href = `/app/${frappe.router.slug(target.doctype)}/${encodeURIComponent(target.name)}`;
      const html = `<a href="${href}" data-doctype="${esc(target.doctype)}" data-name="${esc(
        target.name
      )}" class="hover-effect-auto-link">${esc(label)}</a>`;
      $cell.html(html);
    }
    function fmt_currency(val, currency) {
      if (val === void 0 || val === null || val === "")
        return "\u2014";
      const num = parseFloat(val);
      if (Number.isNaN(num))
        return "\u2014";
      const formatted = num.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return currency ? `${currency} ${formatted}` : formatted;
    }
    function fmt_number(val, precision = 2) {
      if (val === void 0 || val === null || val === "")
        return "\u2014";
      const num = parseFloat(val);
      if (Number.isNaN(num))
        return esc(val);
      return num.toLocaleString("en-IN", {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
      });
    }
    function fmt_date(val) {
      if (!val)
        return "\u2014";
      try {
        return frappe.datetime.str_to_user(val) || val;
      } catch (_error) {
        return val;
      }
    }
    function esc(v) {
      return frappe.utils.escape_html(String(v != null ? v : ""));
    }
    function get_status_class(status) {
      const map = {
        Paid: "status-green",
        Submitted: "status-green",
        Active: "status-green",
        Completed: "status-green",
        Closed: "status-green",
        "To Deliver and Bill": "status-blue",
        "To Bill": "status-blue",
        "To Deliver": "status-blue",
        "To Receive and Bill": "status-blue",
        "To Receive": "status-blue",
        "To Pay": "status-blue",
        "Partially Paid": "status-blue",
        Unpaid: "status-orange",
        "Partly Paid": "status-orange",
        "On Hold": "status-orange",
        Overdue: "status-red",
        Cancelled: "status-red",
        Return: "status-red",
        Draft: "status-grey",
        Disabled: "status-grey"
      };
      return map[status] || "status-grey";
    }
    function make_doc_table(rows, cols) {
      if (!rows || !rows.length) {
        return `<div style="color:#8d99a6;font-size:12px;padding:6px 0">No records found</div>`;
      }
      const thead = cols.map((c) => `<th class="${c.cls || ""}">${c.label}</th>`).join("");
      const tbody = rows.map(
        (row) => `<tr>${cols.map((c) => `<td class="${c.cls || ""}">${c.render(row)}</td>`).join("")}</tr>`
      ).join("");
      return `<table class="hover-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
    }
    function render_doc_section(title, rows, cols) {
      if (!rows)
        return "";
      return `<div class="hover-section"><div class="hover-section-title">${title}</div>${make_doc_table(rows, cols)}</div>`;
    }
    function render_field_sections(sections, fallbackCurrency) {
      if (!(sections == null ? void 0 : sections.length))
        return "";
      return sections.map((section) => {
        const rowsHtml = (section.rows || []).map(
          (row) => `<div class="hover-meta-item">
                <span class="hover-meta-label">${esc(row.label)}</span>
                <span class="hover-meta-value">${format_generic_value(
            row,
            fallbackCurrency,
            row.__doc
          )}</span>
            </div>`
        ).join("");
        return `<div class="hover-section">
            <div class="hover-section-title">${esc(section.title || "Details")}</div>
            <div class="hover-field-section-grid">${rowsHtml}</div>
        </div>`;
      }).join("");
    }
    function resolve_currency_code(optionValue, doc, fallbackCurrency) {
      if (!optionValue)
        return fallbackCurrency;
      if (!String(optionValue).includes(":")) {
        return (doc == null ? void 0 : doc[optionValue]) || optionValue || fallbackCurrency;
      }
      const parts = String(optionValue).split(":");
      const fieldname = parts[parts.length - 1];
      return (doc == null ? void 0 : doc[fieldname]) || fallbackCurrency;
    }
    function format_textish_value(value) {
      const raw = String(value != null ? value : "");
      const normalized = raw.replace(/<br\s*\/?>/gi, "\n");
      return esc(normalized).replace(/\n/g, "<br>");
    }
    function format_generic_value(field, fallbackCurrency, doc = null) {
      var _a2;
      const value = field == null ? void 0 : field.value;
      const fieldtype = (field == null ? void 0 : field.fieldtype) || "";
      const currency = resolve_currency_code(field == null ? void 0 : field.options, doc, fallbackCurrency);
      if (value === void 0 || value === null || value === "")
        return "\u2014";
      if (["Date", "Datetime"].includes(fieldtype))
        return esc(fmt_date(value));
      if (fieldtype === "Currency")
        return esc(fmt_currency(value, currency));
      if (["Float", "Percent"].includes(fieldtype))
        return esc(fmt_number(value));
      if (["Text", "Small Text", "Long Text", "Text Editor", "HTML"].includes(fieldtype)) {
        return format_textish_value(value);
      }
      if (["Link", "Dynamic Link"].includes(fieldtype) && value) {
        const linkedDoctype = fieldtype === "Link" ? field.options : doc_field_link_doctype(field, doc);
        if (linkedDoctype && ((_a2 = frappe.router) == null ? void 0 : _a2.slug)) {
          return `<a href="/app/${frappe.router.slug(linkedDoctype)}/${encodeURIComponent(
            value
          )}" target="_blank">${esc(value)}</a>`;
        }
      }
      if (["Int", "Check"].includes(fieldtype)) {
        if (fieldtype === "Check")
          return value ? "Yes" : "No";
        return esc(fmt_number(value, 0));
      }
      return esc(value);
    }
    function render_generic_sections(sections, fallbackCurrency) {
      if (!(sections == null ? void 0 : sections.length))
        return "";
      return sections.map((section) => {
        const cols = (section.columns || []).map((column) => ({
          label: esc(column.label),
          cls: ["Currency", "Float", "Int", "Percent"].includes(column.fieldtype) ? "num" : "",
          render: (row) => format_generic_value(
            {
              value: row[column.fieldname],
              fieldtype: column.fieldtype,
              options: column.options
            },
            fallbackCurrency,
            row
          )
        }));
        return render_doc_section(esc(section.label), section.rows || [], cols);
      }).join("");
    }
    function render_related_sections(sections, fallbackCurrency) {
      if (!(sections == null ? void 0 : sections.length))
        return "";
      return sections.map((section) => {
        const cols = (section.columns || []).map((column) => ({
          label: esc(column.label),
          cls: ["Currency", "Float", "Int", "Percent"].includes(column.fieldtype) ? "num" : "",
          render: (row) => format_generic_value(
            {
              value: row[column.fieldname],
              fieldtype: column.fieldtype,
              options: column.options
            },
            fallbackCurrency,
            row
          )
        }));
        return render_doc_section(esc(section.doctype || section.label), section.rows || [], cols);
      }).join("");
    }
    function render_header(doctype, name, doc = {}, options = {}) {
      var _a2;
      const slug = ((_a2 = frappe.router) == null ? void 0 : _a2.slug) ? frappe.router.slug(doctype) : "";
      const title_href = slug ? `/app/${slug}/${encodeURIComponent(name)}` : "#";
      const lastUpdated = doc.modified ? fmt_date(doc.modified) : "\u2014";
      const owner = doc.owner ? esc(doc.owner) : "\u2014";
      const geminiEnabled = Boolean(hover_config == null ? void 0 : hover_config.gemini_enabled);
      const aiButtonLabel = options.aiPending ? "Generating Layout..." : options.hasStoredAiLayout ? "Generate New Layout" : "Generate New Layout";
      return `
            <div class="hover-header">
                <div class="hover-header-copy">
                    <div class="hover-kicker">Record Preview</div>
                    <div class="hover-title">
                        <a href="${title_href}" target="_blank" title="Open ${esc(name)}">
                            ${esc(doctype)}: <span class="hover-docname">${esc(name)}</span>
                        </a>
                    </div>
                    <div class="hover-subtitle">Owner ${owner} \xB7 Updated ${lastUpdated}</div>
                </div>
                <div class="hover-header-actions">
                    ${geminiEnabled ? `${options.hasStoredAiLayout ? `<button class="hover-ai-secondary-button">Default View</button>` : ""}<button class="hover-ai-button" ${options.aiPending ? "disabled" : ""}>${aiButtonLabel}</button>` : ""}
                    <button class="hover-close" title="Close">&#x2715;</button>
                </div>
            </div>`;
    }
    function render_best_available_content(data, doctype, name) {
      current_preview = data;
      const aiCacheKey = get_ai_cache_key(doctype, name);
      if (ai_cache.has(aiCacheKey)) {
        render_ai_popover_content(ai_cache.get(aiCacheKey), data, doctype, name);
        return;
      }
      if (has_stored_ai_layout(doctype)) {
        load_ai_layout(false);
        return;
      }
      render_popover_content(data, doctype, name);
    }
    function render_loading_shell(doctype, name, doc = {}, aiPending = false) {
      return `${render_header(doctype, name, doc, {
        aiPending,
        hasStoredAiLayout: has_stored_ai_layout(doctype)
      })}
            <div class="hover-loading"><div class="hover-spinner"></div><span>Loading\u2026</span></div>`;
    }
    function render_linked_sections(sections, fallbackCurrency) {
      if (!(sections == null ? void 0 : sections.length))
        return "";
      const cardsHtml = sections.map((section) => {
        var _a2;
        const slug = ((_a2 = frappe.router) == null ? void 0 : _a2.slug) ? frappe.router.slug(section.doctype) : "";
        const href = slug ? `/app/${slug}/${encodeURIComponent(section.name)}` : "#";
        const rowsHtml = (section.rows || []).map(
          (row) => `<div class="hover-meta-item">
                <span class="hover-meta-label">${esc(row.label)}</span>
                <span class="hover-meta-value ${row.bold ? "hover-bold" : ""}">${format_generic_value(row, fallbackCurrency, row.__doc)}</span>
            </div>`
        ).join("");
        return `<div class="hover-linked-card">
            <div class="hover-linked-head">
                <div class="hover-linked-label">${esc(section.label)}</div>
                <div class="hover-linked-title"><a href="${href}" target="_blank">${esc(
          section.name
        )}</a></div>
                <div class="hover-linked-subtitle">${esc(section.doctype)}</div>
            </div>
            <div class="hover-field-section-grid">${rowsHtml}</div>
        </div>`;
      }).join("");
      return `<div class="hover-section">
        <div class="hover-section-title">Linked Details</div>
        <div class="hover-linked-grid">${cardsHtml}</div>
    </div>`;
    }
    function render_popover_content(data, doctype, name) {
      const doc = data.doc || {};
      current_preview = data;
      current_view_mode = "default";
      const currency = doc.currency || doc.default_currency || doc.paid_from_account_currency || doc.paid_to_account_currency || "INR";
      const status_row = (data.meta_rows || []).find((row) => row.fieldname === "status");
      const status = (status_row == null ? void 0 : status_row.value) || doc.status || (doc.disabled ? "Disabled" : "");
      const status_cls = status ? get_status_class(status) : "";
      const meta_rows = (data.meta_rows || []).filter((row) => row.fieldname !== "status").map((row) => ({
        label: row.label,
        value: format_generic_value(row, currency, doc),
        bold: row.bold
      }));
      const meta_html = `
            <div class="hover-meta-grid">
                ${status ? `<div class="hover-meta-item"><span class="hover-meta-label">Status</span><span class="hover-meta-value"><span class="status-pill ${status_cls}">${esc(
        status
      )}</span></span></div>` : ""}
                ${meta_rows.map(
        (row) => `<div class="hover-meta-item"><span class="hover-meta-label">${esc(
          row.label
        )}</span><span class="hover-meta-value ${row.bold ? "hover-bold" : ""}">${row.value}</span></div>`
      ).join("")}
            </div>`;
      const detailSections = (data.detail_sections || []).map((section) => __spreadProps(__spreadValues({}, section), {
        rows: (section.rows || []).map((row) => __spreadProps(__spreadValues({}, row), { __doc: doc }))
      }));
      const linkedSections = (data.linked_sections || []).map((section) => __spreadProps(__spreadValues({}, section), {
        rows: (section.rows || []).map((row) => __spreadProps(__spreadValues({}, row), { __doc: section.doc || null }))
      }));
      const detail_sections_html = render_field_sections(detailSections, currency);
      const linked_sections_html = render_linked_sections(linkedSections, currency);
      const generic_sections_html = render_generic_sections(data.table_sections || [], currency);
      const related_sections_html = render_related_sections(data.related_sections || [], currency);
      const detailRowCount = detailSections.reduce(
        (count, section) => count + (section.rows || []).length,
        0
      );
      const hasDetailSections = Boolean(detailSections.length);
      const hasLinkedSections = Boolean(linkedSections.length);
      const hasTableSections = Boolean((data.table_sections || []).length);
      const hasRelatedSections = Boolean((data.related_sections || []).length);
      const useSingleColumn = !hasLinkedSections && !hasTableSections && !hasRelatedSections || detailRowCount > 18 || detailSections.length > 4;
      const layoutClass = useSingleColumn ? "hover-layout single-column" : "hover-layout";
      const secondaryColumnHtml = hasLinkedSections || hasTableSections || hasRelatedSections ? `<div class="hover-column stack">
            ${linked_sections_html ? `<div class="hover-card">${linked_sections_html}</div>` : ""}
            ${generic_sections_html ? `<div class="hover-card">${generic_sections_html}</div>` : ""}
            ${related_sections_html ? `<div class="hover-card">${related_sections_html}</div>` : ""}
        </div>` : "";
      const detailBlockHtml = hasDetailSections ? `<div class="hover-card">${detail_sections_html}</div>` : `<div class="hover-card"><div class="hover-empty-note">No additional fields to show for this record.</div></div>`;
      const html = `
            ${render_header(doctype, name, doc, {
        aiPending: false,
        hasStoredAiLayout: has_stored_ai_layout(doctype)
      })}
            <div class="hover-body">
                <div class="${layoutClass}">
                    <div class="hover-column stack">
                        <div class="hover-card hero">${meta_html}</div>
                        ${detailBlockHtml}
                    </div>
                    ${secondaryColumnHtml}
                </div>
            </div>`;
      $hover_popover.html(html);
    }
    function render_ai_popover_content(aiLayout, data, doctype, name) {
      const doc = (data == null ? void 0 : data.doc) || {};
      current_preview = data;
      current_view_mode = "ai";
      const scopedCss = aiLayout.css ? `<style class="hover-ai-style">${aiLayout.css}</style>` : "";
      const currency = doc.currency || doc.default_currency || doc.paid_from_account_currency || doc.paid_to_account_currency || "INR";
      const statusRow = (data.meta_rows || []).find((row) => row.fieldname === "status");
      const status = (statusRow == null ? void 0 : statusRow.value) || doc.status || (doc.disabled ? "Disabled" : "");
      const detailSections = (data.detail_sections || []).map((section) => __spreadProps(__spreadValues({}, section), {
        rows: (section.rows || []).map((row) => __spreadProps(__spreadValues({}, row), { __doc: doc }))
      }));
      const linkedSections = (data.linked_sections || []).map((section) => __spreadProps(__spreadValues({}, section), {
        rows: (section.rows || []).map((row) => __spreadProps(__spreadValues({}, row), { __doc: section.doc || null }))
      }));
      const summaryHtml = (data.meta_rows || []).filter((row) => row.fieldname !== "status").slice(0, 8).map(
        (row) => `<div class="hover-ai-summary-item">
            <span class="hover-ai-label">${esc(row.label)}</span>
            <span class="hover-ai-value">${format_generic_value(row, currency, doc)}</span>
        </div>`
      ).join("");
      const fieldSectionsHtml = detailSections.map((section) => {
        const rowsHtml = (section.rows || []).map(
          (row) => `<div class="hover-ai-field">
                <span class="hover-ai-label">${esc(row.label)}</span>
                <span class="hover-ai-value">${format_generic_value(
            row,
            currency,
            row.__doc
          )}</span>
            </div>`
        ).join("");
        return `<section class="hover-ai-section">
            <div class="hover-ai-section-title">${esc(section.title || "Details")}</div>
            <div class="hover-ai-field-grid">${rowsHtml}</div>
        </section>`;
      }).join("");
      const linkedSectionsHtml = linkedSections.length ? `<section class="hover-ai-section">
            <div class="hover-ai-section-title">Linked Details</div>
            <div class="hover-ai-linked-grid">
                ${linkedSections.map((section) => {
        var _a2;
        const slug = ((_a2 = frappe.router) == null ? void 0 : _a2.slug) ? frappe.router.slug(section.doctype) : "";
        const href = slug ? `/app/${slug}/${encodeURIComponent(section.name)}` : "#";
        const rowsHtml = (section.rows || []).map(
          (row) => `<div class="hover-ai-field">
                            <span class="hover-ai-label">${esc(row.label)}</span>
                            <span class="hover-ai-value">${format_generic_value(
            row,
            currency,
            row.__doc
          )}</span>
                        </div>`
        ).join("");
        return `<div class="hover-ai-linked-card">
                        <div class="hover-ai-section-title">${esc(section.label)}</div>
                        <div class="hover-ai-value"><a href="${href}" target="_blank">${esc(
          section.name
        )}</a></div>
                        <div class="hover-ai-field-grid">${rowsHtml}</div>
                    </div>`;
      }).join("")}
            </div>
        </section>` : "";
      const tableSectionsHtml = [...data.table_sections || [], ...data.related_sections || []].map((section) => {
        const columns = (section.columns || []).slice(0, 4);
        const rows = (section.rows || []).slice(0, 4);
        if (!columns.length || !rows.length)
          return "";
        return `<section class="hover-ai-section hover-ai-table-wrap">
            <div class="hover-ai-section-title">${esc(section.doctype || section.label)}</div>
            <table class="hover-ai-table">
                <thead>
                    <tr>${columns.map((column) => `<th>${esc(column.label)}</th>`).join("")}</tr>
                </thead>
                <tbody>
                    ${rows.map(
          (row) => `<tr>${columns.map(
            (column) => `<td>${format_generic_value(
              {
                value: row[column.fieldname],
                fieldtype: column.fieldtype,
                options: column.options
              },
              currency,
              row
            )}</td>`
          ).join("")}</tr>`
        ).join("")}
                </tbody>
            </table>
        </section>`;
      }).join("");
      const bodyHtml = `
            ${render_header(doctype, name, doc, {
        aiPending: false,
        hasStoredAiLayout: true
      })}
            <div class="hover-body">
                ${scopedCss}
                <div class="hover-ai-shell">
                    <div class="hover-ai-root">
                        <section class="hover-ai-banner">
                            <div class="hover-ai-title">${esc(doctype)}: ${esc(name)}</div>
                            ${status ? `<div class="hover-ai-status"><span class="status-pill ${get_status_class(
        status
      )}">${esc(status)}</span></div>` : ""}
                            <div class="hover-ai-summary">${summaryHtml}</div>
                        </section>
                        <section class="hover-ai-main">
                            <div class="hover-ai-primary">
                                ${fieldSectionsHtml}
                                ${linkedSectionsHtml}
                            </div>
                            <div class="hover-ai-secondary">
                                ${tableSectionsHtml}
                            </div>
                        </section>
                    </div>
                    ${aiLayout.summary ? `<div class="hover-ai-note">${esc(aiLayout.summary)}</div>` : `<div class="hover-ai-note">Gemini formatted this popup using the current record details.</div>`}
                </div>
            </div>`;
      $hover_popover.html(bodyHtml);
    }
    function load_ai_layout(regenerate = true) {
      if (!current_target || !current_preview)
        return;
      const defaultKey = `${current_target.doctype}::${current_target.name}`;
      const aiCacheKey = get_ai_cache_key(current_target.doctype, current_target.name);
      if (!regenerate && ai_cache.has(aiCacheKey)) {
        render_ai_popover_content(
          ai_cache.get(aiCacheKey),
          current_preview,
          current_target.doctype,
          current_target.name
        );
        return;
      }
      ai_request_key = defaultKey;
      $hover_popover.html(
        render_loading_shell(
          current_target.doctype,
          current_target.name,
          current_preview.doc || {},
          true
        )
      );
      frappe.call({
        method: "hover_effect.api.get_hover_ai_layout",
        args: {
          doctype: current_target.doctype,
          name: current_target.name,
          theme_mode: get_current_theme_mode(),
          popup_width: $hover_popover.outerWidth() || 1240,
          popup_height: $hover_popover.outerHeight() || 860,
          regenerate: regenerate ? 1 : 0
        },
        callback: function(r) {
          var _a2, _b;
          if (ai_request_key !== defaultKey || !current_target || current_hovered !== defaultKey)
            return;
          if (!((_a2 = r == null ? void 0 : r.message) == null ? void 0 : _a2.css)) {
            frappe.show_alert({
              message: ((_b = r == null ? void 0 : r.message) == null ? void 0 : _b.error) || __("Gemini could not format this popup."),
              indicator: "orange"
            });
            render_popover_content(current_preview, current_target.doctype, current_target.name);
            return;
          }
          ai_cache.set(aiCacheKey, r.message);
          if (!((hover_config == null ? void 0 : hover_config.stored_ai_layout_doctypes) || []).includes(current_target.doctype)) {
            hover_config.stored_ai_layout_doctypes = [
              ...(hover_config == null ? void 0 : hover_config.stored_ai_layout_doctypes) || [],
              current_target.doctype
            ];
          }
          render_ai_popover_content(
            r.message,
            current_preview,
            current_target.doctype,
            current_target.name
          );
        },
        error: function(xhr) {
          if (ai_request_key !== defaultKey || !current_target || current_hovered !== defaultKey)
            return;
          const message = (xhr == null ? void 0 : xhr.message) || (xhr == null ? void 0 : xhr._server_messages) || __("Gemini formatting failed. Check API key or model configuration.");
          frappe.show_alert({ message, indicator: "red" });
          render_popover_content(current_preview, current_target.doctype, current_target.name);
        }
      });
    }
    function clear_ai_layout() {
      if (!current_target || !current_preview)
        return;
      const doctype = current_target.doctype;
      const aiCacheKey = get_ai_cache_key(doctype, current_target.name);
      frappe.call({
        method: "hover_effect.api.clear_hover_ai_layout",
        args: { doctype },
        callback: function() {
          ai_cache.delete(aiCacheKey);
          hover_config.stored_ai_layout_doctypes = ((hover_config == null ? void 0 : hover_config.stored_ai_layout_doctypes) || []).filter((item) => item !== doctype);
          render_popover_content(current_preview, current_target.doctype, current_target.name);
        },
        error: function(xhr) {
          const message = (xhr == null ? void 0 : xhr.message) || (xhr == null ? void 0 : xhr._server_messages) || __("Could not clear the stored Gemini layout.");
          frappe.show_alert({ message, indicator: "red" });
        }
      });
    }
    function doc_field_link_doctype(field) {
      return (field == null ? void 0 : field.options) || null;
    }
    $hover_popover.on("click", ".hover-close", function(e) {
      e.preventDefault();
      e.stopPropagation();
      hide_hover_popover();
    });
    $hover_popover.on("click", ".hover-ai-button", function(e) {
      e.preventDefault();
      e.stopPropagation();
      load_ai_layout();
    });
    $hover_popover.on("click", ".hover-ai-secondary-button", function(e) {
      e.preventDefault();
      e.stopPropagation();
      clear_ai_layout();
    });
  });
})();
//# sourceMappingURL=hoverssss.bundle.CPZBZAD4.js.map
