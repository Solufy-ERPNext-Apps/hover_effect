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
  frappe.provide("hover_effect");
  $(document).ready(function() {
    const SUPPORTED_DOCTYPES = [
      "Sales Invoice",
      "Purchase Invoice",
      "Sales Order",
      "Purchase Order",
      "Customer",
      "Supplier",
      "Payment Entry"
    ];
    let current_list_doctype = null;
    let hover_timeout = null;
    let current_hovered = null;
    let active_dialog = null;
    let active_vue_app = null;
    frappe.router.on("change", () => {
      const route = frappe.get_route();
      if (route[0] !== "List") {
        destroy_dialog();
        return;
      }
      const new_doctype = route[1];
      if (!current_list_doctype) {
        current_list_doctype = new_doctype;
        destroy_dialog();
        return;
      }
      if (current_list_doctype !== new_doctype) {
        current_list_doctype = new_doctype;
        destroy_dialog();
        location.reload();
      }
    });
    $(document).on("mouseenter", "a.filterable.ellipsis", function() {
      var _a;
      clearTimeout(hover_timeout);
      const doctype = cur_list ? cur_list.doctype : null;
      if (!doctype || !cur_list || !cur_list.data)
        return;
      if (!SUPPORTED_DOCTYPES.includes(doctype))
        return;
      const $row = $(this).closest(".list-row");
      let docname = $row.attr("data-name");
      if (!docname) {
        const idx = $(".list-row").index($row);
        docname = (_a = cur_list.data[idx]) == null ? void 0 : _a.name;
      }
      if (!docname)
        return;
      if (current_hovered === docname)
        return;
      current_hovered = docname;
      hover_timeout = setTimeout(() => {
        open_hover_dialog(doctype, docname);
      }, 350);
    });
    $(document).on("mouseleave", ".list-row", function() {
      clearTimeout(hover_timeout);
    });
    $(document).on("keydown.hover_effect", function(e) {
      if (e.key === "Escape") {
        destroy_dialog();
      }
    });
    function destroy_dialog() {
      if (active_vue_app) {
        active_vue_app.unmount();
        active_vue_app = null;
      }
      if (active_dialog) {
        active_dialog.hide();
        if (active_dialog.$wrapper) {
          active_dialog.$wrapper.remove();
        }
        active_dialog = null;
      }
      current_hovered = null;
    }
    function get_status_dot_class(status) {
      const value = (status || "").toLowerCase();
      if (["paid", "submitted", "active", "completed", "closed"].includes(value)) {
        return "bg-green-500";
      }
      if ([
        "to bill",
        "to deliver",
        "to receive",
        "to pay",
        "partially paid",
        "to deliver and bill",
        "to receive and bill"
      ].includes(value)) {
        return "bg-blue-500";
      }
      if (["unpaid", "partly paid", "on hold"].includes(value)) {
        return "bg-orange-400";
      }
      if (["overdue", "cancelled", "return"].includes(value)) {
        return "bg-red-500";
      }
      return "bg-gray-400";
    }
    function make_doc_route(doctype, name) {
      const slug = frappe.router.slug(doctype);
      return `/app/${slug}/${encodeURIComponent(name)}`;
    }
    function map_items_to_rows(items) {
      return (items || []).map((item, index) => ({
        id: index + 1,
        name: {
          label: item.item_name || item.item_code || "\u2014",
          image: null
        },
        email: item.item_code || "\u2014",
        role: {
          label: item.qty != null ? `Qty: ${item.qty}` : "\u2014",
          color: "blue"
        },
        status: {
          label: item.amount != null ? `Amt: ${item.amount}` : "\u2014",
          bg_color: "bg-blue-500"
        },
        raw: item
      }));
    }
    function map_gl_to_rows(gl_entries) {
      return (gl_entries || []).map((entry, index) => ({
        id: index + 1,
        name: {
          label: entry.account || "\u2014",
          image: null
        },
        email: entry.remarks || "\u2014",
        role: {
          label: `Dr: ${entry.debit || 0}`,
          color: "green"
        },
        status: {
          label: `Cr: ${entry.credit || 0}`,
          bg_color: "bg-orange-400"
        },
        raw: entry
      }));
    }
    function map_payment_accounts_to_rows(accounts) {
      return (accounts || []).map((entry, index) => ({
        id: index + 1,
        name: {
          label: entry.account || "\u2014",
          image: null
        },
        email: "Account",
        role: {
          label: `Debit: ${entry.debit_in_account_currency || 0}`,
          color: "green"
        },
        status: {
          label: `Credit: ${entry.credit_in_account_currency || 0}`,
          bg_color: "bg-blue-500"
        },
        raw: entry
      }));
    }
    function map_docs_to_rows(rows, doctype) {
      return (rows || []).map((row, index) => ({
        id: index + 1,
        name: {
          label: row.name || "\u2014",
          image: null
        },
        email: row.posting_date || row.transaction_date || row.delivery_date || row.schedule_date || "\u2014",
        role: {
          label: row.customer_name || row.customer || row.supplier_name || row.supplier || row.mode_of_payment || row.payment_type || "\u2014",
          color: "gray"
        },
        status: {
          label: row.status || row.payment_type || "\u2014",
          bg_color: get_status_dot_class(row.status || row.payment_type)
        },
        raw: __spreadProps(__spreadValues({}, row), {
          route: make_doc_route(doctype, row.name)
        })
      }));
    }
    function make_rows_from_response(data, doctype) {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
      if (["Sales Invoice", "Purchase Invoice", "Sales Order", "Purchase Order"].includes(doctype) && ((_a = data.items) == null ? void 0 : _a.length)) {
        return map_items_to_rows(data.items);
      }
      if (doctype === "Payment Entry" && ((_b = data.accounts) == null ? void 0 : _b.length)) {
        return map_payment_accounts_to_rows(data.accounts);
      }
      if ((_c = data.gl_entries) == null ? void 0 : _c.length) {
        return map_gl_to_rows(data.gl_entries);
      }
      if (doctype === "Customer") {
        if ((_d = data.sales_invoices) == null ? void 0 : _d.length) {
          return map_docs_to_rows(data.sales_invoices, "Sales Invoice");
        }
        if ((_e = data.sales_orders) == null ? void 0 : _e.length) {
          return map_docs_to_rows(data.sales_orders, "Sales Order");
        }
        if ((_f = data.delivery_notes) == null ? void 0 : _f.length) {
          return map_docs_to_rows(data.delivery_notes, "Delivery Note");
        }
        if ((_g = data.payments) == null ? void 0 : _g.length) {
          return map_docs_to_rows(data.payments, "Payment Entry");
        }
      }
      if (doctype === "Supplier") {
        if ((_h = data.purchase_invoices) == null ? void 0 : _h.length) {
          return map_docs_to_rows(data.purchase_invoices, "Purchase Invoice");
        }
        if ((_i = data.purchase_orders) == null ? void 0 : _i.length) {
          return map_docs_to_rows(data.purchase_orders, "Purchase Order");
        }
        if ((_j = data.purchase_receipts) == null ? void 0 : _j.length) {
          return map_docs_to_rows(data.purchase_receipts, "Purchase Receipt");
        }
        if ((_k = data.payments) == null ? void 0 : _k.length) {
          return map_docs_to_rows(data.payments, "Payment Entry");
        }
      }
      return [
        {
          id: 1,
          name: {
            label: ((_l = data.doc) == null ? void 0 : _l.name) || "No Data",
            image: null
          },
          email: ((_m = data.doc) == null ? void 0 : _m.owner) || "\u2014",
          role: {
            label: ((_n = data.doc) == null ? void 0 : _n.doctype) || doctype,
            color: "gray"
          },
          status: {
            label: ((_o = data.doc) == null ? void 0 : _o.status) || "Loaded",
            bg_color: get_status_dot_class((_p = data.doc) == null ? void 0 : _p.status)
          },
          raw: data.doc || {}
        }
      ];
    }
    function open_hover_dialog(doctype, name) {
      destroy_dialog();
      active_dialog = new frappe.ui.Dialog({
        title: `${doctype}: ${name}`,
        size: "extra-large",
        fields: [
          {
            fieldtype: "HTML",
            fieldname: "hover_mount"
          }
        ],
        primary_action_label: "Close",
        primary_action() {
          destroy_dialog();
        }
      });
      active_dialog.show();
      if (active_dialog.$wrapper) {
        active_dialog.$wrapper.find(".modal-dialog").css("max-width", "1200px");
      }
      const wrapper = active_dialog.fields_dict.hover_mount.$wrapper[0];
      wrapper.innerHTML = `
      <div id="hover-effect-vue-root" style="min-height: 560px; display: flex; align-items: center; justify-content: center;">
        <div style="font-size: 14px; color: #6b7280;">Loading...</div>
      </div>
    `;
      frappe.call({
        method: "hover_effect.api.get_hover_details",
        args: { doctype, name },
        callback: function(r) {
          const data = r && r.message ? r.message : {};
          const rows = make_rows_from_response(data, doctype);
          const mountEl = wrapper.querySelector("#hover-effect-vue-root");
          if (!mountEl)
            return;
          if (typeof window.mountHoverEffectListView !== "function") {
            mountEl.innerHTML = `
            <div style="padding: 20px; color: red;">
              Frappe UI bundle not loaded
            </div>
          `;
            return;
          }
          active_vue_app = window.mountHoverEffectListView(mountEl, {
            title: `${doctype} - ${name}`,
            rows
          });
        },
        error: function() {
          wrapper.innerHTML = `
          <div style="padding: 20px; color: red;">
            Failed to load data
          </div>
        `;
        }
      });
      if (active_dialog.$wrapper) {
        active_dialog.$wrapper.on("hidden.bs.modal", function() {
          destroy_dialog();
        });
      }
    }
  });
})();
//# sourceMappingURL=hoverssss.bundle.HE7SW2U4.js.map
