import frappe


@frappe.whitelist()
def get_hover_details(doctype, name):

    SUPPORTED = {
        "Sales Invoice",
        "Purchase Invoice",
        "Sales Order",
        "Purchase Order",
        "Customer",
        "Supplier",
        "Payment Entry",
    }

    if doctype not in SUPPORTED:
        frappe.throw(
            f"Doctype '{doctype}' is not supported by hover_effect.",
            frappe.ValidationError,
        )

    if not frappe.has_permission(doctype, "read", name):
        frappe.throw("Not permitted", frappe.PermissionError)

    doc = frappe.get_doc(doctype, name)
    result = {"doc": doc.as_dict()}

    if doctype in (
        "Sales Invoice",
        "Purchase Invoice",
        "Sales Order",
        "Purchase Order",
    ):

        result["items"] = [
            {
                "item_code": item.item_code,
                "item_name": item.item_name or item.item_code,
                "qty": item.qty,
                "rate": item.rate,
                "amount": item.amount,
            }
            for item in (doc.items or [])
        ]

        if doc.docstatus == 1:
            result["gl_entries"] = frappe.get_all(
                "GL Entry",
                filters={
                    "voucher_type": doctype,
                    "voucher_no": name,
                    "is_cancelled": 0,
                },
                fields=["account", "debit", "credit", "remarks"],
                order_by="creation asc",
            )
        else:
            result["gl_entries"] = []

    elif doctype == "Payment Entry":

        result["accounts"] = [
            {
                "account": acc.account,
                "debit_in_account_currency": acc.debit_in_account_currency,
                "credit_in_account_currency": acc.credit_in_account_currency,
            }
            for acc in (getattr(doc, "accounts", None) or [])
        ]

        if doc.docstatus == 1:
            result["gl_entries"] = frappe.get_all(
                "GL Entry",
                filters={
                    "voucher_type": "Payment Entry",
                    "voucher_no": name,
                    "is_cancelled": 0,
                },
                fields=["account", "debit", "credit", "remarks"],
                order_by="creation asc",
            )
        else:
            result["gl_entries"] = []

    elif doctype == "Customer":
        result.update(_get_customer_details(name))

    elif doctype == "Supplier":
        result.update(_get_supplier_details(name))

    return result


def _get_customer_details(name):

    data = {}

    data["sales_invoices"] = frappe.get_all(
        "Sales Invoice",
        filters={"customer": name, "docstatus": 1},
        fields=[
            "name",
            "posting_date",
            "due_date",
            "grand_total",
            "outstanding_amount",
            "status",
            "currency",
        ],
        order_by="posting_date desc",
        limit=5,
    )
    for r in data["sales_invoices"]:
        r["doctype"] = "Sales Invoice"

    data["sales_orders"] = frappe.get_all(
        "Sales Order",
        filters={"customer": name, "docstatus": 1},
        fields=[
            "name",
            "transaction_date",
            "delivery_date",
            "grand_total",
            "advance_paid",
            "status",
            "currency",
        ],
        order_by="transaction_date desc",
        limit=5,
    )
    for r in data["sales_orders"]:
        r["doctype"] = "Sales Order"

    data["delivery_notes"] = frappe.get_all(
        "Delivery Note",
        filters={"customer": name, "docstatus": 1},
        fields=["name", "posting_date", "grand_total", "status"],
        order_by="posting_date desc",
        limit=5,
    )
    for r in data["delivery_notes"]:
        r["doctype"] = "Delivery Note"

    data["payments"] = frappe.get_all(
        "Payment Entry",
        filters={"party_type": "Customer", "party": name, "docstatus": 1},
        fields=[
            "name",
            "posting_date",
            "paid_amount",
            "payment_type",
            "mode_of_payment",
            "paid_from_account_currency",
        ],
        order_by="posting_date desc",
        limit=5,
    )
    for r in data["payments"]:
        r["doctype"] = "Payment Entry"
        r["currency"] = r.pop("paid_from_account_currency", "INR")

    si_totals = (
        frappe.db.get_value(
            "Sales Invoice",
            filters={"customer": name, "docstatus": 1},
            fieldname=[
                "sum(grand_total) as total_billed",
                "sum(outstanding_amount) as total_outstanding",
            ],
            as_dict=True,
        )
        or {}
    )

    so_totals = (
        frappe.db.get_value(
            "Sales Order",
            filters={"customer": name, "docstatus": 1},
            fieldname=[
                "sum(grand_total) as total_ordered",
                "sum(advance_paid) as total_advance",
            ],
            as_dict=True,
        )
        or {}
    )

    payment_totals = (
        frappe.db.get_value(
            "Payment Entry",
            filters={"party_type": "Customer", "party": name, "docstatus": 1},
            fieldname=["sum(paid_amount) as total_paid"],
            as_dict=True,
        )
        or {}
    )

    si_count = frappe.db.count("Sales Invoice", {"customer": name, "docstatus": 1})
    so_count = frappe.db.count("Sales Order", {"customer": name, "docstatus": 1})
    dn_count = frappe.db.count("Delivery Note", {"customer": name, "docstatus": 1})
    pe_count = frappe.db.count(
        "Payment Entry", {"party_type": "Customer", "party": name, "docstatus": 1}
    )
    overdue_count = frappe.db.count(
        "Sales Invoice", {"customer": name, "docstatus": 1, "status": "Overdue"}
    )

    data["summary"] = {
        "total_billed": si_totals.get("total_billed") or 0,
        "total_outstanding": si_totals.get("total_outstanding") or 0,
        "total_ordered": so_totals.get("total_ordered") or 0,
        "total_advance": so_totals.get("total_advance") or 0,
        "total_paid": payment_totals.get("total_paid") or 0,
        "si_count": si_count,
        "so_count": so_count,
        "dn_count": dn_count,
        "pe_count": pe_count,
        "overdue_count": overdue_count,
    }

    return data


def _get_supplier_details(name):

    data = {}

    data["purchase_invoices"] = frappe.get_all(
        "Purchase Invoice",
        filters={"supplier": name, "docstatus": 1},
        fields=[
            "name",
            "posting_date",
            "due_date",
            "grand_total",
            "outstanding_amount",
            "status",
            "currency",
        ],
        order_by="posting_date desc",
        limit=5,
    )
    for r in data["purchase_invoices"]:
        r["doctype"] = "Purchase Invoice"

    data["purchase_orders"] = frappe.get_all(
        "Purchase Order",
        filters={"supplier": name, "docstatus": 1},
        fields=[
            "name",
            "transaction_date",
            "schedule_date",
            "grand_total",
            "advance_paid",
            "status",
            "currency",
        ],
        order_by="transaction_date desc",
        limit=5,
    )
    for r in data["purchase_orders"]:
        r["doctype"] = "Purchase Order"

    data["purchase_receipts"] = frappe.get_all(
        "Purchase Receipt",
        filters={"supplier": name, "docstatus": 1},
        fields=["name", "posting_date", "grand_total", "status"],
        order_by="posting_date desc",
        limit=5,
    )
    for r in data["purchase_receipts"]:
        r["doctype"] = "Purchase Receipt"

    data["payments"] = frappe.get_all(
        "Payment Entry",
        filters={"party_type": "Supplier", "party": name, "docstatus": 1},
        fields=[
            "name",
            "posting_date",
            "paid_amount",
            "payment_type",
            "mode_of_payment",
            "paid_to_account_currency",
        ],
        order_by="posting_date desc",
        limit=5,
    )
    for r in data["payments"]:
        r["doctype"] = "Payment Entry"
        r["currency"] = r.pop("paid_to_account_currency", "INR")

    pi_totals = (
        frappe.db.get_value(
            "Purchase Invoice",
            filters={"supplier": name, "docstatus": 1},
            fieldname=[
                "sum(grand_total) as total_billed",
                "sum(outstanding_amount) as total_outstanding",
            ],
            as_dict=True,
        )
        or {}
    )

    po_totals = (
        frappe.db.get_value(
            "Purchase Order",
            filters={"supplier": name, "docstatus": 1},
            fieldname=[
                "sum(grand_total) as total_ordered",
                "sum(advance_paid) as total_advance",
            ],
            as_dict=True,
        )
        or {}
    )

    payment_totals = (
        frappe.db.get_value(
            "Payment Entry",
            filters={"party_type": "Supplier", "party": name, "docstatus": 1},
            fieldname=["sum(paid_amount) as total_paid"],
            as_dict=True,
        )
        or {}
    )

    pi_count = frappe.db.count("Purchase Invoice", {"supplier": name, "docstatus": 1})
    po_count = frappe.db.count("Purchase Order", {"supplier": name, "docstatus": 1})
    pr_count = frappe.db.count("Purchase Receipt", {"supplier": name, "docstatus": 1})
    pe_count = frappe.db.count(
        "Payment Entry", {"party_type": "Supplier", "party": name, "docstatus": 1}
    )
    overdue_count = frappe.db.count(
        "Purchase Invoice", {"supplier": name, "docstatus": 1, "status": "Overdue"}
    )

    data["summary"] = {
        "total_billed": pi_totals.get("total_billed") or 0,
        "total_outstanding": pi_totals.get("total_outstanding") or 0,
        "total_ordered": po_totals.get("total_ordered") or 0,
        "total_advance": po_totals.get("total_advance") or 0,
        "total_paid": payment_totals.get("total_paid") or 0,
        "pi_count": pi_count,
        "po_count": po_count,
        "pr_count": pr_count,
        "pe_count": pe_count,
        "overdue_count": overdue_count,
    }

    return data
