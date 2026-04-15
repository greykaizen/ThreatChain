"""
db_loader.py
Reads STIX reports from MySQL (read-only) and returns plain text chunks.
No langchain dependency — just mysql-connector-python.
"""

import os
import json
from dotenv import load_dotenv
import mysql.connector

load_dotenv()


def _get_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "threadchain_db"),
        port=int(os.getenv("DB_PORT", 3306)),
    )


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Split text into overlapping chunks."""
    if len(text) <= chunk_size:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def load_stix_reports() -> list[dict]:
    """
    Pull stix_reports rows. Returns list of dicts with 'text' and 'metadata'.
    Read-only — never writes to DB.
    """
    docs = []
    try:
        conn = _get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, title, description, content, severity,
                   report_type, indicators_count, created_at
            FROM stix_reports
            ORDER BY created_at DESC
            LIMIT 500
            """
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        for row in rows:
            content_preview = ""
            try:
                parsed = json.loads(row["content"]) if row["content"] else {}
                objects = parsed.get("objects", [])
                types_found = list({o.get("type", "") for o in objects if o.get("type")})
                content_preview = (
                    f"STIX object types: {', '.join(types_found[:10])}. "
                    f"Total objects: {len(objects)}."
                )
            except Exception:
                content_preview = str(row["content"])[:400] if row["content"] else ""

            full_text = (
                f"Title: {row['title']}\n"
                f"Severity: {row['severity'] or 'unknown'}\n"
                f"Type: {row['report_type'] or 'unknown'}\n"
                f"Indicators: {row['indicators_count'] or 0}\n"
                f"Description: {row['description'] or ''}\n"
                f"Content summary: {content_preview}\n"
                f"Created: {row['created_at']}"
            )

            metadata = {
                "source": "stix_reports",
                "report_id": str(row["id"]),
                "title": row["title"],
                "severity": row["severity"] or "unknown",
                "report_type": row["report_type"] or "unknown",
                "indicators_count": int(row["indicators_count"] or 0),
            }

            for chunk in _chunk_text(full_text):
                docs.append({"text": chunk, "metadata": metadata})

        print(f"[db_loader] Loaded {len(rows)} STIX reports → {len(docs)} chunks")
    except Exception as e:
        print(f"[db_loader] MySQL unavailable or table missing: {e}")

    return docs


def load_stix_indicators() -> list[dict]:
    """Pull stix_indicators rows. Read-only."""
    docs = []
    try:
        conn = _get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, indicator_type, pattern, confidence,
                   labels, valid_from, valid_until, created_at
            FROM stix_indicators
            ORDER BY created_at DESC
            LIMIT 1000
            """
        )
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        for row in rows:
            labels_str = ""
            try:
                labels = json.loads(row["labels"]) if row["labels"] else []
                labels_str = ", ".join(labels) if isinstance(labels, list) else str(labels)
            except Exception:
                labels_str = str(row["labels"] or "")

            text = (
                f"Indicator type: {row['indicator_type'] or 'unknown'}\n"
                f"Pattern: {row['pattern'] or ''}\n"
                f"Confidence: {row['confidence'] or 0}\n"
                f"Labels: {labels_str}\n"
                f"Valid from: {row['valid_from']}\n"
                f"Valid until: {row['valid_until']}\n"
                f"Created: {row['created_at']}"
            )

            metadata = {
                "source": "stix_indicators",
                "indicator_id": str(row["id"]),
                "indicator_type": row["indicator_type"] or "unknown",
                "confidence": int(row["confidence"] or 0),
            }

            docs.append({"text": text, "metadata": metadata})

        print(f"[db_loader] Loaded {len(docs)} STIX indicators")
    except Exception as e:
        print(f"[db_loader] stix_indicators table unavailable: {e}")

    return docs


def load_all_documents() -> list[dict]:
    return load_stix_reports() + load_stix_indicators()
