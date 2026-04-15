"""
app.py  —  ThreadChain RAG Service
Flask server on port 5002 (isolated from existing services on 3001/3000/5001).

Endpoints:
  POST /rag/query   — answer a natural language question
  POST /rag/index   — re-index STIX reports from MySQL
  GET  /rag/status  — health + indexed doc count
"""

import os
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

RAG_PORT = int(os.getenv("RAG_PORT", 5002))

# ─── Lazy-load the vector store in a background thread so Flask starts fast ──
_index_ready = False
_index_error = None


def _background_index():
    global _index_ready, _index_error
    try:
        from indexer import get_collection
        get_collection()
        _index_ready = True
        print("[app] Vector store ready ✅")
    except Exception as e:
        _index_error = str(e)
        print(f"[app] Vector store init failed: {e}")


threading.Thread(target=_background_index, daemon=True).start()


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route("/rag/status", methods=["GET"])
def status():
    from indexer import get_indexed_count
    count = get_indexed_count()
    return jsonify({
        "success": True,
        "online": True,
        "ready": _index_ready,
        "indexed_documents": count,
        "index_error": _index_error,
        "message": "RAG service is running" if _index_ready else "Indexing in progress...",
    })


@app.route("/rag/query", methods=["POST"])
def query():
    if not _index_ready:
        return jsonify({
            "success": False,
            "error": "Vector store is still initializing. Please wait a moment and retry.",
        }), 503

    data = request.get_json(force=True, silent=True) or {}
    question = data.get("question", "").strip()
    top_k = int(data.get("top_k", 5))

    if not question:
        return jsonify({"success": False, "error": "question is required"}), 400

    from retriever import query as rag_query
    result = rag_query(question, top_k=top_k)
    return jsonify(result)


@app.route("/rag/index", methods=["POST"])
def reindex():
    def _do_reindex():
        global _index_ready, _index_error
        _index_ready = False
        try:
            from indexer import rebuild_index
            rebuild_index()
            _index_ready = True
            _index_error = None
        except Exception as e:
            _index_error = str(e)

    threading.Thread(target=_do_reindex, daemon=True).start()
    return jsonify({
        "success": True,
        "message": "Re-indexing started in background. Check /rag/status for progress.",
    })


# ─── Entry point ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"🤖 ThreadChain RAG Service starting on port {RAG_PORT}")
    print(f"   LLM backend : {os.getenv('LLM_BACKEND', 'ollama')}")
    print(f"   Embeddings  : {os.getenv('EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2')}")
    print(f"   ChromaDB    : {os.getenv('CHROMA_PERSIST_DIR', './chroma_db')}")
    app.run(host="0.0.0.0", port=RAG_PORT, debug=False)
