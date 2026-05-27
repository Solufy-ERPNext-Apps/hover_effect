

import json
import re
import socket
import time
import urllib.error
import urllib.request

import frappe

DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite"


LAYOUT_FIELD_TYPES = {
	"Section Break",
	"Column Break",
	"Tab Break",
	"Fold",
	"Heading",
	"Button",
	"HTML",
	"Image",
	"Attach Image",
	"Geolocation",
}
TABLE_FIELD_TYPES = {"Table", "Table MultiSelect"}
DEFAULT_FIELD_CANDIDATES = [
	"status",
	"posting_date",
	"transaction_date",
	"due_date",
	"schedule_date",
	"delivery_date",
	"company",
	"currency",
	"owner",
	"modified",
]
RELATED_FIELD_CANDIDATES = [
	"status",
	"posting_date",
	"transaction_date",
	"schedule_date",
	"due_date",
	"company",
	"currency",
	"grand_total",
	"outstanding_amount",
	"paid_amount",
	"quantity",
	"qty",
	"amount",
	"modified",
]


def boot_session(bootinfo):
	bootinfo.hover_effect = get_hover_config()


@frappe.whitelist()
def get_hover_config():
	settings = _get_hover_settings()
	return {
		"enabled": settings.get("enabled", False),
		"allowed_doctypes": settings.get("allowed_doctypes", []),
		"gemini_enabled": settings.get("gemini_enabled", False),
		"gemini_model": settings.get("gemini_model", DEFAULT_GEMINI_MODEL),
		"stored_ai_layout_doctypes": settings.get("stored_ai_layout_doctypes", []),
	}


@frappe.whitelist()
def get_hover_details(doctype, name):
	if not _is_hover_allowed(doctype):
		frappe.throw("Hover effect is not enabled for this DocType.", frappe.PermissionError)

	if not frappe.has_permission(doctype, "read", name):
		frappe.throw("Not permitted", frappe.PermissionError)

	doc = frappe.get_doc(doctype, name)
	return {
		"doc": doc.as_dict(),
		"meta_rows": _build_meta_rows(doc),
		"detail_sections": _build_detail_sections(doc),
		"linked_sections": _build_linked_sections(doc),
		"table_sections": _build_table_sections(doc),
		"related_sections": _build_related_sections(doc),
	}


@frappe.whitelist()
def get_hover_ai_layout(doctype, name, theme_mode="light", popup_width=None, popup_height=None, regenerate=0):
	if not _is_hover_allowed(doctype):
		frappe.throw("Hover effect is not enabled for this DocType.", frappe.PermissionError)

	if not frappe.has_permission(doctype, "read", name):
		frappe.throw("Not permitted", frappe.PermissionError)

	doc = frappe.get_doc(doctype, name)
	stored_layout = _get_stored_ai_layout(doc.doctype)
	if stored_layout and not frappe.utils.cint(regenerate):
		return stored_layout

	try:
		payload = _build_hover_ai_payload(
			doc, theme_mode=theme_mode, popup_width=popup_width, popup_height=popup_height
		)
		answer = _call_gemini(
			prompt=_build_hover_ai_prompt(payload),
			system_prompt=_hover_ai_system_prompt(),
		)
		parsed = _extract_json_payload(answer)
		css = _sanitize_ai_css(parsed.get("css") or _extract_ai_css(answer))
	except Exception as exc:
		return {
			"css": "",
			"title": doc.doctype,
			"summary": str(exc),
			"error": str(exc),
		}

	if not css:
		return {
			"css": "",
			"title": doc.doctype,
			"summary": "Gemini did not return a valid popup style layout.",
			"error": "Gemini did not return a valid popup style layout.",
		}

	result = {
		"css": css,
		"title": parsed.get("title") or doc.doctype,
		"summary": parsed.get("summary") or f"Reusable Gemini layout for {doc.doctype}.",
		"doctype": doc.doctype,
		"theme_mode": "dark" if str(theme_mode).lower() == "dark" else "light",
	}
	_store_ai_layout(doc.doctype, result)
	return result


@frappe.whitelist()
def clear_hover_ai_layout(doctype):
	if not _is_hover_allowed(doctype):
		frappe.throw("Hover effect is not enabled for this DocType.", frappe.PermissionError)

	_clear_stored_ai_layout(doctype)
	return {"ok": True, "doctype": doctype}


@frappe.whitelist()
def resolve_hover_target(text):
	candidate = (text or "").strip()
	if not candidate or len(candidate) > 140:
		return None

	settings = _get_hover_settings()
	if not settings["enabled"]:
		return None

	matches = []
	for doctype in settings["allowed_doctypes"]:
		if not frappe.has_permission(doctype, "read"):
			continue

		exact_name = _match_docname(doctype, candidate)
		if exact_name:
			matches.append(exact_name)
			continue

		title_match = _match_title_field(doctype, candidate)
		if title_match:
			matches.append(title_match)

	unique_matches = {(row["doctype"], row["name"]): row for row in matches}
	if len(unique_matches) != 1:
		return None

	return next(iter(unique_matches.values()))


def _get_hover_settings():
	try:
		settings = frappe.get_cached_doc("Hover Settings")
	except frappe.DoesNotExistError:
		return {
			"enabled": False,
			"allowed_doctypes": [],
			"gemini_enabled": False,
			"gemini_model": DEFAULT_GEMINI_MODEL,
		}
	except Exception:
		return {
			"enabled": False,
			"allowed_doctypes": [],
			"gemini_enabled": False,
			"gemini_model": DEFAULT_GEMINI_MODEL,
		}

	if not settings.enable:
		return {
			"enabled": False,
			"allowed_doctypes": [],
			"gemini_enabled": False,
			"gemini_model": DEFAULT_GEMINI_MODEL,
		}

	allowed = []
	stored_ai_layout_doctypes = []
	for row in settings.get("field_setting") or []:
		doctype = (row.get("module") or "").strip()
		if doctype and doctype not in allowed:
			allowed.append(doctype)
		if doctype and (row.get("layout_css") or "").strip():
			stored_ai_layout_doctypes.append(doctype)

	api_key = (
		settings.get_password("api_key", raise_exception=False) if getattr(settings, "ai_enable", 0) else None
	)
	gemini_model = (getattr(settings, "gemini_model", None) or "").strip() or DEFAULT_GEMINI_MODEL
	return {
		"enabled": bool(allowed),
		"allowed_doctypes": allowed,
		"gemini_enabled": bool(settings.ai_enable and api_key),
		"gemini_model": gemini_model,
		"stored_ai_layout_doctypes": stored_ai_layout_doctypes,
	}


def _get_gemini_api_key(optional=False):
	try:
		settings = frappe.get_doc("Hover Settings")
	except Exception:
		settings = None

	api_key = None
	if settings and getattr(settings, "ai_enable", 0):
		api_key = settings.get_password("api_key", raise_exception=False)

	if api_key or optional:
		return api_key
	frappe.throw("Gemini API key is not configured in Hover Settings.")


def _get_gemini_model():
	try:
		settings = frappe.get_doc("Hover Settings")
	except Exception:
		settings = None

	configured_model = ""
	if settings and getattr(settings, "ai_enable", 0):
		configured_model = (getattr(settings, "gemini_model", None) or "").strip()

	return configured_model or getattr(frappe.conf, "gemini_model", None) or DEFAULT_GEMINI_MODEL


def _call_gemini(prompt, system_prompt=None, model=None):
	api_key = _get_gemini_api_key()
	model_name = model or _get_gemini_model()
	url = (
		"https://generativelanguage.googleapis.com/v1beta/models/"
		f"{model_name}:generateContent?key={api_key}"
	)
	payload = {
		"contents": [{"role": "user", "parts": [{"text": prompt}]}],
	}
	if system_prompt:
		payload["systemInstruction"] = {"parts": [{"text": system_prompt}]}

	request = urllib.request.Request(
		url,
		data=json.dumps(payload, ensure_ascii=True, default=str).encode("utf-8"),
		headers={"Content-Type": "application/json"},
		method="POST",
	)

	last_error = None
	for attempt in range(1):
		try:
			with urllib.request.urlopen(request, timeout=160) as response:
				raw = response.read().decode("utf-8")
			break
		except urllib.error.HTTPError as exc:
			details = exc.read().decode("utf-8", errors="replace")
			last_error = f"Gemini API returned HTTP {exc.code}: {details}"
			frappe.throw(last_error)
		except urllib.error.URLError as exc:
			last_error = f"Gemini API request failed: {exc}"
			frappe.throw(last_error)
		except TimeoutError:
			last_error = f"Gemini request timed out on model `{model_name}`. Try `gemini-2.5-flash-lite` in Hover Settings."
			frappe.throw(last_error)
		except socket.timeout:
			last_error = f"Gemini request timed out on model `{model_name}`. Try `gemini-2.5-flash-lite` in Hover Settings."
			frappe.throw(last_error)
	else:
		frappe.throw(last_error or "Gemini request failed.")

	data = json.loads(raw)
	candidates = data.get("candidates") or []
	if not candidates:
		frappe.throw("Gemini returned no response.")

	parts = candidates[0].get("content", {}).get("parts", [])
	answer = "\n".join(part.get("text", "") for part in parts if part.get("text"))
	if not answer:
		frappe.throw("Gemini returned an empty response.")
	return answer


def _is_hover_allowed(doctype):
	settings = _get_hover_settings()
	return settings["enabled"] and doctype in settings["allowed_doctypes"]


def _match_docname(doctype, candidate):
	if not frappe.db.exists(doctype, candidate):
		return None

	if not frappe.has_permission(doctype, "read", candidate):
		return None

	return {"doctype": doctype, "name": candidate, "label": candidate}


def _match_title_field(doctype, candidate):
	meta = frappe.get_meta(doctype)
	title_field = meta.title_field
	if not title_field or title_field == "name":
		return None

	rows = frappe.get_all(
		doctype,
		filters={title_field: candidate},
		fields=["name", title_field],
		limit=2,
	)
	if len(rows) != 1:
		return None

	row = rows[0]
	if not frappe.has_permission(doctype, "read", row.name):
		return None

	return {"doctype": doctype, "name": row.name, "label": row.get(title_field) or row.name}


def _build_meta_rows(doc):
	meta = doc.meta
	fieldnames = []

	for fieldname in _get_default_fieldnames(meta):
		if fieldname == "name" or fieldname in fieldnames:
			continue

		df = meta.get_field(fieldname)
		if not df or _skip_field(df):
			continue

		value = doc.get(fieldname)
		if _is_empty(value):
			continue

		fieldnames.append(fieldname)

	rows = []
	for fieldname in fieldnames[:10]:
		df = meta.get_field(fieldname)
		rows.append(
			{
				"fieldname": df.fieldname,
				"label": df.label or fieldname.replace("_", " ").title(),
				"value": doc.get(fieldname),
				"fieldtype": df.fieldtype,
				"options": df.options,
				"bold": fieldname in {"grand_total", "outstanding_amount", "paid_amount"},
			}
		)

	return rows


def _build_hover_ai_payload(doc, theme_mode="light", popup_width=None, popup_height=None):
	return {
		"doctype": doc.doctype,
		"name": doc.name,
		"theme_mode": "dark" if str(theme_mode).lower() == "dark" else "light",
		"popup": {
			"width": _coerce_popup_dimension(popup_width, 1240),
			"height": _coerce_popup_dimension(popup_height, 860),
			"max_width": 1240,
			"max_height": 860,
		},
		"meta_rows": _build_meta_rows(doc),
		"detail_sections": _limit_field_sections(_build_detail_sections(doc), max_sections=2, max_rows=6),
		"linked_sections": _limit_linked_sections(_build_linked_sections(doc), max_sections=3, max_rows=4),
		"table_sections": _limit_table_sections(
			_build_table_sections(doc), max_sections=1, max_rows=4, max_columns=4
		),
		"related_sections": _limit_table_sections(
			_build_related_sections(doc), max_sections=1, max_rows=4, max_columns=4
		),
	}


def _hover_ai_system_prompt():
	return (
		"You are a senior product designer generating record-preview popups for a Frappe/ERP desk UI. "
		"Your output is rendered inside an existing popup shell — design for that container, not a standalone page.\n\n"
		"OUTPUT CONTRACT\n"
		"- Return STRICT JSON only. No prose, no markdown fences, no comments.\n"
		'- Schema: { "title": string, "summary": string (<=140 chars), "html": string, "css": string }.\n'
		"- title = the record's human label. summary = one-line context, not a tagline.\n\n"
		"HTML RULES\n"
		"- Allowed tags ONLY: div, section, header, h1, h2, h3, p, span, ul, li, table, thead, tbody, tr, th, td, strong, em, small, a.\n"
		"- Forbidden: script, style, iframe, img, svg, canvas, form, button, input, link, meta.\n"
		'- Root element MUST be <div class="hover-ai-root"> and every class MUST be prefixed `hover-ai-`.\n'
		"- Use semantic structure: header for title block, section for grouped content, table for tabular data.\n"
		"- Never invent field values. If a field is empty/missing, omit it — do not render placeholders.\n\n"
		"CSS RULES\n"
		"- Scope EVERY selector under `.hover-ai-root`. No global selectors, no `*`, no `body`, no `:root`.\n"
		"- Self-contained: no @import, no url(), no external fonts. Inherit host font-family.\n"
		"- Respect `theme_mode`: 'light' => light surfaces + dark text; 'dark' => dark surfaces + light text.\n"
		"- Define color/radius/spacing tokens as CSS variables at the top of `.hover-ai-root` and reuse them.\n"
		"- Use CSS Grid or Flexbox. No floats, no absolute positioning except small badges.\n\n"
		"LAYOUT RULES — FIT, DON'T SCROLL\n"
		"- The root fills the popup exactly: width:100%; height:100%; box-sizing:border-box; overflow:hidden.\n"
		"- The popup MUST NOT introduce its own scrollbar. If content risks overflowing, reduce padding, tighten type, "
		"  drop low-value sections, or truncate long text with ellipsis — never add overflow:auto/scroll on the root.\n"
		"- Inner tables may scroll horizontally ONLY if columns truly cannot fit; otherwise let them fill width.\n"
		"- LAYOUT DECISION (strict):\n"
		"   • If the payload contains a table or any tabular/linked list with >=3 rows, use a SINGLE-COLUMN layout. "
		"     Do NOT split into a 2-column grid. The table gets full width.\n"
		"   • Only use a 2-column grid when there is NO table AND there are 8+ flat key/value fields.\n"
		"   • Otherwise, single column, dense stack.\n\n"
		"CARD USAGE — MINIMAL\n"
		"- Use as FEW card containers as possible. Plain grouped sections with a small heading and a thin divider are preferred over boxed cards.\n"
		"- Reserve real card styling (border + surface tint) ONLY for SENSITIVE or HIGH-SIGNAL information: "
		"  status, totals, balances, credentials, IDs, security flags, payment state, due/overdue values.\n"
		"- Never wrap every section in a card. Never nest cards. Never put a single field inside its own card.\n\n"
		"DENSITY & TYPOGRAPHY\n"
		"- Root padding 10–14px. Gap between sections 8–10px. Inside groups 4–6px.\n"
		"- h1 ~16px, h2 ~12–13px uppercase tracked muted, body ~12–13px, small ~11px. Line-height 1.35–1.45.\n"
		"- Header (title + status + summary) first, then key metrics inline as chips, then details, then linked table last.\n"
		"- Numbers right-aligned with tabular-nums. Long text truncates with ellipsis.\n\n"
		"VISUAL LANGUAGE\n"
		"- Calm and precise: 1px borders, 6–8px radius, subtle 4–8% surface tints, shadows max `0 1px 2px rgba(0,0,0,.06)`.\n"
		"- Links: accent color, underline on hover only. No animations beyond 120ms.\n\n"
		"ANTI-PATTERNS — DO NOT\n"
		"- Do NOT split into 2 columns when a table is present.\n"
		"- Do NOT wrap every section in a card; cards are for sensitive info only.\n"
		"- Do NOT make the popup body scrollable; fit content by tightening, not by scrolling.\n"
		"- No giant headings, no gradient text, no glassmorphism, no decorative emoji, no fabricated fields."
	)


def _build_hover_ai_prompt(payload):
	return (
		"Design a premium, information-dense popup for the record data below.\n\n"
		"HARD RULES\n"
		"1. Use ONLY the supplied field values. Never invent or paraphrase data.\n"
		"2. Root fills the popup: width:100%; height:100%; box-sizing:border-box; overflow:hidden. The popup must NOT scroll.\n"
		"3. If the payload contains a table or a linked/related list with 3+ rows: use a SINGLE-COLUMN layout. "
		"   Do not create a 2-column grid alongside the table — the table spans full width.\n"
		"4. Use cards sparingly. Default to plain grouped sections with a small heading. "
		"   Apply real card styling ONLY to sensitive/high-signal info (status, totals, balances, IDs, payment state, security flags).\n"
		"5. Match `theme_mode` exactly (light or dark).\n"
		"6. Omit any section whose source data is empty.\n\n"
		"CONTENT ORDER\n"
		"a. Header: record title + status chip + one-line summary\n"
		"b. Key metrics inline (chips or compact row) — only the few that matter\n"
		"c. Primary details as a dense key/value list (single column unless rule 3 forbids it)\n"
		"d. Linked/related table LAST, full width, compact rows\n"
		"e. Secondary metadata (ids, timestamps, owner) as small muted text at the bottom\n\n"
		"FIT-WITHOUT-SCROLL CHECKLIST\n"
		"- Tighten padding and font size before considering scroll.\n"
		"- Truncate long strings with ellipsis; cap table to a reasonable visible row count if needed (show the rest implicitly via a small 'more' note in text, not a button).\n"
		"- Drop the least important section rather than overflowing.\n\n"
		"QUALITY BAR\n"
		"- Feels like Linear / Stripe Dashboard: calm, precise, scannable in under 2 seconds.\n\n"
		"Return JSON only, matching the schema in the system prompt.\n\n"
		f"RECORD PAYLOAD:\n{json.dumps(payload, ensure_ascii=True, default=str)}"
	)


def _get_stored_ai_layout(doctype):
	try:
		settings = frappe.get_cached_doc("Hover Settings")
	except Exception:
		return None

	for row in settings.get("field_setting") or []:
		if (row.get("module") or "").strip() != doctype:
			continue

		css = (row.get("layout_css") or "").strip()
		if not css:
			return None

		return {
			"css": css,
			"title": doctype,
			"summary": f"Reusable Gemini layout for {doctype}.",
			"doctype": doctype,
		}

	return None


def _store_ai_layout(doctype, result):
	settings = frappe.get_doc("Hover Settings")
	for row in settings.get("field_setting") or []:
		if (row.get("module") or "").strip() == doctype:
			row.layout_css = result.get("css") or ""
			settings.save(ignore_permissions=True)
			frappe.clear_document_cache("Hover Settings", "Hover Settings")
			return

	frappe.throw(f"DocType {doctype} is not configured in Hover Settings.")


def _clear_stored_ai_layout(doctype):
	settings = frappe.get_doc("Hover Settings")
	for row in settings.get("field_setting") or []:
		if (row.get("module") or "").strip() == doctype:
			row.layout_css = ""
			settings.save(ignore_permissions=True)
			frappe.clear_document_cache("Hover Settings", "Hover Settings")
			return

	frappe.throw(f"DocType {doctype} is not configured in Hover Settings.")


def _coerce_popup_dimension(value, default):
	try:
		if value in (None, ""):
			return default
		return max(int(float(value)), 320)
	except (TypeError, ValueError):
		return default


def _limit_field_sections(sections, max_sections=2, max_rows=6):
	trimmed = []
	for section in sections[:max_sections]:
		rows = (section.get("rows") or [])[:max_rows]
		if rows:
			trimmed.append({**section, "rows": rows})
	return trimmed


def _limit_linked_sections(sections, max_sections=3, max_rows=4):
	trimmed = []
	for section in sections[:max_sections]:
		rows = (section.get("rows") or [])[:max_rows]
		if rows:
			trimmed.append({**section, "rows": rows})
	return trimmed


def _limit_table_sections(sections, max_sections=1, max_rows=4, max_columns=4):
	trimmed = []
	for section in sections[:max_sections]:
		columns = (section.get("columns") or [])[:max_columns]
		if not columns:
			continue
		rows = []
		for row in (section.get("rows") or [])[:max_rows]:
			rows.append({col["fieldname"]: row.get(col["fieldname"]) for col in columns})
		if rows:
			trimmed.append({**section, "columns": columns, "rows": rows})
	return trimmed


def _extract_json_payload(answer):
	cleaned = (answer or "").strip()
	if cleaned.startswith("```"):
		cleaned = re.sub(r"^```[a-zA-Z0-9]*\n?", "", cleaned)
		cleaned = re.sub(r"\n?```$", "", cleaned)

	try:
		data = json.loads(cleaned)
		return data if isinstance(data, dict) else {}
	except Exception:
		match = re.search(r"\{.*\}", cleaned, flags=re.S)
		if not match:
			return {}
		try:
			data = json.loads(match.group(0))
			return data if isinstance(data, dict) else {}
		except Exception:
			return {}


def _extract_ai_html(answer):
	cleaned = (answer or "").strip()
	style_block = re.search(r"<style\b[^>]*>.*?</style>", cleaned, flags=re.I | re.S)
	if style_block:
		cleaned = cleaned.replace(style_block.group(0), "")

	if re.search(
		r"<(?:div|section|header|h1|h2|h3|p|span|ul|li|table|thead|tbody|tr|th|td)\b", cleaned, flags=re.I
	):
		return cleaned

	html_match = re.search(r"html\s*[:=]\s*(.*)", cleaned, flags=re.I | re.S)
	if html_match:
		return html_match.group(1).strip()

	return ""


def _extract_ai_css(answer):
	cleaned = (answer or "").strip()
	style_match = re.search(r"<style\b[^>]*>(.*?)</style>", cleaned, flags=re.I | re.S)
	if style_match:
		return style_match.group(1).strip()

	css_match = re.search(r"css\s*[:=]\s*(.*)", cleaned, flags=re.I | re.S)
	if css_match:
		return css_match.group(1).strip()

	return ""


def _sanitize_ai_html(html):
	cleaned = (html or "").strip()
	cleaned = re.sub(
		r"<\s*/?\s*(script|style|iframe|object|embed|link|meta|base)[^>]*>", "", cleaned, flags=re.I
	)
	cleaned = re.sub(r"\son[a-z]+\s*=\s*(['\"]).*?\1", "", cleaned, flags=re.I | re.S)
	cleaned = re.sub(r"\sstyle\s*=\s*(['\"]).*?\1", "", cleaned, flags=re.I | re.S)
	return cleaned


def _sanitize_ai_css(css):
	cleaned = (css or "").strip()
	cleaned = re.sub(r"^```[a-zA-Z0-9]*\n?", "", cleaned)
	cleaned = re.sub(r"\n?```$", "", cleaned)
	cleaned = re.sub(r"<\s*/?\s*style[^>]*>", "", cleaned, flags=re.I)
	cleaned = re.sub(r"/\*.*?\*/", "", cleaned, flags=re.S)
	forbidden = ["@import", "javascript:", "expression(", "url(", "<", ">"]
	lowered = cleaned.lower()
	if any(token in lowered for token in forbidden):
		return ""
	return cleaned


def _build_detail_sections(doc):
	sections = []
	current_section = {"title": "Details", "rows": []}
	summary_fields = {row["fieldname"] for row in _build_meta_rows(doc)}

	for df in doc.meta.fields:
		if df.fieldtype == "Section Break":
			if current_section["rows"]:
				sections.append(current_section)
			current_section = {"title": df.label or "More Details", "rows": []}
			continue

		if _skip_field(df) or df.fieldname in summary_fields or df.fieldname in {"name", "status"}:
			continue

		value = doc.get(df.fieldname)
		if _is_empty(value):
			continue

		current_section["rows"].append(
			{
				"fieldname": df.fieldname,
				"label": df.label or df.fieldname.replace("_", " ").title(),
				"value": value,
				"fieldtype": df.fieldtype,
				"options": df.options,
			}
		)

	if current_section["rows"]:
		sections.append(current_section)

	return sections


def _build_table_sections(doc):
	sections = []
	for df in doc.meta.fields:
		if df.fieldtype not in TABLE_FIELD_TYPES:
			continue

		rows = doc.get(df.fieldname) or []
		if not rows:
			continue

		child_meta = frappe.get_meta(df.options)
		columns = _get_child_columns(child_meta, rows)
		if not columns:
			continue

		sections.append(
			{
				"label": df.label or df.fieldname.replace("_", " ").title(),
				"columns": columns,
				"rows": [
					{col["fieldname"]: row.get(col["fieldname"]) for col in columns} for row in rows[:10]
				],
			}
		)

		if len(sections) >= 4:
			break

	return sections


def _build_linked_sections(doc):
	settings = _get_hover_settings()
	allowed_doctypes = set(settings["allowed_doctypes"])
	sections = []

	for df in doc.meta.fields:
		if df.fieldtype != "Link" or _skip_field(df):
			continue

		linked_doctype = df.options
		linked_name = doc.get(df.fieldname)
		if not linked_doctype or _is_empty(linked_name):
			continue
		if linked_doctype not in allowed_doctypes:
			continue
		if not frappe.has_permission(linked_doctype, "read", linked_name):
			continue

		try:
			linked_doc = frappe.get_doc(linked_doctype, linked_name)
		except Exception:
			continue

		rows = _build_preview_rows(linked_doc, limit=8)
		if not rows:
			continue

		sections.append(
			{
				"label": df.label or df.fieldname.replace("_", " ").title(),
				"doctype": linked_doctype,
				"name": linked_name,
				"doc": linked_doc.as_dict(),
				"rows": rows,
			}
		)

		if len(sections) >= 8:
			break

	return sections


def _build_related_sections(doc):
	settings = _get_hover_settings()
	sections = []

	for related_doctype in settings["allowed_doctypes"]:
		if related_doctype == doc.doctype:
			continue
		if not frappe.has_permission(related_doctype, "read"):
			continue

		meta = frappe.get_meta(related_doctype)
		if meta.istable:
			continue

		link_fields = [
			df for df in meta.fields if df.fieldtype == "Link" and df.options == doc.doctype and not df.hidden
		]
		if not link_fields:
			continue

		for link_field in link_fields:
			rows = _get_related_rows(related_doctype, meta, link_field.fieldname, doc.name)
			if not rows:
				continue

			sections.append(
				{
					"label": meta.title_field or related_doctype,
					"doctype": related_doctype,
					"link_field": link_field.fieldname,
					"columns": _get_related_columns(meta, link_field.fieldname, rows),
					"rows": rows,
				}
			)

			if len(sections) >= 6:
				return sections

	return sections


def _get_related_rows(doctype, meta, link_fieldname, docname):
	fields = ["name", link_fieldname]

	for fieldname in [meta.title_field, *RELATED_FIELD_CANDIDATES]:
		if not fieldname or fieldname in fields:
			continue
		df = meta.get_field(fieldname)
		if not df or _skip_field(df):
			continue
		fields.append(fieldname)
		if len(fields) >= 7:
			break

	try:
		return frappe.get_all(
			doctype,
			filters={link_fieldname: docname},
			fields=fields,
			order_by="modified desc",
			limit=5,
		)
	except Exception:
		return []


def _get_related_columns(meta, link_fieldname, rows):
	columns = [{"fieldname": "name", "label": "Name", "fieldtype": "Link", "options": meta.name}]
	seen = {"name", link_fieldname}

	for fieldname in [meta.title_field, *RELATED_FIELD_CANDIDATES]:
		if not fieldname or fieldname in seen:
			continue
		seen.add(fieldname)
		df = meta.get_field(fieldname)
		if not df or _skip_field(df):
			continue
		if all(_is_empty(row.get(fieldname)) for row in rows):
			continue

		columns.append(
			{
				"fieldname": fieldname,
				"label": df.label or fieldname.replace("_", " ").title(),
				"fieldtype": df.fieldtype,
				"options": df.options,
			}
		)

		if len(columns) >= 5:
			break

	return columns


def _get_child_columns(meta, rows):
	ordered_fieldnames = [
		"item_code",
		"item_name",
		"description",
		"qty",
		"rate",
		"amount",
		"status",
	]
	ordered_fieldnames.extend(df.fieldname for df in meta.fields)

	columns = []
	seen = set()
	for fieldname in ordered_fieldnames:
		if fieldname in seen:
			continue
		seen.add(fieldname)

		df = meta.get_field(fieldname)
		if not df or _skip_field(df):
			continue

		if all(_is_empty(row.get(fieldname)) for row in rows):
			continue

		columns.append(
			{
				"fieldname": df.fieldname,
				"label": df.label or df.fieldname.replace("_", " ").title(),
				"fieldtype": df.fieldtype,
				"options": df.options,
			}
		)

		if len(columns) >= 6:
			break

	return columns


def _get_default_fieldnames(meta):
	fieldnames = []

	if meta.title_field:
		fieldnames.append(meta.title_field)

	fieldnames.extend(DEFAULT_FIELD_CANDIDATES)
	fieldnames.extend(df.fieldname for df in meta.fields)

	deduped = []
	for fieldname in fieldnames:
		if fieldname and fieldname not in deduped:
			deduped.append(fieldname)

	return deduped


def _build_preview_rows(doc, limit=8):
	meta = doc.meta
	rows = []
	seen = set()

	for fieldname in _get_default_fieldnames(meta):
		if not fieldname or fieldname in seen or fieldname == "name":
			continue
		seen.add(fieldname)

		df = meta.get_field(fieldname)
		if not df or _skip_field(df):
			continue

		value = doc.get(fieldname)
		if _is_empty(value):
			continue

		rows.append(
			{
				"fieldname": df.fieldname,
				"label": df.label or fieldname.replace("_", " ").title(),
				"value": value,
				"fieldtype": df.fieldtype,
				"options": df.options,
				"bold": fieldname in {"grand_total", "outstanding_amount", "paid_amount"},
			}
		)

		if len(rows) >= limit:
			return rows

	for df in meta.fields:
		if df.fieldname in seen or df.fieldname in {"name", "status"} or _skip_field(df):
			continue

		value = doc.get(df.fieldname)
		if _is_empty(value):
			continue

		rows.append(
			{
				"fieldname": df.fieldname,
				"label": df.label or df.fieldname.replace("_", " ").title(),
				"value": value,
				"fieldtype": df.fieldtype,
				"options": df.options,
				"bold": False,
			}
		)

		if len(rows) >= limit:
			break

	return rows


def _skip_field(df):
	return (
		df.hidden
		or df.fieldtype in LAYOUT_FIELD_TYPES
		or df.fieldtype in TABLE_FIELD_TYPES
		or df.fieldtype == "Password"
		or not df.fieldname
		or df.fieldname in {"amended_from", "_seen"}
	)


def _is_empty(value):
	return value in (None, "", [], {})
