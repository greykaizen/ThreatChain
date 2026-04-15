"""
retriever.py
RAG query pipeline — no langchain dependency.
1. Embed the question with sentence-transformers
2. Query ChromaDB for top-k similar chunks
3. Call LLM (Ollama or OpenAI) with context
4. Return answer + source metadata
"""

import os
import requests
from dotenv import load_dotenv
from indexer import get_collection, _get_model

load_dotenv()

LLM_BACKEND = os.getenv("LLM_BACKEND", "ollama").lower()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

SYSTEM_PROMPT = (
    "You are a cybersecurity threat intelligence analyst assistant for the ThreadChain platform. "
    "Answer questions about STIX threat intelligence reports, indicators of compromise (IOCs), "
    "malware campaigns, threat actors, and security incidents. "
    "Use ONLY the provided context. If the context is insufficient, say so clearly. "
    "Be concise, factual, and cite which reports or indicators you reference."
)


def query(question: str, top_k: int = 5) -> dict:
    """Main RAG query. Returns { success, answer, sources, context_used }."""
    try:
        model = _get_model()
        col = get_collection()

        # Embed the question
        q_embedding = model.encode([question], normalize_embeddings=True).tolist()[0]

        # Query ChromaDB
        results = col.query(
            query_embeddings=[q_embedding],
            n_results=min(top_k, col.count() or 1),
            include=["documents", "metadatas", "distances"],
        )

        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        if not documents:
            return {
                "success": True,
                "answer": (
                    "No relevant threat intelligence data found. "
                    "Try clicking 'Re-index' to index your STIX reports first."
                ),
                "sources": [],
                "context_used": 0,
            }

        # Build context
        context = "\n\n---\n\n".join(documents)

        # Build sources list
        sources = []
        for meta, dist in zip(metadatas, distances):
            entry = dict(meta)
            # Convert distance to a relevance score (cosine: lower distance = more similar)
            entry["relevance_score"] = round(max(0.0, 1.0 - float(dist)), 4)
            sources.append(entry)

        # Call LLM
        answer = _call_llm(question, context)

        return {
            "success": True,
            "answer": answer,
            "sources": sources,
            "context_used": len(documents),
        }

    except Exception as e:
        return {"success": False, "error": str(e), "answer": "", "sources": []}


def _call_llm(question: str, context: str) -> str:
    if LLM_BACKEND == "gemini" and GEMINI_API_KEY:
        return _call_gemini(question, context)
    if LLM_BACKEND == "openai" and OPENAI_API_KEY:
        return _call_openai(question, context)
    # Auto-detect: if a key is set, use it regardless of LLM_BACKEND
    if GEMINI_API_KEY:
        return _call_gemini(question, context)
    if OPENAI_API_KEY:
        return _call_openai(question, context)
    return _call_ollama(question, context)


def _call_ollama(question: str, context: str) -> str:
    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"=== THREAT INTELLIGENCE CONTEXT ===\n{context}\n"
        f"=== END CONTEXT ===\n\n"
        f"Question: {question}\n\nAnswer:"
    )
    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.1, "num_predict": 512},
            },
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json().get("response", "").strip()
    except requests.exceptions.ConnectionError:
        return _fallback_answer(context)
    except Exception as e:
        return f"LLM error: {e}"


def _call_gemini(question: str, context: str) -> str:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"=== THREAT INTELLIGENCE CONTEXT ===\n{context}\n"
            f"=== END CONTEXT ===\n\n"
            f"Question: {question}"
        )
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Gemini error: {e}"


def _call_openai(question: str, context: str) -> str:
    try:
        import openai
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
            ],
            temperature=0.1,
            max_tokens=512,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"OpenAI error: {e}"


def _fallback_answer(context: str) -> str:
    """When no LLM is available, summarise the retrieved chunks directly."""
    lines = [
        "⚠️  No LLM backend detected (Ollama not running, no OpenAI key set).",
        "Most relevant threat intelligence records found:\n",
    ]
    for i, chunk in enumerate(context.split("\n\n---\n\n")[:5], 1):
        title = next(
            (ln for ln in chunk.split("\n") if ln.startswith("Title:")),
            chunk[:120],
        )
        lines.append(f"{i}. {title}")
    lines.append("\nTo get AI answers: run  ollama run llama3  in a terminal.")
    return "\n".join(lines)
