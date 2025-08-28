from __future__ import annotations

import os
import re
import math
import sqlite3
from dataclasses import dataclass
from typing import List, Dict, Tuple, Any

import numpy as np
import faiss 
from sentence_transformers import SentenceTransformer


# ----------------------------- Data structures -----------------------------

@dataclass
class Record:
    doc_id: str  
    title: str
    text: str
    meta: Dict[str, Any]


# ----------------------------- Utilities -----------------------------

def get_db_path() -> str:
    """Resolve absolute path to backend/hns.db (same directory as this script)."""
    here = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(here, 'hns.db')
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"SQLite database not found at: {db_path}")
    return db_path


def connect_db(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def table_has_columns(conn: sqlite3.Connection, table: str, columns: List[str]) -> Dict[str, bool]:
    """Return a map of column -> exists for a given table."""
    try:
        cur = conn.execute(f"PRAGMA table_info({table})")
        existing = {row[1] for row in cur.fetchall()}  # column name at index 1
    except sqlite3.Error:
        existing = set()
    return {col: (col in existing) for col in columns}


def safe_row_get(row: sqlite3.Row, key: str, default: str = '') -> str:
    try:
        val = row[key]
        if val is None:
            return default
        return str(val)
    except Exception:
        return default


def normalize_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


# ----------------------------- Data loading -----------------------------

def load_records(conn: sqlite3.Connection) -> List[Record]:
    """
    Load only selected fields from builder_project:
      - builder_name
      - title
      - location
      - full_address
      - locality
    Do not import any other fields or tables.
    """
    records: List[Record] = []

    project_cols = ['id', 'builder_name', 'title', 'location', 'full_address', 'locality']
    _ = table_has_columns(conn, 'builder_project', project_cols)
    try:
        cur = conn.execute("SELECT id, builder_name, title, location, full_address, locality FROM builder_project")
        for row in cur.fetchall():
            pid = safe_row_get(row, 'id', '')
            builder_name = safe_row_get(row, 'builder_name', '')
            title = safe_row_get(row, 'title', '')
            location = safe_row_get(row, 'location', '')
            full_address = safe_row_get(row, 'full_address', '')
            locality = safe_row_get(row, 'locality', '')

            
            display_title = normalize_whitespace(" ".join([p for p in [builder_name, title] if p])) or f"Project {pid}"
            text = normalize_whitespace(" ".join([p for p in [builder_name, title, location, full_address, locality] if p]))

            records.append(Record(
                doc_id=f"project:{pid}",
                title=display_title,
                text=text,
                meta={'type': 'project', 'id': pid}
            ))
    except sqlite3.Error:
        try:
            cur = conn.execute("SELECT * FROM builder_project")
            for row in cur.fetchall():
                pid = safe_row_get(row, 'id', '')
                builder_name = safe_row_get(row, 'builder_name', '')
                title = safe_row_get(row, 'title', '')
                location = safe_row_get(row, 'location', '')
                full_address = safe_row_get(row, 'full_address', '')
                locality = safe_row_get(row, 'locality', '')
                display_title = normalize_whitespace(" ".join([p for p in [builder_name, title] if p])) or f"Project {pid}"
                text = normalize_whitespace(" ".join([p for p in [builder_name, title, location, full_address, locality] if p]))
                records.append(Record(
                    doc_id=f"project:{pid}",
                    title=display_title,
                    text=text,
                    meta={'type': 'project', 'id': pid}
                ))
        except sqlite3.Error:
            pass

    return records


# ----------------------------- Tokenization & TF-IDF -----------------------------

_STOPWORDS = set(
    """
    a an the and or but if then else when where while of in on at to for from by with without
    is are was were be been being have has had do does did can could should would may might will
    this that these those it its as not no yes you your yours we our ours they them their theirs
    i me my mine he him his she her hers which who whom what why how about into over under more most
    """.split()
)


def tokenize(text: str) -> List[str]:
    tokens = re.findall(r"[a-z0-9]+", text.lower())
    return [t for t in tokens if len(t) > 1 and t not in _STOPWORDS]


def build_vocabulary(docs: List[List[str]], min_df: int = 1, max_features: int | None = None) -> Dict[str, int]:
    df: Dict[str, int] = {}
    for toks in docs:
        for t in set(toks):
            df[t] = df.get(t, 0) + 1
    items = [(t, c) for t, c in df.items() if c >= min_df]
    items.sort(key=lambda x: (-x[1], x[0]))
    if max_features is not None:
        items = items[:max_features]
    vocab = {t: idx for idx, (t, _) in enumerate(items)}
    return vocab


def compute_tfidf_matrix(tokenized_docs: List[List[str]], vocab: Dict[str, int]) -> np.ndarray:
    n_docs = len(tokenized_docs)
    n_terms = len(vocab)
    if n_terms == 0 or n_docs == 0:
        return np.zeros((n_docs, 0), dtype=np.float32)

    df = np.zeros(n_terms, dtype=np.int32)
    for toks in tokenized_docs:
        seen = set()
        for t in toks:
            idx = vocab.get(t)
            if idx is not None and idx not in seen:
                df[idx] += 1
                seen.add(idx)

    idf = np.log((n_docs + 1) / (df + 1)) + 1.0  # smoothed idf

    X = np.zeros((n_docs, n_terms), dtype=np.float32)
    for i, toks in enumerate(tokenized_docs):
        if not toks:
            continue
        tf: Dict[int, int] = {}
        for t in toks:
            idx = vocab.get(t)
            if idx is not None:
                tf[idx] = tf.get(idx, 0) + 1
        if not tf:
            continue
        max_tf = max(tf.values())
        for idx, cnt in tf.items():
            tf_norm = 0.5 + 0.5 * (cnt / max_tf)
            X[i, idx] = tf_norm * idf[idx]

    # L2 normalize rows (cosine-like similarity via inner product)
    norms = np.linalg.norm(X, axis=1, keepdims=True) + 1e-12
    X = X / norms
    return X


# ----------------------------- FAISS Indexer -----------------------------

class FaissSearcher:
    def __init__(self, vectors: np.ndarray, records: List[Record]):
        if vectors.ndim != 2:
            raise ValueError("vectors must be 2D array [num_docs, dim]")
        self.records = records
        self.dim = vectors.shape[1]
        if self.dim == 0:
            # Build a dummy 1-d index to avoid FAISS errors (no terms)
            vectors = np.zeros((vectors.shape[0], 1), dtype=np.float32)
            self.dim = 1
        self.index = faiss.IndexFlatIP(self.dim)  # inner product (works as cosine when vectors are L2-normalized)
        self.index.add(vectors.astype(np.float32))

    def search(self, query_vec: np.ndarray, top_k: int = 5) -> List[Tuple[Record, float]]:
        if query_vec.ndim == 1:
            query_vec = query_vec.reshape(1, -1)
        if query_vec.shape[1] != self.dim:
            # pad or trim to match index dim
            if query_vec.shape[1] < self.dim:
                pad = np.zeros((query_vec.shape[0], self.dim - query_vec.shape[1]), dtype=np.float32)
                query_vec = np.concatenate([query_vec, pad], axis=1)
            else:
                query_vec = query_vec[:, : self.dim]
        D, I = self.index.search(query_vec.astype(np.float32), top_k)
        results: List[Tuple[Record, float]] = []
        for idx, score in zip(I[0], D[0]):
            if idx == -1:
                continue
            results.append((self.records[idx], float(score)))
        return results


# ----------------------------- High-level builder -----------------------------

class SimilarityEngine:
    def __init__(self, records: List[Record]):
        self.records = records
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        # Use title + text for embedding
        texts = [r.title + " \n " + r.text for r in records]
        self.doc_matrix = self.model.encode(texts, show_progress_bar=True, convert_to_numpy=True, normalize_embeddings=True)
        self.searcher = FaissSearcher(self.doc_matrix, self.records)

    def encode_query(self, query: str) -> np.ndarray:
        qv = self.model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
        return qv

    def similarity_search(self, query: str, top_k: int = 5) -> List[Tuple[Record, float]]:
        qv = self.encode_query(query)
        return self.searcher.search(qv, top_k=top_k)


# ----------------------------- Script entrypoint -----------------------------

PREDEFINED_QUERIES = [
    "Looking for a luxury apartment by Shree Developers in Thane",
    "Show me affordable housing projects in Ghansoli locality",
    "Find builder projects near Airoli railway station",
    "I want a spacious 2BHK in Koparkharaine with a detailed address",
    "Are there any Omkar Constructions projects in Thane locality?",
    "Shree Developers Thane",
    "Omkar Constructions Ghansoli",
    "Navkar Realty Koparkharaine",
    "Krishna Constructions Airoli",
    "full_address Ghansoli locality",
]


def main():
    db_path = get_db_path()
    print(f"[similarity] Using database: {db_path}")
    conn = connect_db(db_path)
    try:
        records = load_records(conn)
        print(f"[similarity] Loaded {len(records)} records from DB")
        if not records:
            print("[similarity] No records found. Exiting.")
            return
        engine = SimilarityEngine(records)

        print("\n[similarity] Running predefined queries:\n")
        for q in PREDEFINED_QUERIES:
            print(f"Query: {q}")
            results = engine.similarity_search(q, top_k=5)
            if not results:
                print("  (no results)\n")
                continue
            for rank, (rec, score) in enumerate(results, start=1):
                label = f"{rec.meta.get('type')}#{rec.meta.get('id')}"
                print(f"  {rank:>2}. [{score: .3f}] {label} | {rec.title}")
            print()
    finally:
        conn.close()


if __name__ == "__main__":
    main()


