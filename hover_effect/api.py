import frappe

@frappe.whitelist()
def get_hover_details(doctype, name):

    if not frappe.has_permission(doctype, "read", name):
        return {}

    try:
        doc = frappe.get_doc(doctype, name)
    except frappe.DoesNotExistError:
        return {}

    data = {
        "name": doc.name,
        "doctype": doctype,
        "title": getattr(doc, "title", None) or doc.name,
        "status": getattr(doc, "status", None),
        "currency": getattr(doc, "currency", frappe.defaults.get_global_default("currency") or "INR"),
    }

    # Party
    data["party"] = (
        getattr(doc, "customer", None)
        or getattr(doc, "supplier", None)
        or getattr(doc, "party_name", None)
    )

    # Totals and Dates
    data["grand_total"] = getattr(doc, "grand_total", None)
    data["posting_date"] = frappe.utils.formatdate(getattr(doc, "posting_date", None)) if getattr(doc, "posting_date", None) else None
    data["due_date"] = frappe.utils.formatdate(getattr(doc, "due_date", None)) if getattr(doc, "due_date", None) else None

    # Items
    items = []
    if hasattr(doc, "items"):
        for item in doc.items[:10]:
            items.append({
                "item_name": item.item_name or item.item_code,
                "qty": item.qty,
                "rate": getattr(item, "rate", 0),
                "amount": getattr(item, "amount", 0)
            })

    data["items"] = items

    # GL Entries (if transaction)
    gl_entries = []
    if doctype in ["Sales Invoice", "Purchase Invoice", "Payment Entry", "Journal Entry"]:
        gls = frappe.get_all(
            "GL Entry",
            filters={"voucher_type": doctype, "voucher_no": name},
            fields=["account", "debit", "credit", "remarks"],
            limit=10,
            order_by="creation asc"
        )
        for gl in gls:
            gl_entries.append({
                "account": gl.account,
                "debit": gl.debit,
                "credit": gl.credit,
                "remarks": gl.remarks or "No Remarks"
            })
            
    data["gl_entries"] = gl_entries

    return data