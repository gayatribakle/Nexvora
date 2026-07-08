"""
FRONTEND FILTERING - Hide Unknown Person Violations
Filter unknown person violations from dashboard and violation pages
Status: APPLIED
Date: 2026-06-18
"""

## PROBLEM FIXED

❌ BEFORE: Unknown person violations showing in Dashboard, Violations page, Alerts page
✅ AFTER: Unknown person violations hidden from UI (only stored in DB for audit)

---

## CHANGES MADE

### File 1: frontend/src/pages/violations/Violations.tsx
**Changes:**
```javascript
// Added filter to fetchViolations()
const filtered = (res.data.violations || []).filter((v: any) => v.worker_name !== "Unknown")

// Added filter to fetchReviewQueue()
const filtered = (res.data || []).filter((item: any) => item.worker_name !== "Unknown")
```

**Impact:**
- Violations page: Unknown person violations NOT displayed
- Review Queue tab: Unknown person violations NOT displayed
- All status tabs (All, Pending, Approved, Rejected): Unknown filtered out

### File 2: frontend/src/pages/alerts/Alerts.tsx
**Changes:**
```javascript
// Added smart filter to fetchAlerts()
const filtered = (res.data.alerts || []).filter((alert: any) => {
  if (alert.worker_name === "Unknown" && !alert.is_emergency) {
    return false  // Hide non-emergency unknown alerts
  }
  return true
})
```

**Impact:**
- Normal violations by unknown people: NOT displayed ❌
- Emergency alerts (fire, critical): STILL displayed ✅ (even if unknown person)
- Dashboard recent alerts: Filtered automatically

---

## DISPLAY BEHAVIOR

### Before:
```
Dashboard:
- Unknown person, no hardhat → Alert shown

Violations Page:
- Unknown person, smoking → Violation listed

Alerts Page:
- Unknown person, PPE violation → Alert shown
```

### After:
```
Dashboard:
- Unknown person, no hardhat → NOT shown
- Unknown person, FIRE → Still shown ✅ (emergency)

Violations Page:
- Unknown person, smoking → NOT shown
- Registered worker, smoking → Still shown ✅

Alerts Page:
- Unknown person, PPE violation → NOT shown
- Unknown person, FIRE → Still shown ✅ (emergency)
```

---

## DATABASE IMPACT

✅ **NO CHANGES TO DATABASE**
- Unknown person violations still stored in database
- Can be queried/audited manually
- Not deleted, just filtered from UI display
- Violations table: All 8 unknown person violations remain

---

## WHAT'S VISIBLE NOW

### Dashboard shows:
✅ Total violations count (original count from backend)
✅ Statistics (violations timeline, by type)
✅ Emergency alerts (fire by unknown people)
⚠️ Note: Stats may include unknown violations (backend doesn't filter yet)

### Violations page shows:
✅ Only registered worker violations
✅ All status tabs filtered
❌ Unknown person violations hidden

### Alerts page shows:
✅ Only registered worker alerts
✅ Emergency/fire by unknown people (safety critical)
❌ Non-emergency unknown person alerts hidden

---

## STATISTICS NOTE

**Dashboard stats (total_violations, etc.) may include unknown person violations because they're calculated on backend:**

If you want to also exclude unknown violations from statistics, you'll need to filter on backend:

```python
# File: backend/app/api/analytics.py

# In dashboard() endpoint:
violations = db.query(Violation).filter(
    Violation.worker_id != None  # Exclude unknown persons
).all()
```

---

## PAGES MODIFIED

| Page | File | Changes |
|------|------|---------|
| Violations | violations/Violations.tsx | Filter on fetch (2 places) |
| Alerts | alerts/Alerts.tsx | Filter on fetch (1 place) |
| Dashboard | dashboard/Dashboard.tsx | No changes (uses alerts API) |

---

## REBUILD REQUIRED

Frontend must be rebuilt for changes to take effect:

```bash
cd "SaaS Dashboard UI Design"
npm run build
# or for dev
npm run dev
```

---

## TESTING SCENARIOS

### Test 1: Violation page - No unknown persons
1. Go to Violations page
2. Check "All" tab
3. Should NOT see "Unknown" worker names
4. Should only see registered worker names

### Test 2: Alerts page - Emergency alerts for unknown still shown
1. Go to Alerts page
2. Unknown person PPE → NOT shown ❌
3. Unknown person FIRE → Still shown ✅
4. Emergency filter → Still shows fire/unknown

### Test 3: Dashboard
1. Dashboard loads
2. Recent alerts don't show unknown person PPE violations
3. Emergency alerts still appear

---

## FUTURE IMPROVEMENTS

To fully hide unknown violations:
1. Backend filter in analytics endpoints
2. Backend filter in alert broadcast logic
3. Option to view unknown violations in audit page

---

Status: ✅ COMPLETE
Version: 1.0
Date: 2026-06-18
