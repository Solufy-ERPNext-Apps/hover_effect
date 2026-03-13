(() => {
  // ../hover_effect/hover_effect/public/js/hovers.bundle.js
  frappe.provide("hover_effect");
  $(document).ready(function() {
    let hover_timeout;
    let $hover_popover = $('<div id="custom-hover-popover" class="custom-hover-popover hidden"></div>').appendTo("body");
    let current_hovered = null;
    $(document).on("mouseenter", ".list-row-container", function(e) {
      if (!cur_list || !cur_list.doctype)
        return;
      let name = $(this).attr("data-name") || $(this).find(".list-row").attr("data-name");
      if (!name) {
        let $id_link = $(this).find(".list-row-col .list-subject a, a.name");
        if ($id_link.length)
          name = $id_link.text().trim();
      }
      if (!name)
        return;
      clearTimeout(hover_timeout);
      hover_timeout = setTimeout(() => {
        current_hovered = name;
        show_hover_popover(cur_list.doctype, name, e.clientX, e.clientY);
      }, 600);
    });
    $(document).on("mouseleave", ".list-row-container", function() {
      clearTimeout(hover_timeout);
      setTimeout(() => {
        if (!$hover_popover.is(":hover")) {
          hide_hover_popover();
        }
      }, 120);
    });
    $hover_popover.on("mouseleave", function() {
      hide_hover_popover();
    });
    $(document).on("mousedown", function(e) {
      if ($(e.target).closest(".hover-popover-close").length) {
        hide_hover_popover();
        return;
      }
      if (!$(e.target).closest("#custom-hover-popover").length) {
        hide_hover_popover();
      }
    });
    function show_hover_popover(doctype, name, x, y) {
      $hover_popover.html('<div class="p-4 text-center text-muted"><i class="fa fa-spinner fa-spin"></i> Loading...</div>');
      $hover_popover.css({
        "background": "var(--card-bg, #ffffff)",
        "border-radius": "8px",
        "box-shadow": "0px 10px 30px rgba(0,0,0,0.15)",
        "border": "1px solid var(--border-color, #d1d8dd)",
        "padding": "15px 20px",
        "width": "650px",
        "max-width": "95vw",
        "z-index": "1100",
        "position": "fixed"
      });
      position_popover(x, y);
      $hover_popover.removeClass("hidden");
      frappe.call({
        method: "hover_effect.api.get_hover_details",
        args: { doctype, name },
        callback: function(r) {
          if (r.message && Object.keys(r.message).length > 0) {
            render_popover_content(r.message);
          } else {
            $hover_popover.html('<div class="p-3 text-muted">No details available.</div>');
          }
        }
      });
    }
    function position_popover(x, y) {
      let pop_w = 650;
      let pop_h = 350;
      let win_w = $(window).width();
      let win_h = $(window).height();
      let top = y + 15;
      let left = x + 15;
      if (left + pop_w > win_w)
        left = win_w - pop_w - 20;
      if (top + pop_h > win_h)
        top = win_h - pop_h - 20;
      if (top < 10)
        top = 10;
      if (left < 10)
        left = 10;
      $hover_popover.css({
        top: top + "px",
        left: left + "px"
      });
    }
    function hide_hover_popover() {
      $hover_popover.addClass("hidden");
      $hover_popover.html("");
      current_hovered = null;
    }
    function render_popover_content(data) {
      let status_html = "";
      if (data.status) {
        let color = frappe.utils.guess_colour(data.status) || "gray";
        status_html = `<span class="indicator-pill ${color} filterable">${data.status}</span>`;
      }
      let total = data.grand_total ? format_currency(data.grand_total, data.currency) : "";
      let info_grid = `
            <div class="row mb-3" style="font-size: 13px;">
                <div class="col-sm-6">
                    <div class="mb-1"><span class="text-muted font-weight-bold">Customer:</span> ${data.party || "-"}</div>
                    <div class="mb-1"><span class="text-muted font-weight-bold">Status:</span> ${data.status || "-"}</div>
                    <div class="mt-2 text-dark" style="font-size: 14px;"><span class="font-weight-bold">Grand Total:</span> <strong class="font-weight-bolder">${total}</strong></div>
                </div>
                <div class="col-sm-6 text-right">
                    <div class="mb-1"><span class="text-muted font-weight-bold text-right">Date:</span> ${data.posting_date || "-"}</div>
                    <div class="mb-1"><span class="text-muted font-weight-bold text-right">Payment Due Date:</span> ${data.due_date || "-"}</div>
                </div>
            </div>
        `;
      let items_html = "";
      if (data.items && data.items.length > 0) {
        let tbody = "";
        data.items.forEach((item) => {
          let amount = format_currency(item.amount, data.currency);
          tbody += `<tr>
                    <td class="text-truncate" style="max-width: 150px;">${item.item_name}</td>
                    <td class="text-right">${item.qty}</td>
                    <td class="text-right">${item.rate}</td>
                    <td class="text-right font-weight-bold">${amount}</td>
                </tr>`;
        });
        items_html = `
                <div class="mt-4">
                    <h6 class="text-muted text-uppercase mb-2" style="font-size: 12px; letter-spacing: 0.5px;">Items</h6>
                    <table class="table table-bordered table-sm" style="font-size: 12px; margin-bottom: 0;">
                        <thead class="bg-light text-muted">
                            <tr>
                                <th>Item Name</th>
                                <th class="text-right">Qty</th>
                                <th class="text-right">Rate</th>
                                <th class="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>${tbody}</tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total</strong></td>
                                <td class="text-right"><strong>${data.items.reduce((acc, item) => acc + item.qty, 0)}</strong></td>
                                <td></td>
                                <td class="text-right"><strong>${total}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
      }
      let gl_html = "";
      if (data.gl_entries && data.gl_entries.length > 0) {
        let tbody = "";
        let total_debit = 0;
        let total_credit = 0;
        data.gl_entries.forEach((gl) => {
          total_debit += gl.debit;
          total_credit += gl.credit;
          tbody += `<tr>
                    <td class="text-truncate" style="max-width: 150px;">${gl.account}</td>
                    <td class="text-right">${format_currency(gl.debit, data.currency)}</td>
                    <td class="text-right">${format_currency(gl.credit, data.currency)}</td>
                    <td class="text-muted text-truncate" style="max-width: 120px;">${gl.remarks}</td>
                </tr>`;
        });
        gl_html = `
                <div class="mt-4">
                    <h6 class="text-muted text-uppercase mb-2" style="font-size: 12px; letter-spacing: 0.5px;">GL Entries</h6>
                    <table class="table table-bordered table-sm" style="font-size: 12px;">
                        <thead class="bg-light text-muted">
                            <tr>
                                <th>Account</th>
                                <th class="text-right">Debit</th>
                                <th class="text-right">Credit</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>${tbody}</tbody>
                        <tfoot>
                            <tr>
                                <td><strong>Total</strong></td>
                                <td class="text-right"><strong>${format_currency(total_debit, data.currency)}</strong></td>
                                <td class="text-right"><strong>${format_currency(total_credit, data.currency)}</strong></td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
      }
      let default_title = data.title || data.name;
      let html = `
            <div class="hover-popover-header d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0 text-primary" style="font-size: 16px; font-weight: 600;">
                    ${data.doctype}: <a href="/app/${data.doctype.toLowerCase().replace(" ", "-")}/${data.name}">${default_title}</a>
                </h4>
                <div>
                    <button class="btn btn-xs btn-icon hover-popover-close text-muted" title="Close" style="background: transparent; border: none; font-size: 16px;">
                        <svg class="icon icon-sm"><use href="#icon-close"></use></svg>
                    </button>
                </div>
            </div>
            <div class="hover-popover-body">
                ${info_grid}
                <div style="max-height: 250px; overflow-y: auto;">
                    ${items_html}
                    ${gl_html}
                </div>
            </div>
        `;
      $hover_popover.html(html);
    }
  });
})();
//# sourceMappingURL=hovers.bundle.LV7NGRIT.js.map
