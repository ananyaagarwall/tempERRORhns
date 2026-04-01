import os
import re
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


