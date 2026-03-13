(() => {
  // ../hover_effect/hover_effect/public/js/overssss.bundle.js
  frappe.provide("hover_effect");
  $(document).ready(function() {
    let hover_timeout;
    let $hover_popover = $('<div id="custom-hover-popover" class="custom-hover-popover hidden"></div>').appendTo("body");
    let current_hovered = null;
    $(document).on("mouseenter", ".ellipsis a.filterable", function(e) {
      if (!cur_list || !cur_list.data)
        return;
      let $row = $(this).closest(".list-row");
      let name = $row.attr("data-name");
      if (!name) {
        let $id_link = $row.find(".list-row-col .list-subject a, a.name");
        if ($id_link.length)
          name = $id_link.text().trim();
      }
      if (!name)
        return;
      hover_timeout = setTimeout(() => {
        show_hover_popover(cur_list.doctype, name, e.clientX, e.clientY);
      }, 500);
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
      let party = data.customer || data.supplier || "";
      let party_html = party ? `<div class="hover-party mb-2 text-dark"><strong>${party}</strong></div>` : "";
      let status = data.status || "";
      let status_html = "";
      if (status) {
        let color = frappe.utils.guess_colour(status) || "gray";
        status_html = `<span class="indicator-pill ${color}">${status}</span>`;
      }
      let total = "";
      if (data.grand_total !== null && data.grand_total !== void 0) {
        total = format_currency(data.grand_total, data.currency);
      }
      let total_html = total ? `<div class="text-muted text-sm mt-1">Grand Total: <strong class="text-dark">${total}</strong></div>` : "";
      let items_html = "";
      if (data.items && data.items.length > 0) {
        items_html += `<div class="mt-2 pt-2 border-top text-sm">`;
        items_html += `<div class="text-muted mb-1" style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Items (${data.total_items})</div>`;
        data.items.forEach((item) => {
          items_html += `<div class="d-flex justify-content-between mb-1" style="line-height: 1.4;">
                    <span class="text-truncate mr-2" style="max-width: 200px;" title="${item.item_name}">${item.item_name}</span>
                    <span class="font-weight-bold">${item.qty}</span>
                </div>`;
        });
        if (data.total_items > 3) {
          items_html += `<div class="text-muted mt-1" style="font-size: 11px;">+ ${data.total_items - 3} more items</div>`;
        }
        items_html += `</div>`;
      }
      let html = `
            <div class="hover-popover-header d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                <strong class="text-primary" style="font-size: 14px;">${data.name}</strong>
                ${status_html}
            </div>
            <div class="hover-popover-body" style="font-size: 13px;">
                ${party_html}
                ${total_html}
                ${items_html}
            </div>
        `;
      $hover_popover.html(html);
    }
  });
})();
//# sourceMappingURL=overssss.bundle.C4NE4OPL.js.map
