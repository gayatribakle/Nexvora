"""
Face Recognition Debug Script - Analyze Prerna Bhamre's false positive matches
Checks why she's matching other people incorrectly
"""
import sys
import os
import json
import numpy as np
from pathlib import Path
from typing import List, Tuple, Dict

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from app.database.session import SessionLocal
from app.detection.face.face_service import FaceService
from app.detection.face.face_adapter import FaceAdapter
from app.config.settings import settings

def normalize_embedding(embedding: np.ndarray) -> np.ndarray:
    """Normalize embedding to unit length"""
    if embedding is None:
        return None
    norm = np.linalg.norm(embedding)
    if norm > 0:
        return embedding / norm
    return embedding

def calculate_similarity(emb1: np.ndarray, emb2: np.ndarray) -> float:
    """Calculate similarity using same metric as face_adapter"""
    if emb1 is None or emb2 is None:
        return 0.0
    try:
        dist = np.linalg.norm(emb1 - emb2)
        similarity = float(1.0 / (1.0 + dist))
        return similarity
    except:
        return 0.0

def debug_face_recognition():
    """Analyze Prerna's face matches"""
    print("\n" + "="*80)
    print("FACE RECOGNITION DEBUG ANALYSIS - Prerna Bhamre")
    print("="*80)
    
    db = SessionLocal()
    try:
        # Load all embeddings
        print("\n📋 Loading worker embeddings from database...")
        face_svc = FaceService(None)  # Don't need adapter for loading
        embeddings = face_svc.load_known_embeddings(db)
        
        if not embeddings:
            print("❌ No embeddings found! No workers registered.")
            return
        
        print(f"✅ Loaded {len(embeddings)} worker embeddings")
        
        # Find Prerna
        prerna_idx = None
        for i, (worker_id, worker_name, embedding) in enumerate(embeddings):
            if worker_name and "prerna" in worker_name.lower():
                prerna_idx = i
                print(f"\n🔍 Found Prerna: ID={worker_id}, Name={worker_name}")
                break
        
        if prerna_idx is None:
            print("\n❌ Prerna not found in registered workers!")
            print("\n📌 Available workers:")
            for worker_id, worker_name, _ in embeddings:
                print(f"   - {worker_name} (ID: {worker_id})")
            return
        
        prerna_id, prerna_name, prerna_emb = embeddings[prerna_idx]
        
        if prerna_emb is None:
            print(f"❌ Prerna has no embedding!")
            return
        
        # Calculate similarities to all other workers
        print(f"\n🔬 Analyzing Prerna's similarities to {len(embeddings)-1} other workers...")
        print("-" * 80)
        
        similarities = []
        for i, (worker_id, worker_name, other_emb) in enumerate(embeddings):
            if i == prerna_idx:
                continue  # Skip self
            
            if other_emb is None:
                continue
            
            similarity = calculate_similarity(prerna_emb, other_emb)
            similarities.append({
                "worker_id": worker_id,
                "worker_name": worker_name,
                "similarity": similarity,
                "passes_threshold": similarity >= settings.FACE_MATCH_THRESHOLD,
                "distance": np.linalg.norm(prerna_emb - other_emb)
            })
        
        # Sort by similarity (highest first)
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        
        # Show results
        current_threshold = settings.FACE_MATCH_THRESHOLD
        print(f"\n⚙️  Current threshold: {current_threshold}")
        print(f"📊 Results for: {prerna_name} (ID: {prerna_id})\n")
        
        # High similarity matches (potential false positives)
        print("🚨 HIGH SIMILARITY MATCHES (potential false positives):")
        print("-" * 80)
        false_positives = [s for s in similarities if s["similarity"] >= current_threshold]
        if false_positives:
            for i, match in enumerate(false_positives, 1):
                print(f"{i}. {match['worker_name']:<30} ID: {match['worker_id']:<5} " +
                      f"Similarity: {match['similarity']:.4f} Distance: {match['distance']:.4f}")
        else:
            print("✅ No false positives above threshold!")
        
        # Medium similarity (borderline)
        print("\n⚠️  BORDERLINE MATCHES (0.35-0.38):")
        print("-" * 80)
        borderline = [s for s in similarities if 0.35 <= s["similarity"] < current_threshold]
        if borderline:
            for i, match in enumerate(borderline, 1):
                print(f"{i}. {match['worker_name']:<30} ID: {match['worker_id']:<5} " +
                      f"Similarity: {match['similarity']:.4f} Distance: {match['distance']:.4f}")
        else:
            print("✅ No borderline matches")
        
        # Top 10 all
        print("\n📈 TOP 10 CLOSEST MATCHES (by similarity):")
        print("-" * 80)
        for i, match in enumerate(similarities[:10], 1):
            status = "❌ FALSE +" if match["passes_threshold"] else "✅ OK"
            print(f"{i:2}. {match['worker_name']:<25} Sim: {match['similarity']:.4f} {status}")
        
        # Statistics
        print("\n📊 STATISTICS:")
        print("-" * 80)
        print(f"Total workers compared: {len(similarities)}")
        print(f"False positives (≥{current_threshold}): {len(false_positives)}")
        print(f"Borderline (0.35-0.38): {len(borderline)}")
        
        if similarities:
            avg_sim = np.mean([s["similarity"] for s in similarities])
            max_sim = max([s["similarity"] for s in similarities])
            min_sim = min([s["similarity"] for s in similarities])
            print(f"\nAverage similarity: {avg_sim:.4f}")
            print(f"Max similarity: {max_sim:.4f}")
            print(f"Min similarity: {min_sim:.4f}")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS:")
        print("-" * 80)
        if false_positives:
            print(f"❌ Prerna has {len(false_positives)} false positive matches!")
            print(f"   → Prerna's embedding may be too similar to others")
            print(f"   → Suggested threshold increase: 0.38 → 0.42-0.45")
            print(f"\n   Options:")
            print(f"   1. Increase FACE_MATCH_THRESHOLD to 0.42-0.45")
            print(f"   2. Increase FACE_MATCH_MIN_GAP from 0.02 to 0.05-0.10")
            print(f"   3. Re-enroll Prerna with better quality photos")
        else:
            print(f"✅ No false positives detected!")
            print(f"   Prerna's embedding is well-separated from others.")
        
        print("\n" + "="*80)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug_face_recognition()
