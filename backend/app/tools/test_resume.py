import asyncio
import sys
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.tools.resume_parser import parse_resume

# sys.path.insert(0, os.path.join(os.path.dirname(__file__),
#                                 "ai-career-advisor/backend"))

async def main():
    # ── รับ path จาก argument หรือใช้ dummy text ───────────────────────────
    if len(sys.argv) > 1:
        file_path = Path(sys.argv[1])

        if not file_path.exists():
            print(f"❌ ไม่พบไฟล์: {file_path}")
            sys.exit(1)
 
        file_bytes = file_path.read_bytes()
        filename   = file_path.name

        print(f"📄 ไฟล์  : {filename}")
        print(f"📦 ขนาด : {len(file_bytes):,} bytes")
 
    else:
        # Fallback: สร้าง PDF จำลองด้วย text ล้วน
        print("No file given — using .txt dummy")
        dummy = """John Doe
Software Engineer | Bangkok, Thailand
john.doe@email.com | github.com/johndoe
 
EXPERIENCE
Senior Backend Developer — Agoda (2021-present)
- Built microservices with Python (FastAPI) and Go
- Managed PostgreSQL + Redis on AWS
 
SKILLS
Python, Go, FastAPI, SQL, Docker, Kubernetes, AWS, Git
 
EDUCATION
B.Eng Computer Engineering — Chulalongkorn University 2018
"""
        file_bytes = dummy.encode()
        filename   = "dummy_resume.txt"

    # ── เรียก parser ────────────────────────────────────────────────────────
    print("\n" + "─" * 50)
    try:
        result = await parse_resume(file_bytes, filename)
 
        print(f"✅ สำเร็จ — ได้ {len(result):,} ตัวอักษร\n")
        print("── ข้อความที่ extract ได้ ──")
        # แสดง 1,500 ตัวแรก
        preview = result[:1500]
        print(preview)
        
        if len(result) > 1500:
            print(f"\n... (ตัดแสดง — ยังมีอีก {len(result)-1500:,} ตัวอักษร)")
 
    except ValueError as e:
        print(f"❌ ไม่รองรับไฟล์ประเภทนี้: {e}")
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(main())