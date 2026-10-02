# Doc — แผนที่เอกสาร

อ่านเฉพาะโฟลเดอร์ที่เกี่ยวกับงาน · อย่า `@Doc/` ทั้งก้อน (เสีย token)

## ชั้นเอกสาร

| โฟลเดอร์ | บทบาท | เมื่อไหร่เปิด |
|---------|--------|---------------|
| `00_hub/AskKeep.txt` | ล็อกถามตอบ + สถานะส่งมอบ `[✓]/[~]/[ ]` + Set A | เช็กขอบเขต / สิ่งที่โค้ดทำแล้ว |
| `01_blueprint/` | แผนยาว (แม่) | ออกแบบใหญ่ / หาหัวข้อยังไม่แตกไฟล์ |
| `02_shell/` | ชั้นเว็บ · boot · load path | Boot failed / cache / LOADING / จอดำก่อน sim |
| `03_domains/` | สเปกแยกตาม OOP | ลงมือโดเมนเดียว |
| `99_log/` | บันทึกอาการ / log ชั่วคราว | ดีบักรอบนั้น |

## Domains (`03_domains/`)

| โฟลเดอร์ | โฟกัส | ไฟล์หลัก |
|---------|--------|----------|
| `map-path/` | Path · L1–L3 · BaseChunk · Place snap | `README.md` → AskKeep §1 |
| `unit/` | ClassUnit / Player / Enemy / Ally | `README.md` → AskKeep §2 |
| `weapon-item/` | ClassBaseGun · inventory · craft | `README.md` → AskKeep §3 |
| `input/` | Unified Input (คน+บอท) เชื่อม block ⇄ weapon | `README.md` |
| `block/` | PlaceHold · BaseBlock · ประตู · occupancy | `README.md` |
| `turret/` | ป้อมจาก `weaponId` + infiniteAmmo บนบล็อก | `README.md` |
| `ai/` | Stage / Goal / Mediator | `AI-Stage-Goals-and-Actions.txt` + `NextPlan/` (Phase 1 ในโค้ดแล้ว · 2a+ ยัง) |
| `world-gen/` | Gen object Map | `README.md` → AskKeep §5 |
| `ui/` | HUD / overlay | `README.md` → AskKeep §6 |
| `menu-net/` | Menu · hash join · net (เฟสถัดไป) | `README.md` → AskKeep §7 |

## กฎสั้น

1. **AskKeep = hub** — สถานะ + ล็อก · ไม่ยัดสเปกยาวซ้ำ
2. **หนึ่งความจริงต่อหัวข้อ** — อย่าคัดลอก blueprint ทั้งก้อนลงทุกโดเมน
3. **AI NextPlan** อยู่แค่ `03_domains/ai/NextPlan/` — ไม่ใช่คิวทั้งเกม
4. ตัวเลขสเกล = **Set A** ใน AskKeep (Path 1024 · L3 64) — ไม่ใช้ 800/400/200/100
5. โค้ดสำคัญ: กฎใน Engine · Action จาก Provider · คนกับบอทช่องทางเดียว

## @ โฟกัสตัวอย่าง

- รีแฟค AI stage → `@Doc/03_domains/ai`
- วางบล็อก / consume → `@Doc/03_domains/block` + `@Doc/03_domains/input`
- turret / registry → `@Doc/03_domains/turret` + `@Doc/03_domains/weapon-item`
- Boot / cache → `@Doc/02_shell`
