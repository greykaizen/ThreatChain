"""
indexer.py
Builds and persists the ChromaDB vector store from STIX data.
Uses sentence-transformers directly — no langchain dependency.
"""

import os
import shutil
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import chromadb
from db_loader import load_all_documents

load_dotenv()

CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
COLLECTION_NAME = "threadchain_stix"

# Singletons
_client = None
_collection = None
_model = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        print(f"[indexer] Loading embedding model: {EMBEDDING_MODEL}")
        _model = SentenceTransformer(EMBEDDING_MODEL)
        print("[indexer] Embedding model loaded ✅")
    return _model


def _get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client


def get_collection() -> chromadb.Collection:
    """Return the ChromaDB collection, building it if needed."""
    global _collection
    if _collection is None:
        _collection = _build_or_load()
    return _collection


def _build_or_load() -> chromadb.Collection:
    client = _get_client()

    # Check if collection already exists with data
    existing = [c.name for c in client.list_collections()]
    if COLLECTION_NAME in existing:
        col = client.get_collection(COLLECTION_NAME)
        count = col.count()
        if count > 0:
            print(f"[indexer] Loaded existing collection: {count} vectors")
            return col
        # Empty collection — rebuild
        client.delete_collection(COLLECTION_NAME)

    return _index_documents(client)


def rebuild_index() -> dict:
    """Force a full re-index from MySQL."""
    global _collection
    client = _get_client()

    # Drop existing collection
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    _collection = None

    _collection = _index_documents(client)
    return {"success": True, "indexed_documents": _collection.count()}


def _index_documents(client: chromadb.PersistentClient) -> chromadb.Collection:
    print("[indexer] Fetching documents from MySQL...")
    docs = load_all_documents()

    col = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    if not docs:
        print("[indexer] No documents found — empty collection created")
        return col

    model = _get_model()

    # Embed in batches of 64
    texts = [d["text"] for d in docs]
    metadatas = [d["metadata"] for d in docs]
    ids = [f"doc_{i}" for i in range(len(docs))]

    batch_size = 64
    print(f"[indexer] Embedding {len(texts)} chunks...")
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        embeddings = model.encode(batch, normalize_embeddings=True).tolist()
        all_embeddings.extend(embeddings)
        print(f"[indexer]   {min(i + batch_size, len(texts))}/{len(texts)} chunks embedded")

    # Add to ChromaDB in batches
    for i in range(0, len(texts), batch_size):
        col.add(
            documents=texts[i : i + batch_size],
            embeddings=all_embeddings[i : i + batch_size],
            metadatas=metadatas[i : i + batch_size],
            ids=ids[i : i + batch_size],
        )

    print(f"[indexer] Indexed {col.count()} chunks into ChromaDB ✅")
    return col


def get_indexed_count() -> int:
    try:
        col = get_collection()
        return col.count()
    except Exception:
        return 0
