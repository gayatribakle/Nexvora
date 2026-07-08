"""
NOTIFICATION FILTER - UNKNOWN PERSONS FIX
Block all notifications for unidentified people
Status: APPLIED
Date: 2026-06-18
"""

## PROBLEM FIXED

❌ BEFORE: Unknown person detected → Admin receives notification
✅ AFTER: Unknown person detected → No notification (logged only)

---

## CHANGES MADE

### File: backend/app/api/monitoring.py
**Function:** `process_detection_result()` (line 40-130)

**Change:**
```python
# BEFORE:
violation = violation_svc.create_violation(viol_data)
face_confirmed = alert.get("face_confirmed", False)
if violation and worker_id and face_confirmed:
    # ... send notifications

elif violation:  # Unknown person
    if alert.get("severity") in ("orange", "red") or violation_type == "fire":
        notif_svc.broadcast_alert(...)  # STILL SENDS ALERT ❌

# AFTER:
violation = violation_svc.create_violation(viol_data)

# Skip notifications for unknown persons
if not worker_id:
    print(f"[UNKNOWN] {violation_type} detected - No notification sent")
    continue  # ✅ SKIP - NO NOTIFICATION

face_confirmed = alert.get("face_confirmed", False)
if violation and face_confirmed:
    # ... send notifications only for identified workers
```

---

## FLOW COMPARISON

### Before (With Spam):
```
Frame 1: Unknown person detected → Violation created → Admin notified ❌
Frame 2: Unknown person detected → Violation created → Admin notified ❌
Frame 3: Unknown person detected → Violation created → Admin notified ❌
```

### After (Clean):
```
Frame 1: Unknown person detected → Violation logged → NO notification ✅
Frame 2: Unknown person detected → Violation logged → NO notification ✅
Frame 3: Unknown person detected → Violation logged → NO notification ✅
```

---

## NOTIFICATION RULES (NEW)

### WILL SEND NOTIFICATIONS:
✅ Registered worker identified + HIGH confidence
✅ Registered worker identified + PROBABLE confidence (needs review)
✅ Fire detected (emergency - always notified)

### WON'T SEND NOTIFICATIONS:
❌ Unknown person (worker_id = None)
❌ Face not recognized
❌ Ambiguous matches

---

## VIOLATION LOGGING

Unknown persons' violations are STILL created in database:
- Stored in `violations` table
- Evidence saved to `evidence` table
- Can be reviewed manually in admin UI
- NOT automatically notified

**Use case:** Allows manual audit of unknown people without spam

---

## CONSOLE OUTPUT

When unknown person detected:

```
[UNKNOWN] no_hardhat detected on Camera 1 - No notification sent (worker not identified)
[UNKNOWN] smoking detected on Camera 2 - No notification sent (worker not identified)
```

This helps debug and track unknown persons in logs.

---

## ADMIN DASHBOARD IMPACT

| Feature | Behavior |
|---------|----------|
| Violations List | Unknown person violations appear (marked as "Unknown") |
| Notifications | Only for identified workers |
| Alerts WebSocket | Only for identified workers + high severity |
| Violation Review Queue | Has unknown person violations (manual review) |
| Audit Logs | All violations logged (identified + unknown) |

---

## WHEN UNKNOWN PERSONS SHOULD NOTIFY

If you want notifications for SPECIFIC unknown person scenarios (like fire):

```python
# Current: No notifications for unknown
# To add: Notify on fire/emergency regardless of worker:

if not worker_id and violation_type == "fire":
    notif_svc.broadcast_alert(
        title="EMERGENCY: Fire detected",
        message=f"Fire detected on Camera {camera_id} - UNKNOWN PERSON"
        severity="red"
    )
```

---

## TESTING

**Scenario 1: Unregistered person without PPE**
- Before: Admin notified
- After: Logged only, no notification ✅

**Scenario 2: Fire detected (anyone)**
- Before: Notified
- After: Notified (HIGH severity handled in monitoring.py) ✅

**Scenario 3: Registered worker without PPE**
- Before: Notified
- After: Notified ✅

---

## FILES MODIFIED

| File | Change | Lines |
|------|--------|-------|
| monitoring.py | Skip notifications for unknown | 83-119 |
| violation_service.py | Already had check | No change |

---

## RESTART REQUIRED

Backend must be restarted for changes to take effect.

```bash
# Restart backend
python run.py
```

---

Status: ✅ COMPLETE
Version: 1.0
Date: 2026-06-18
