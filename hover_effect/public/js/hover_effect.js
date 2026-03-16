frappe.provide("hover_effect");

(function inject_hover_styles() {
    if (document.getElementById("hover-effect-styles")) return;

    const css = `
        /* ── Backdrop ── */
        #hover-effect-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9998;
            background: rgba(0,0,0,0.18);
        }
        #hover-effect-backdrop.visible { display: block; }

        /* ── Popover ── */
        #custom-hover-popover {
            position: fixed;
            z-index: 9999;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 92vw;
            max-width: 1100px;
            height: 82vh;
            max-height: 820px;
            display: flex;
            flex-direction: column;
            background: #fff;
            border: 1px solid #d1d8dd;
            border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08);
            font-family: inherit;
            font-size: 13px;
            color: #36414c;
            overflow: hidden;
        }
        #custom-hover-popover.hidden { display: none; }
        #hover-effect-backdrop.hidden { display: none !important; }

        /* ── Header ── */
        .hover-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px 12px;
            border-bottom: 1px solid #ebeef0;
            flex-shrink: 0;
            background: #fff;
        }
        .hover-title { font-size: 15px; font-weight: 600; min-width: 0; flex: 1; }
        .hover-title a { color: #2490ef; text-decoration: none; }
        .hover-title a:hover { text-decoration: underline; }
        .hover-docname { font-weight: 700; }
        .hover-close {
            flex-shrink: 0; margin-left: 14px; background: none; border: none;
            cursor: pointer; font-size: 18px; color: #8d99a6; line-height: 1;
            padding: 3px 8px; border-radius: 4px; transition: background 0.15s, color 0.15s;
        }
        .hover-close:hover { background: #f4f5f6; color: #36414c; }

        /* ── Scroll body ── */
        .hover-body {
            flex: 1;
            overflow-y: auto;
            padding: 16px 20px 20px;
        }
        .hover-body::-webkit-scrollbar { width: 6px; }
        .hover-body::-webkit-scrollbar-track { background: transparent; }
        .hover-body::-webkit-scrollbar-thumb { background: #d1d8dd; border-radius: 4px; }

        /* ── Meta grid ── */
        .hover-meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 10px 24px;
            padding-bottom: 14px;
            border-bottom: 1px solid #ebeef0;
            margin-bottom: 16px;
        }
        .hover-meta-item { display: flex; flex-direction: column; gap: 2px; }
        .hover-meta-label { font-size: 11px; font-weight: 600; color: #8d99a6; text-transform: uppercase; letter-spacing: 0.5px; }
        .hover-meta-value { font-size: 13.5px; color: #36414c; }
        .hover-meta-value.hover-bold { font-size: 15px; font-weight: 700; color: #1a1a1a; }

        /* ── Summary cards ── */
        .hover-summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin-bottom: 18px;
        }
        .hover-summary-card {
            background: #f8fafb;
            border: 1px solid #ebeef0;
            border-radius: 7px;
            padding: 10px 14px;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .hover-summary-card.danger { border-color: #f5c6cb; background: #fff5f5; }
        .hover-summary-card.warning { border-color: #ffeaa7; background: #fffdf0; }
        .hover-summary-card-label { font-size: 10.5px; font-weight: 600; color: #8d99a6; text-transform: uppercase; letter-spacing: 0.4px; }
        .hover-summary-card-value { font-size: 16px; font-weight: 700; color: #1a1a1a; }
        .hover-summary-card-count { font-size: 11px; color: #8d99a6; }
        .hover-summary-card.danger .hover-summary-card-value { color: #c0392b; }
        .hover-summary-card.warning .hover-summary-card-value { color: #856404; }

        /* ── Sections ── */
        .hover-section { margin-bottom: 18px; }
        .hover-section:last-child { margin-bottom: 0; }
        .hover-section-title {
            font-size: 11.5px; font-weight: 700; color: #36414c;
            text-transform: uppercase; letter-spacing: 0.6px;
            margin-bottom: 8px; padding-bottom: 5px;
            border-bottom: 2px solid #ebeef0;
        }

        /* ── Table ── */
        .hover-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .hover-table thead th {
            text-align: left; font-weight: 600; font-size: 12px; color: #8d99a6;
            padding: 6px 10px 6px 0; border-bottom: 1px solid #ebeef0; white-space: nowrap;
        }
        .hover-table thead th.num,
        .hover-table tbody td.num,
        .hover-table tfoot  td.num { text-align: right; }
        .hover-table tbody tr { transition: background 0.1s; }
        .hover-table tbody tr:hover { background: #f5f8ff; }
        .hover-table tbody td {
            padding: 7px 10px 7px 0; border-bottom: 1px solid #f4f5f6;
            color: #36414c; vertical-align: middle;
        }
        .hover-table tbody td.remarks { color: #8d99a6; font-size: 12px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hover-table tbody td a { color: #2490ef; text-decoration: none; }
        .hover-table tbody td a:hover { text-decoration: underline; }
        .hover-table tfoot .total-row td {
            padding: 8px 10px 5px 0; border-top: 2px solid #d1d8dd;
            font-size: 13px; font-weight: 700; color: #1a1a1a;
        }

        /* ── Status pills ── */
        .status-pill {
            display: inline-block; padding: 2px 9px; border-radius: 10px;
            font-size: 11px; font-weight: 600; letter-spacing: 0.2px; white-space: nowrap;
        }
        .status-green  { background: #d4edda; color: #155724; }
        .status-blue   { background: #cce5ff; color: #004085; }
        .status-orange { background: #fff3cd; color: #856404; }
        .status-red    { background: #f8d7da; color: #721c24; }
        .status-grey   { background: #e9ecef; color: #495057; }

        /* ── Loading ── */
        .hover-loading {
            display: flex; align-items: center; justify-content: center;
            gap: 12px; padding: 60px 20px; color: #8d99a6; font-size: 14px;
            flex: 1;
        }
        .hover-spinner {
            width: 20px; height: 20px; border: 2px solid #d1d8dd;
            border-top-color: #2490ef; border-radius: 50%;
            animation: hover-spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes hover-spin { to { transform: rotate(360deg); } }
        .hover-error { padding: 40px; color: #b94a48; font-size: 14px; text-align: center; }
    `;

    const style = document.createElement("style");
    style.id = "hover-effect-styles";
    style.textContent = css;
    document.head.appendChild(style);
})();


$(document).ready(function () {

    let current_list_doctype = null;

    frappe.router.on('change', () => {

        const route = frappe.get_route();

        if (route[0] !== "List") return;

        const new_doctype = route[1];

        if (!current_list_doctype) {
            current_list_doctype = new_doctype;
            return;
        }

        if (current_list_doctype !== new_doctype) {
            location.reload();
        }

    });

    const SUPPORTED_DOCTYPES = [
        "Sales Invoice", "Purchase Invoice",
        "Sales Order", "Purchase Order",
        "Customer", "Supplier", "Payment Entry"
    ];

    let hover_timeout;
    let current_hovered = null;

    /* ── Backdrop + Popover ── */
    const $backdrop = $(`<div id="hover-effect-backdrop" class="hidden"></div>`).appendTo("body");
    const $hover_popover = $(`<div id="custom-hover-popover" class="hidden"></div>`).appendTo("body");

    /* ── Hover trigger ── */
    $(document).on("mouseenter", "a.filterable.ellipsis", function (e) {
        clearTimeout(hover_timeout);
        let doctype = cur_list ? cur_list.doctype : null;
        if (!doctype || !cur_list.data) return;
        if (!SUPPORTED_DOCTYPES.includes(doctype)) return;

        let $row = $(this).closest(".list-row");
        let docname = $row.attr("data-name");
        if (!docname) {
            let idx = $(".list-row").index($row);
            docname = cur_list.data[idx]?.name;
        }
        if (!docname || current_hovered === docname) return;
        current_hovered = docname;

        hover_timeout = setTimeout(() => show_hover_popover(doctype, docname), 350);
    });

    /* ── Hide on list row leave ── */
    $(document).on("mouseleave", ".list-row", function () {
        clearTimeout(hover_timeout);
    });

    /* ── Close on backdrop click ── */
    $backdrop.on("click", hide_hover_popover);

    /* ── Close on Escape ── */
    $(document).on("keydown.hover_effect", function (e) {
        if (e.key === "Escape") hide_hover_popover();
    });

    /* ── Prevent popover clicks from bubbling ── */
    $hover_popover.on("click", function (e) { e.stopPropagation(); });


    /* ── Show ── */
    function show_hover_popover(doctype, name) {
        $backdrop.removeClass("hidden").addClass("visible");
        $hover_popover
            .removeClass("hidden")
            .html(`<div class="hover-header"><div class="hover-title">${frappe.utils.escape_html(doctype)}: <span class="hover-docname">${frappe.utils.escape_html(name)}</span></div><button class="hover-close" title="Close">&#x2715;</button></div><div class="hover-loading"><div class="hover-spinner"></div><span>Loading…</span></div>`);

        frappe.call({
            method: "hover_effect.api.get_hover_details",
            args: { doctype, name },
            callback: function (r) {
                if (!r || !r.message) {
                    $hover_popover.html(`<div class="hover-error">Could not load details.</div>`);
                    return;
                }
                render_popover_content(r.message, doctype, name);
            }
        });
    }

    /* ── Hide ── */
    function hide_hover_popover() {
        $backdrop.removeClass("visible").addClass("hidden");
        $hover_popover.addClass("hidden").html("");
        current_hovered = null;
    }


    /* ── Helpers ── */
    function fmt_currency(val, currency) {
        if (val === undefined || val === null || val === "") return "—";
        const num = parseFloat(val);
        if (isNaN(num)) return "—";
        const f = num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return currency ? `${currency} ${f}` : f;
    }

    function fmt_date(val) {
        if (!val) return "—";
        try { return frappe.datetime.str_to_user(val) || val; } catch (_) { return val; }
    }

    function esc(v) { return frappe.utils.escape_html(String(v || "")); }

    function get_status_class(status) {
        const map = {
            "Paid": "status-green", "Submitted": "status-green", "Active": "status-green",
            "Completed": "status-green", "Closed": "status-green",
            "To Deliver and Bill": "status-blue", "To Bill": "status-blue",
            "To Deliver": "status-blue", "To Receive and Bill": "status-blue",
            "To Receive": "status-blue", "To Pay": "status-blue", "Partially Paid": "status-blue",
            "Unpaid": "status-orange", "Partly Paid": "status-orange", "On Hold": "status-orange",
            "Overdue": "status-red", "Cancelled": "status-red", "Return": "status-red",
            "Draft": "status-grey", "Disabled": "status-grey",
        };
        return map[status] || "status-grey";
    }

    function make_doc_table(rows, cols) {
        if (!rows || !rows.length) return `<div style="color:#8d99a6;font-size:12px;padding:6px 0">No records found</div>`;
        const thead = cols.map(c => `<th class="${c.cls || ""}">${c.label}</th>`).join("");
        const tbody = rows.map(row => `<tr>${cols.map(c => `<td class="${c.cls || ""}">${c.render(row)}</td>`).join("")}</tr>`).join("");
        return `<table class="hover-table"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
    }

    function render_doc_section(title, rows, cols) {
        if (!rows) return "";
        return `<div class="hover-section"><div class="hover-section-title">${title}</div>${make_doc_table(rows, cols)}</div>`;
    }

    function render_summary_cards(cards) {
        return `<div class="hover-summary-cards">${cards.map(c => `
            <div class="hover-summary-card ${c.cls || ""}">
                <span class="hover-summary-card-label">${c.label}</span>
                <span class="hover-summary-card-value">${c.value}</span>
                <span class="hover-summary-card-count">${c.count}</span>
            </div>`).join("")}</div>`;
    }


    /* ── Render ── */
    function render_popover_content(data, doctype, name) {
        const doc = data.doc || {};
        const currency = doc.currency || doc.default_currency || "INR";

        let party_label = "", party_name = "", meta_rows = [];

        if (doctype === "Sales Invoice") {
            party_label = "Customer";
            party_name = doc.customer_name || doc.customer || "";
            meta_rows = [
                { label: "Date", value: fmt_date(doc.posting_date) },
                { label: "Due Date", value: fmt_date(doc.due_date) },
                { label: "Grand Total", value: fmt_currency(doc.grand_total, currency), bold: true },
                { label: "Outstanding", value: fmt_currency(doc.outstanding_amount, currency) },
            ];
        } else if (doctype === "Purchase Invoice") {
            party_label = "Supplier";
            party_name = doc.supplier_name || doc.supplier || "";
            meta_rows = [
                { label: "Date", value: fmt_date(doc.posting_date) },
                { label: "Due Date", value: fmt_date(doc.due_date) },
                { label: "Grand Total", value: fmt_currency(doc.grand_total, currency), bold: true },
                { label: "Outstanding", value: fmt_currency(doc.outstanding_amount, currency) },
            ];
        } else if (doctype === "Sales Order") {
            party_label = "Customer";
            party_name = doc.customer_name || doc.customer || "";
            meta_rows = [
                { label: "Date", value: fmt_date(doc.transaction_date) },
                { label: "Delivery", value: fmt_date(doc.delivery_date) },
                { label: "Grand Total", value: fmt_currency(doc.grand_total, currency), bold: true },
                { label: "Advance Paid", value: fmt_currency(doc.advance_paid, currency) },
            ];
        } else if (doctype === "Purchase Order") {
            party_label = "Supplier";
            party_name = doc.supplier_name || doc.supplier || "";
            meta_rows = [
                { label: "Date", value: fmt_date(doc.transaction_date) },
                { label: "Required By", value: fmt_date(doc.schedule_date) },
                { label: "Grand Total", value: fmt_currency(doc.grand_total, currency), bold: true },
                { label: "Advance Paid", value: fmt_currency(doc.advance_paid, currency) },
            ];
        } else if (doctype === "Payment Entry") {
            party_label = "Party";
            party_name = doc.party_name || doc.party || "";
            meta_rows = [
                { label: "Date", value: fmt_date(doc.posting_date) },
                { label: "Mode", value: doc.mode_of_payment || "—" },
                { label: "Paid Amount", value: fmt_currency(doc.paid_amount, currency), bold: true },
                { label: "Type", value: doc.payment_type || "—" },
            ];
        } else if (doctype === "Customer") {
            party_label = "Customer Group";
            party_name = doc.customer_group || "";
            meta_rows = [
                { label: "Territory", value: doc.territory || "—" },
                { label: "Type", value: doc.customer_type || "—" },
                { label: "Tax ID", value: doc.tax_id || "—" },
                { label: "Email", value: doc.email_id || "—" },
                { label: "Mobile", value: doc.mobile_no || "—" },
                { label: "Payment Terms", value: doc.payment_terms || "—" },
            ];
        } else if (doctype === "Supplier") {
            party_label = "Supplier Group";
            party_name = doc.supplier_group || "";
            meta_rows = [
                { label: "Type", value: doc.supplier_type || "—" },
                { label: "Country", value: doc.country || "—" },
                { label: "Tax ID", value: doc.tax_id || "—" },
                { label: "Email", value: doc.email_id || "—" },
                { label: "Mobile", value: doc.mobile_no || "—" },
                { label: "Payment Terms", value: doc.payment_terms || "—" },
            ];
        }

        const status = doc.status || (doc.disabled ? "Disabled" : "");
        const status_cls = get_status_class(status);

        const meta_html = `
            <div class="hover-meta-grid">
                ${party_label ? `<div class="hover-meta-item"><span class="hover-meta-label">${party_label}</span><span class="hover-meta-value">${esc(party_name || "—")}</span></div>` : ""}
                ${status ? `<div class="hover-meta-item"><span class="hover-meta-label">Status</span><span class="hover-meta-value"><span class="status-pill ${status_cls}">${esc(status)}</span></span></div>` : ""}
                ${meta_rows.map(r => `<div class="hover-meta-item"><span class="hover-meta-label">${r.label}</span><span class="hover-meta-value ${r.bold ? "hover-bold" : ""}">${r.value}</span></div>`).join("")}
            </div>`;

        /* ── Items ── */
        let items_html = "";
        if (data.items?.length) {
            let tq = 0, ta = 0;
            const rows = data.items.map(i => { tq += parseFloat(i.qty || 0); ta += parseFloat(i.amount || 0); return i; });
            items_html = `<div class="hover-section"><div class="hover-section-title">Items</div>
                <table class="hover-table">
                    <thead><tr><th>Item Name</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
                    <tbody>${rows.map(i => `<tr>
                        <td>${esc(i.item_name || i.item_code || "—")}</td>
                        <td class="num">${i.qty ?? "—"}</td>
                        <td class="num">${fmt_currency(i.rate, currency)}</td>
                        <td class="num">${fmt_currency(i.amount, currency)}</td>
                    </tr>`).join("")}</tbody>
                    <tfoot><tr class="total-row"><td><b>Total</b></td><td class="num"><b>${tq}</b></td><td></td><td class="num"><b>${fmt_currency(ta, currency)}</b></td></tr></tfoot>
                </table></div>`;
        }

        /* ── GL Entries ── */
        let gl_html = "";
        if (data.gl_entries?.length) {
            let td = 0, tc = 0;
            const rows = data.gl_entries.map(g => { td += parseFloat(g.debit || 0); tc += parseFloat(g.credit || 0); return g; });
            gl_html = `<div class="hover-section"><div class="hover-section-title">GL Entries</div>
                <table class="hover-table">
                    <thead><tr><th>Account</th><th class="num">Debit</th><th class="num">Credit</th><th>Remarks</th></tr></thead>
                    <tbody>${rows.map(g => `<tr>
                        <td>${esc(g.account || "—")}</td>
                        <td class="num">${fmt_currency(g.debit)}</td>
                        <td class="num">${fmt_currency(g.credit)}</td>
                        <td class="remarks">${esc(g.remarks || "No Remarks")}</td>
                    </tr>`).join("")}</tbody>
                    <tfoot><tr class="total-row"><td><b>Total</b></td><td class="num"><b>${fmt_currency(td)}</b></td><td class="num"><b>${fmt_currency(tc)}</b></td><td></td></tr></tfoot>
                </table></div>`;
        }

        /* ── Payment Entry accounts ── */
        let accounts_html = "";
        if (doctype === "Payment Entry" && data.accounts?.length) {
            accounts_html = `<div class="hover-section"><div class="hover-section-title">Accounts</div>
                <table class="hover-table">
                    <thead><tr><th>Account</th><th class="num">Debit</th><th class="num">Credit</th></tr></thead>
                    <tbody>${data.accounts.map(a => `<tr>
                        <td>${esc(a.account || "—")}</td>
                        <td class="num">${fmt_currency(a.debit_in_account_currency, currency)}</td>
                        <td class="num">${fmt_currency(a.credit_in_account_currency, currency)}</td>
                    </tr>`).join("")}</tbody>
                </table></div>`;
        }

        /* ── Customer sections ── */
        let party_html = "";
        if (doctype === "Customer" && data.summary) {
            const s = data.summary;
            party_html += render_summary_cards([
                { label: "Total Billed", value: fmt_currency(s.total_billed, currency), count: `${s.si_count} invoice${s.si_count !== 1 ? "s" : ""}` },
                { label: "Outstanding", value: fmt_currency(s.total_outstanding, currency), count: "unpaid balance", cls: s.total_outstanding > 0 ? "warning" : "" },
                { label: "Overdue", value: s.overdue_count, count: `invoice${s.overdue_count !== 1 ? "s" : ""}`, cls: s.overdue_count > 0 ? "danger" : "" },
                { label: "Total Orders", value: fmt_currency(s.total_ordered, currency), count: `${s.so_count} order${s.so_count !== 1 ? "s" : ""}` },
                { label: "Total Paid", value: fmt_currency(s.total_paid, currency), count: `${s.pe_count} payment${s.pe_count !== 1 ? "s" : ""}` },
                { label: "Deliveries", value: s.dn_count, count: "delivery notes" },
            ]);
            party_html += render_doc_section("Sales Invoices", data.sales_invoices, [
                { label: "Invoice", render: r => `<a href="/app/sales-invoice/${encodeURIComponent(r.name)}" target="_blank">${esc(r.name)}</a>` },
                { label: "Date", render: r => fmt_date(r.posting_date) },
                { label: "Due", render: r => fmt_date(r.due_date) },
                { label: "Amount", render: r => fmt_currency(r.grand_total, r.currency), cls: "num" },
                { label: "Outstanding", render: r => fmt_currency(r.outstanding_amount, r.currency), cls: "num" },
                { label: "Status", render: r => `<span class="status-pill ${get_status_class(r.status)}">${esc(r.status || "—")}</span>` },
            ]);
            party_html += render_doc_section("Sales Orders", data.sales_orders, [
                { label: "Order", render: r => `<a href="/app/sales-order/${encodeURIComponent(r.name)}" target="_blank">${esc(r.name)}</a>` },
                { label: "Date", render: r => fmt_date(r.transaction_date) },
                { label: "Delivery", render: r => fmt_date(r.delivery_date) },
                { label: "Amount", render: r => fmt_currency(r.grand_total, r.currency), cls: "num" },
                { label: "Advance", render: r => fmt_currency(r.advance_paid, r.currency), cls: "num" },
                { label: "Status", render: r => `<span class="status-pill ${get_status_class(r.status)}">${esc(r.status || "—")}</span>` },
            ]);
            party_html += render_doc_section("Delivery Notes", data.delivery_notes, [
                { label: "Note", render: r => `<a href="/app/delivery-note/${encodeURIComponent(r.name)}" target="_blank">${esc(r.name)}</a>` },
                { label: "Date", render: r => fmt_date(r.posting_date) },
                { label: "Amount", render: r => fmt_currency(r.grand_total, r.currency), cls: "num" },
                { label: "Status", render: r => `<span class="status-pill ${get_status_class(r.status)}">${esc(r.status || "—")}</span>` },
            ]);
            party_html += render_doc_section("Payments", data.payments, [
                { label: "Entry", render: r => `<a href="/app/payment-entry/${encodeURIComponent(r.name)}" target="_blank">${esc(r.name)}</a>` },
                { label: "Date", render: r => fmt_date(r.posting_date) },
                { label: "Mode", render: r => esc(r.mode_of_payment || "—") },
                { label: "Amount", render: r => fmt_currency(r.paid_amount, r.currency), cls: "num" },
                { label: "Type", render: r => esc(r.payment_type || "—") },
            ]);
        }

        /* ── Supplier sections ── */
        if (doctype === "Supplier" && data.summary) {
            const s = data.summary;
            party_html += render_summary_cards([
                { label: "Total Billed", value: fmt_currency(s.total_billed, currency), count: `${s.pi_count} invoice${s.pi_count !== 1 ? "s" : ""}` },
                { label: "Outstanding", value: fmt_currency(s.total_outstanding, currency), count: "unpaid balance", cls: s.total_outstanding > 0 ? "warning" : "" },
                { label: "Overdue", value: s.overdue_count, count: `invoice${s.overdue_count !== 1 ? "s" : ""}`, cls: s.overdue_count > 0 ? "danger" : "" },
                { label: "Total Orders", value: fmt_currency(s.total_ordered, currency), count: `${s.po_count} order${s.po_count !== 1 ? "s" : ""}` },
                { label: "Total Paid", value: fmt_currency(s.total_paid, currency), count: `${s.pe_count} payment${s.pe_count !== 1 ? "s" : ""}` },
                { label: "Receipts", value: s.pr_count, count: "purchase receipts" },
            ]);
            party_html += render_doc_section("Purchase Invoices", data.purchase_invoices, [
                { label: "Invoice", render: r => `<a href="/app/purchase-invoice/${encodeURIComponent(r.name)}" target="_blank">${esc(r.name)}</a>` },
                { label: "Date", render: r => fmt_date(r.posting_date) },
                { label: "Due", render: r => fmt_date(r.due_date) },
                { label: "Amount", render: r => fmt_currency(r.grand_total, r.currency), cls: "num" },
                { label: "Outstanding", render: r => fmt_currency(r.outstanding_amount, r.currency), cls: "num" },
                { label: "Status", render: r => `<span class="status-pill ${get_status_class(r.status)}">${esc(r.status || "—")}</span>` },
            ]);
            party_html += render_doc_section("Purchase Orders", data.purchase_orders, [
                { label: "Order", render: r => `<a href="/app/purchase-order/${encodeURIComponent(r.name)}" target="_blank">${esc(r.name)}</a>` },
                { label: "Date", render: r => fmt_date(r.transaction_date) },
                { label: "Required", render: r => fmt_date(r.schedule_date) },
                { label: "Amount", render: r => fmt_currency(r.grand_total, r.currency), cls: "num" },
                { label: "Advance", render: r => fmt_currency(r.advance_paid, r.currency), cls: "num" },
                { label: "Status", render: r => `<span class="status-pill ${get_status_class(r.status)}">${esc(r.status || "—")}</span>` },
            ]);
            party_html += render_doc_section("Purchase Receipts", data.purchase_receipts, [
                { label: "Receipt", render: r => `<a href="/app/purchase-receipt/${encodeURIComponent(r.name)}" target="_blank">${esc(r.name)}</a>` },
                { label: "Date", render: r => fmt_date(r.posting_date) },
                { label: "Amount", render: r => fmt_currency(r.grand_total, r.currency), cls: "num" },
                { label: "Status", render: r => `<span class="status-pill ${get_status_class(r.status)}">${esc(r.status || "—")}</span>` },
            ]);
            party_html += render_doc_section("Payments", data.payments, [
                { label: "Entry", render: r => `<a href="/app/payment-entry/${encodeURIComponent(r.name)}" target="_blank">${esc(r.name)}</a>` },
                { label: "Date", render: r => fmt_date(r.posting_date) },
                { label: "Mode", render: r => esc(r.mode_of_payment || "—") },
                { label: "Amount", render: r => fmt_currency(r.paid_amount, r.currency), cls: "num" },
                { label: "Type", render: r => esc(r.payment_type || "—") },
            ]);
        }

        const slug = frappe.router.slug(doctype);

        const html = `
            <div class="hover-header">
                <div class="hover-title">
                    <a href="/app/${slug}/${encodeURIComponent(name)}" target="_blank" title="Open ${esc(name)}">
                        ${esc(doctype)}: <span class="hover-docname">${esc(name)}</span>
                    </a>
                </div>
                <button class="hover-close" title="Close">&#x2715;</button>
            </div>
            <div class="hover-body">
                ${meta_html}
                ${items_html}
                ${accounts_html}
                ${gl_html}
                ${party_html}
            </div>`;

        $hover_popover.html(html);
    }

    /* ── Close button ── */
    $hover_popover.on("click", ".hover-close", function (e) {
        e.preventDefault();
        e.stopPropagation();
        hide_hover_popover();
    });

});