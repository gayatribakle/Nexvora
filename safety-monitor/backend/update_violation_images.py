"""
Update existing violations with sample evidence images
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "safety_monitor.db")
EVIDENCE_DIR = os.path.join(os.path.dirname(__file__), "uploads", "evidence")

# Get list of generated images
images = [f for f in os.listdir(EVIDENCE_DIR) if f.endswith('.jpg')]
print(f"📁 Found {len(images)} images in evidence directory")

# Connect to database
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get all violations without screenshot_path
cursor.execute("""
    SELECT id, violation_type, worker_id 
    FROM violations 
    WHERE screenshot_path IS NULL OR screenshot_path = ''
    ORDER BY created_at
""")
violations = cursor.fetchall()

print(f"📊 Found {len(violations)} violations without evidence images")

# Update violations with images (assign in round-robin fashion)
if images and violations:
    for i, (viol_id, viol_type, worker_id) in enumerate(violations):
        # Find matching image type or use round-robin
        matching_images = [img for img in images if viol_type.replace(' ', '_') in img]
        if matching_images:
            selected_image = matching_images[i % len(matching_images)]
        else:
            selected_image = images[i % len(images)]
        
        # Update with relative path
        screenshot_path = f"/uploads/evidence/{selected_image}"
        
        cursor.execute("""
            UPDATE violations 
            SET screenshot_path = ?
            WHERE id = ?
        """, (screenshot_path, viol_id))
        
        print(f"✅ Updated violation {viol_id}: {viol_type} -> {selected_image}")

# Commit changes
conn.commit()

# Verify updates
cursor.execute("""
    SELECT COUNT(*) FROM violations 
    WHERE screenshot_path IS NOT NULL AND screenshot_path != ''
""")
updated_count = cursor.fetchone()[0]

print(f"\n🎉 Successfully updated {updated_count} violations with evidence images!")
print(f"📍 Database: {DB_PATH}")

# Show sample violations
cursor.execute("""
    SELECT id, violation_type, screenshot_path, worker_id 
    FROM violations 
    WHERE screenshot_path IS NOT NULL 
    LIMIT 5
""")
samples = cursor.fetchall()
print(f"\n📋 Sample violations with images:")
for viol_id, vtype, path, worker_id in samples:
    print(f"  Violation #{viol_id}: {vtype} (Worker: {worker_id})")
    print(f"    Path: {path}")

conn.close()
