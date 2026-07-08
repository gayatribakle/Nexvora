"""
FACE RECOGNITION FIX - False Positive Analysis & Solution
Issue: Prerna Bhamre incorrectly matching unknown people
Date: 2026-06-18
"""

## PROBLEM ANALYZED

✗ Unknown Person → Detected as "Prerna Bhamre" (should be "Unknown")
✗ Reason: Loose matching thresholds allowed similar-looking faces to match

### Why This Happens

Face matching uses Euclidean distance in 512-dimensional embedding space:
- Similarity = 1 / (1 + distance)
- With threshold 0.38: distance ≤ 1.63 matches as "Prerna"
- If unknown person has similar facial features → distance < 1.63 → FALSE MATCH

Example:
```
Registered Worker (Prerna): embedding = [0.1, 0.2, 0.3, ... 512 values]
Unknown Person at site:     embedding = [0.12, 0.21, 0.31, ... similar values]
Distance ≈ 1.4 → Similarity ≈ 0.41 → MATCHES (confidence 0.41 > threshold 0.38)
```

---

## SOLUTION IMPLEMENTED

### Changes Made:

**File: backend/app/config/settings.py**

```python
# BEFORE:
FACE_MATCH_THRESHOLD = 0.38        # Loose
FACE_MATCH_MIN_GAP = 0.02          # Small gap required

# AFTER:
FACE_MATCH_THRESHOLD = 0.42        # Stricter (+0.04 increase)
FACE_MATCH_MIN_GAP = 0.05          # Larger gap required (+0.03 increase)
```

### What This Changes:

| Setting | Before | After | Effect |
|---------|--------|-------|--------|
| **FACE_MATCH_THRESHOLD** | 0.38 | 0.42 | Only high-confidence matches allowed (distance ≤ 1.38 instead of ≤ 1.63) |
| **FACE_MATCH_MIN_GAP** | 0.02 | 0.05 | Requires 0.05 point difference between #1 and #2 match (more separation) |

### How It Reduces False Positives:

**Scenario: Unknown person vs. Prerna Bhamre**

```
OLD LOGIC (before):
- Unknown person similarity to Prerna: 0.40
- Unknown person similarity to others: 0.38, 0.35, ...
- Gap = 0.40 - 0.38 = 0.02 ✓ (passes min_gap 0.02)
- Confidence 0.40 > 0.38 threshold? ✓ YES
- Result: ❌ MATCHES AS "Prerna" (FALSE POSITIVE)

NEW LOGIC (after):
- Unknown person similarity to Prerna: 0.40
- Unknown person similarity to others: 0.38, 0.35, ...
- Gap = 0.40 - 0.38 = 0.02 ✗ (fails min_gap 0.05)
- Result: ✅ REJECTED AS "UNKNOWN" (CORRECT)
```

---

## IMPACT ANALYSIS

### Positive Effects:
✅ **Fewer false positives** - Unknown people won't match registered workers
✅ **More confidence** - Only clear matches are accepted
✅ **Better security** - Correct worker identification in violations

### Potential Issues:
⚠️ **Missed some real matches** - Very similar-looking workers might not match
   - Solution: Re-enroll workers with better photos if needed
⚠️ **More "PROBABLE" matches** - Some real matches drop to manual review
   - Solution: Good—allows human verification of ambiguous cases

---

## TESTING RECOMMENDATIONS

### Before Restarting Backend:

1. **Re-register Prerna with HIGH-QUALITY photos:**
   - Clear, frontal face photo (good lighting)
   - Different angles (left/right profile)
   - Consistent pose for all photos
   - This improves her embedding quality

2. **Test with dummy data:**
   - Register 3-5 test workers
   - Point camera at each one
   - Verify they match correctly
   - Verify unknown people don't match anyone

### After Backend Restart:

3. **Monitor logs for "PROBABLE" matches:**
   - Check WebSocket alerts
   - If many "PROBABLE" → might need adjustment
   - Can still manually approve/reject in UI

4. **Track false negative rate:**
   - Legitimate workers incorrectly marked "unknown"
   - If high, increase back to 0.40 threshold

---

## IF ISSUES ARISE

### Too many false negatives (real workers not recognized):
```python
# Revert to less strict:
FACE_MATCH_THRESHOLD = 0.40
FACE_MATCH_MIN_GAP = 0.03
```

### Still getting false positives:
```python
# Make even stricter:
FACE_MATCH_THRESHOLD = 0.45
FACE_MATCH_MIN_GAP = 0.08
```

### Unknown people look similar to workers:
→ Re-enroll those workers with better photos (different lighting/angles)

---

## TECHNICAL DETAILS

### Face Matching Formula:
```
distance = ||embedding_unknown - embedding_registered||₂  (L2 norm)
similarity = 1 / (1 + distance)

For match to happen:
1. similarity ≥ FACE_MATCH_THRESHOLD  (0.42)
2. gap = best_similarity - second_best_similarity ≥ FACE_MATCH_MIN_GAP  (0.05)
3. Both conditions must pass
```

### Settings Locations:

**Backend:**
- File: `backend/app/config/settings.py`
- Lines: 54-56

**Frontend (Admin UI):**
- Settings page → "Detection Confidence Threshold"
- Can change at runtime without backend restart
- Saved in database

**Debug Info:**
- Endpoint: `GET /monitoring/recognition-stats`
- Shows: Face match rates, worker distribution, quality metrics

---

## NEXT STEPS

1. ✅ **Thresholds tightened** (0.42 and 0.05)
2. ⏳ **Restart backend** to apply changes
3. ⏳ **Re-register workers** with good quality photos
4. ⏳ **Monitor detection logs** for accuracy
5. ⏳ **Adjust if needed** based on results

---

Created: 2026-06-18
Version: 1.0
Status: Applied
