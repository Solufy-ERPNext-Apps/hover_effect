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

    # ----------------------------------------------------------
    # Sales / Purchase Documents
    # ----------------------------------------------------------

    if doctype in (
        "Sales Invoice",
        "Purchase Invoice",
        "Sales Order",
        "Purchase Order",
    ):

        result["items"] = [
            {
                "item_code": d.item_code,
                "item_name": d.item_name or d.item_code,
                "qty": d.qty,
                "rate": d.rate,
                "amount": d.amount,
            }
            for d in (doc.items or [])
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

    # ----------------------------------------------------------
    # Payment Entry
    # ----------------------------------------------------------

    elif doctype == "Payment Entry":

        result["accounts"] = [
            {
                "account": d.account,
                "debit_in_account_currency": d.debit_in_account_currency,
                "credit_in_account_currency": d.credit_in_account_currency,
            }
            for d in (getattr(doc, "accounts", None) or [])
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

    # ----------------------------------------------------------
    # Customer / Supplier
    # ----------------------------------------------------------

    elif doctype == "Customer":
        result.update(_get_customer_details(name))

    elif doctype == "Supplier":
        result.update(_get_supplier_details(name))

    return result


# ==============================================================
# Helper for SUM queries (fix for frappe v15+ restriction)
# ==============================================================

def get_sum(doctype, field, filters):
    value = frappe.db.sql(
        f"""
        SELECT SUM({field})
        FROM `tab{doctype}`
        WHERE {" AND ".join([f"{k}=%s" for k in filters.keys()])}
        """,
        tuple(filters.values()),
    )
    return value[0][0] or 0


# ==============================================================
# Customer Details
# ==============================================================

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

    # ----------------------------------------------------------
    # Totals (FIXED)
    # ----------------------------------------------------------

    total_billed = get_sum(
        "Sales Invoice",
        "grand_total",
        {"customer": name, "docstatus": 1},
    )

    total_outstanding = get_sum(
        "Sales Invoice",
        "outstanding_amount",
        {"customer": name, "docstatus": 1},
    )

    total_ordered = get_sum(
        "Sales Order",
        "grand_total",
        {"customer": name, "docstatus": 1},
    )

    total_advance = get_sum(
        "Sales Order",
        "advance_paid",
        {"customer": name, "docstatus": 1},
    )

    total_paid = get_sum(
        "Payment Entry",
        "paid_amount",
        {"party_type": "Customer", "party": name, "docstatus": 1},
    )

    data["summary"] = {
        "total_billed": total_billed,
        "total_outstanding": total_outstanding,
        "total_ordered": total_ordered,
        "total_advance": total_advance,
        "total_paid": total_paid,
        "si_count": frappe.db.count("Sales Invoice", {"customer": name, "docstatus": 1}),
        "so_count": frappe.db.count("Sales Order", {"customer": name, "docstatus": 1}),
        "dn_count": frappe.db.count("Delivery Note", {"customer": name, "docstatus": 1}),
        "pe_count": frappe.db.count(
            "Payment Entry", {"party_type": "Customer", "party": name, "docstatus": 1}
        ),
        "overdue_count": frappe.db.count(
            "Sales Invoice", {"customer": name, "docstatus": 1, "status": "Overdue"}
        ),
    }

    return data


# ==============================================================
# Supplier Details
# ==============================================================

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

    total_billed = get_sum(
        "Purchase Invoice",
        "grand_total",
        {"supplier": name, "docstatus": 1},
    )

    total_outstanding = get_sum(
        "Purchase Invoice",
        "outstanding_amount",
        {"supplier": name, "docstatus": 1},
    )

    total_ordered = get_sum(
        "Purchase Order",
        "grand_total",
        {"supplier": name, "docstatus": 1},
    )

    total_advance = get_sum(
        "Purchase Order",
        "advance_paid",
        {"supplier": name, "docstatus": 1},
    )

    total_paid = get_sum(
        "Payment Entry",
        "paid_amount",
        {"party_type": "Supplier", "party": name, "docstatus": 1},
    )

    data["summary"] = {
        "total_billed": total_billed,
        "total_outstanding": total_outstanding,
        "total_ordered": total_ordered,
        "total_advance": total_advance,
        "total_paid": total_paid,
        "pi_count": frappe.db.count("Purchase Invoice", {"supplier": name, "docstatus": 1}),
        "po_count": frappe.db.count("Purchase Order", {"supplier": name, "docstatus": 1}),
        "pr_count": frappe.db.count("Purchase Receipt", {"supplier": name, "docstatus": 1}),
        "pe_count": frappe.db.count(
            "Payment Entry", {"party_type": "Supplier", "party": name, "docstatus": 1}
        ),
        "overdue_count": frappe.db.count(
            "Purchase Invoice", {"supplier": name, "docstatus": 1, "status": "Overdue"}
        ),
    }

    return data