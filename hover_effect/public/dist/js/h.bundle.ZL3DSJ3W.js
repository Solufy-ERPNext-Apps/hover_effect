(() => {
  // ../hover_effect/hover_effect/public/js/h.bundle.js
  frappe.provide("hover_effect");
  $(document).ready(function() {
    let hover_timeout;
    let $hover_popover = $('<div id="custom-hover-popover" class="custom-hover-popover hidden"></div>').appendTo("body");
    let current_hovered = null;
    $(document).on("mouseenter", ".ellipsis a.filterable", function(e) {
      if (!cur_list || !cur_list.doctype)
        return;
      let name = $(this).closest(".list-row-container").data("name");
      if (!name)
        return;
      clearTimeout(hover_timeout);
      hover_timeout = setTimeout(() => {
        show_hover_popover(cur_list.doctype, name, e.clientX, e.clientY);
      }, 300);
    });
    $(document).on("mouseleave", ".ellipsis a.filterable", function() {
      clearTimeout(hover_timeout);
      setTimeout(() => {
        if (!$hover_popover.is(":hover")) {
          hide_hover_popover();
        }
      }, 100);
    });
    $(document).on("mouseleave", ".ellipsis a.filterable", function(e) {
      clearTimeout(hover_timeout);
      setTimeout(() => {
        if (!$hover_popover.is(":hover")) {
          hide_hover_popover();
        }
      }, 100);
    });
    $hover_popover.on("mouseleave", function() {
      hide_hover_popover();
    });
    $(document).on("mousedown", function(e) {
      if (!$(e.target).closest("#custom-hover-popover").length) {
        hide_hover_popover();
      }
    });
    function show_hover_popover(doctype, name, x, y) {
      $hover_popover.html('<div class="p-4 text-center text-muted"><i class="fa fa-spinner fa-spin"></i> Loading...</div>');
      position_popover(x, y);
      $hover_popover.removeClass("hidden");
      frappe.call({
        method: "hover_effect.api.get_hover_details",
        args: {
          doctype,
          name
        },
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
      let pop_w = $hover_popover.outerWidth() || 300;
      let pop_h = $hover_popover.outerHeight() || 200;
      let win_w = $(window).width();
      let win_h = $(window).height();
      let top = y + 15;
      let left = x + 15;
      if (left + pop_w > win_w) {
        left = x - pop_w - 15;
      }
      if (top + pop_h > win_h) {
        top = y - pop_h - 15;
      }
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
        let color = frappe.utils.guess_colour(data.status);
        status_html = `<span class="indicator-pill ${color}">${data.status}</span>`;
      }
      let party_html = data.party ? `<div class="text-muted mb-2">${data.party}</div>` : "";
      let total_html = "";
      if (data.grand_total) {
        total_html = `
            <div class="mb-2">
                <strong>Grand Total:</strong>
                ${format_currency(data.grand_total, data.currency)}
            </div>`;
      }
      let items_html = "";
      if (data.items && data.items.length) {
        items_html += `
        <div class="mt-3">
        <strong>Items</strong>
        <table class="table table-sm mt-2">
        <thead>
        <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
        </tr>
        </thead>
        <tbody>`;
        data.items.forEach((item) => {
          items_html += `
            <tr>
                <td>${item.item_name}</td>
                <td>${item.qty}</td>
                <td>${item.rate}</td>
                <td>${item.amount}</td>
            </tr>`;
        });
        items_html += `</tbody></table></div>`;
      }
      let html = `
        <div class="hover-popover-header d-flex justify-content-between">
            <strong>${data.doctype}: ${data.name}</strong>
            ${status_html}
        </div>

        ${party_html}

        ${total_html}

        ${items_html}
    `;
      $("#custom-hover-popover").html(html);
    }
  });
})();
//# sourceMappingURL=h.bundle.ZL3DSJ3W.js.map
