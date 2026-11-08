# Doc — แผนที่เอกสาร

อ่านเฉพาะโฟลเดอร์ที่เกี่ยวกับงาน · อย่า `@Doc/` ทั้งก้อน (เสีย token)

## ชั้นเอกสาร

| โฟลเดอร์ | บทบาท | เมื่อไหร่เปิด |
|---------|--------|---------------|
| `00_hub/AskKeep.txt` | ล็อกถามตอบ + สถานะส่งมอบ `[✓]/[~]/[ ]` + Set A | เช็กขอบเขต / สิ่งที่โค้ดทำแล้ว |
| `01_blueprint/` | แผนยาว (แม่) · GameLoop curve | ออกแบบใหญ่ / เฟสแมตช์·คลื่น → `gameloop-curve.md` |
| `02_shell/` | ชั้นเว็บ · boot · load path | Boot failed / cache / LOADING / จอดำก่อน sim |
| `03_domains/` | สเปกแยกตาม OOP | ลงมือโดเมนเดียว |
| `99_log/` | บันทึกอาการ / คิวค้าง / OOP pack index | ดีบักรอบนั้น · อ่าน `PACK_INDEX` ก่อน · คิว editor → `editor-multi-map-queue.md` · Hash ค้าง → `menu-hash-display-parked.md` |

## Skills (`.cursor/skills/`)

อ่าน **หนึ่ง** `SKILL.md` ที่ตรงงาน · อย่า `@.cursor/skills` ทั้งโฟลเดอร์ (เสีย token)

### เวิร์กโฟลว์โปรเจกต์

| skill | เมื่อไหร่เปิด | พาธ |
|-------|----------------|------|
| `token-safe-work` | เริ่มงาน · อ่าน Doc · สำรวจโฟลเดอร์ · แตะ `.env` / กิ่ง | `.cursor/skills/token-safe-work/SKILL.md` |
| `reply-understanding` | ผู้ใช้เล่าอาการ+แนวแก้ · ยืนยัน/แก้ความเข้าใจ ก่อนลงมือโค้ด | `.cursor/skills/reply-understanding/SKILL.md` |

### OOP review pack (`oop-code-structure-pack`)

รายละเอียดแพ็ก → `Doc/99_log/oop-code-structure-PACK_INDEX.md` + `oop-code-structure-README.md`  
เปิด skill ทีละตัวตามหัวข้อด้านล่าง (อยู่ใต้ `.cursor/skills/<name>/SKILL.md`)

| skill | เมื่อไหร่เปิด |
|-------|----------------|
| `class-responsibility-checker` | ขอบเขตหน้าที่คลาสไม่ชัด / God class |
| `method-cohesion-checker` | เมธอดปนหลายงาน |
| `constructor-sanity-checker` | ctor ซับซ้อน / invariant ไม่ตั้งครบ |
| `encapsulation-reviewer` | รั่ว state ภายใน · API เปิดเกิน |
| `visibility-modifier-reviewer` | public/protected กว้างเกิน |
| `static-vs-instance-reviewer` | ควรอยู่ที่ class หรือ instance |
| `inheritance-vs-composition-advisor` | เลือกระหว่าง extends กับประกอบ |
| `overloading-overriding-reviewer` | overload/override สับสน |
| `equals-hashcode-reviewer` | equals/hash ในคอลเลกชันผิดพฤติกรรม |
| `immutability-opportunity-finder` | หาจุดทำ value / read-only |
| `object-lifecycle-reviewer` | สร้าง·เป็นเจ้าของ·ทิ้ง object |
| `naming-and-abstraction-reviewer` | ชื่อ/ abstraction ไม่ตรงโดเมน |

## Domains (`03_domains/`)

| โฟลเดอร์ | โฟกัส | ไฟล์หลัก |
|---------|--------|----------|
| `map-path/` | Path · L1–L3 · BaseChunk · Place snap | `README.md` → AskKeep §1 |
| `unit/` | ClassUnit / Player / Enemy / Ally | `README.md` → AskKeep §2 |
| `weapon-item/` | ClassBaseGun · inventory · craft | `README.md` → AskKeep §3 |
| `input/` | Unified Input (คน+บอท) เชื่อม block ⇄ weapon | `README.md` |
| `block/` | PlaceHold · BaseBlock · ประตู · occupancy | `README.md` |
| `turret/` | ป้อมจาก `weaponId` + infiniteAmmo บนบล็อก | `README.md` |
| `ai/` | Stage / Goal / Mediator · Navigation | `AI-Stage-Goals-and-Actions.txt` + `Record-Goal.md` + `Navigation.md` + `NextPlan/` (Phase 1 ในโค้ดแล้ว · 2a+ ยัง) |
| `world-gen/` | Gen object Map | `README.md` → AskKeep §5 |
| `ui/` | HUD / overlay | `README.md` → AskKeep §6 |
| `menu-net/` | Menu · hash join · net (เฟสถัดไป) | `README.md` → AskKeep §7 |
| `editor/` | หน้าวางแมปแบบ Warcraft Editor · เปิดที่ `editor.html` เกมยังไม่อ่านไฟล์ส่งออก | `README.md` |

## กฎสั้น

1. (AskKeep = hub) — สถานะ + ล็อก · ไม่ยัดสเปกยาวซ้ำ
2. (หนึ่งความจริงต่อหัวข้อ) — อย่าคัดลอก blueprint ทั้งก้อนลงทุกโดเมน
3. (AI NextPlan) อยู่แค่ `03_domains/ai/NextPlan/` — ไม่ใช่คิวทั้งเกม
4. ตัวเลขสเกล = (Set A) ใน AskKeep (Path 1024 · L3 64) — ไม่ใช้ 800/400/200/100
5. โค้ดสำคัญ: กฎใน Engine · Action จาก Provider · คนกับบอทช่องทางเดียว
6. ความยาวคำตอบตามปริมาณข้อมูล ไม่ย่อทุกครั้งหลังตรวจหน้าเว็บ งานจุดเดียวตอบสั้น ผลหลายจุดหรือหลายแผงเขียนให้ชัดว่าผ่านตรงไหน พังตรงไหน และเพราะอะไร เมื่อมีหลายข้อ ให้เขียนเป็นรายการตัวเลข markdown ในแชท
7. (Skills) — ดูตารางด้านบน · เปิดทีละไฟล์ · อย่าอ่านทั้งแพ็กพร้อมกัน

## @ โฟกัสตัวอย่าง

- รีแฟค AI stage → `@Doc/03_domains/ai`
- วางบล็อก / consume → `@Doc/03_domains/block` + `@Doc/03_domains/input`
- turret / registry → `@Doc/03_domains/turret` + `@Doc/03_domains/weapon-item`
- Boot / cache → `@Doc/02_shell`
- คุม token / เริ่มงาน → `@Doc/INDEX.md` แล้วเปิด `token-safe-work` ถ้าต้องการกฎเต็ม
- ทวนความเข้าใจก่อนโค้ด → `reply-understanding` ทีละไฟล์
- รีวิว OOP หัวข้อเดียว → skill ตามตาราง · หรือ `@Doc/99_log/oop-code-structure-PACK_INDEX.md` ก่อนเลือก
