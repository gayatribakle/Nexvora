import sqlite3

conn = sqlite3.connect('data/safety_monitor.db')
cursor = conn.cursor()

# Check the actual column names in violations table
cursor.execute("PRAGMA table_info(violations)")
columns = cursor.fetchall()
print("Violations table columns:")
for col in columns:
    print(f"  {col[1]} ({col[2]})")

print("\n" + "="*80)

# Check sample violations
cursor.execute("""
    SELECT id, violation_type, evidence_path, screenshot_path 
    FROM violations 
    LIMIT 5
""")
violations = cursor.fetchall()

print("\nSample violations (first 5):")
for v in violations:
    print(f"\nID: {v[0]}")
    print(f"  Type: {v[1]}")
    print(f"  evidence_path: {v[2]}")
    print(f"  screenshot_path: {v[3]}")

print("\n" + "="*80)

# Count how many have evidence_path vs screenshot_path
cursor.execute("SELECT COUNT(*) FROM violations WHERE evidence_path IS NOT NULL AND evidence_path != ''")
evidence_count = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM violations WHERE screenshot_path IS NOT NULL AND screenshot_path != ''")
screenshot_count = cursor.fetchone()[0]

cursor.execute("SELECT COUNT(*) FROM violations WHERE (evidence_path IS NULL OR evidence_path = '') AND (screenshot_path IS NULL OR screenshot_path = '')")
no_image_count = cursor.fetchone()[0]

print(f"\nStatistics:")
print(f"  Total violations: 100")
print(f"  With evidence_path: {evidence_count}")
print(f"  With screenshot_path: {screenshot_count}")
print(f"  Without any image: {no_image_count}")

conn.close()
