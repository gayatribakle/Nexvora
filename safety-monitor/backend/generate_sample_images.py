"""
Generate sample violation images for testing
"""
import os
import cv2
import numpy as np
from datetime import datetime

# Evidence directory path
EVIDENCE_DIR = os.path.join(os.path.dirname(__file__), "uploads", "evidence")
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# Violation types to generate
violation_types = [
    "no_hardhat",
    "no_safety_vest",
    "smoking",
    "fire_hazard",
    "no_gloves",
    "no_safety_shoes",
]

def create_sample_image(violation_type, width=640, height=480):
    """Create a colored image with violation type text"""
    # Create colored background
    img = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Different colors for different violation types
    colors = {
        "no_hardhat": (0, 0, 255),      # Red
        "no_safety_vest": (0, 165, 255), # Orange
        "smoking": (128, 0, 128),       # Purple
        "fire_hazard": (0, 0, 139),     # Dark Red
        "no_gloves": (255, 255, 0),     # Yellow
        "no_safety_shoes": (165, 42, 42), # Brown
    }
    
    color = colors.get(violation_type, (100, 100, 100))
    img[:] = color
    
    # Add text
    text = f"VIOLATION: {violation_type.replace('_', ' ').upper()}"
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Main text
    cv2.putText(img, text, (40, height//2 - 20), 
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 3)
    
    # Timestamp
    cv2.putText(img, timestamp, (40, height//2 + 40), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    # Warning symbol
    cv2.putText(img, "⚠", (width - 120, 80), 
                cv2.FONT_HERSHEY_SIMPLEX, 3, (255, 255, 255), 4)
    
    return img

# Generate 3 images per violation type (simulating different detections)
print("Generating sample violation images...")
print(f"Saving to: {EVIDENCE_DIR}\n")

count = 0
for vtype in violation_types:
    for i in range(3):
        # Create timestamp
        ts = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"{vtype}_{ts}.jpg"
        filepath = os.path.join(EVIDENCE_DIR, filename)
        
        # Generate and save image
        img = create_sample_image(vtype)
        cv2.imwrite(filepath, img)
        
        print(f"✅ Created: {filename}")
        count += 1

print(f"\n🎉 Successfully created {count} sample violation images!")
print(f"📁 Location: {EVIDENCE_DIR}")
print(f"\nYou can now test image display in the frontend!")
print(f"URL format: http://localhost:8000/uploads/evidence/{violation_types[0]}_*.jpg")
