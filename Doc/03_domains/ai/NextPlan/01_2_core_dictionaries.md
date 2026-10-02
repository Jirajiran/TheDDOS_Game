# AI Stage Engine — Reference Dictionaries Catalog (Blueprint Part 1.2)

> **สำหรับ Cursor AI / Developer Reference**  
> หมวดหมู่อ้างอิง Enum, Data Structure, Goals, Stages และ Actions เพื่อใช้เป็น Dictionary กลางของระบบ AI

---

## 1. พจนานุกรมชนิดเป้าหมายและยูนิต (Enum & Target/UnitKind Dictionary)

ระบบใช้ Enum / Dictionary กลางเพื่อระบุชนิดเป้าหมาย ป้องกันไม่ให้ AI สับสนหรือเดาบทบาทเอง:

### 1.1 TargetKind / UnitKind Catalog
- `PLAYER`: ตัวละครผู้เล่น
- `ENEMY_UNIT`: ยูนิตฝ่ายตรงข้าม (จากมุมมองของระบบตัดสิน)
- `ALLY_UNIT`: ยูนิตฝ่ายเดียวกัน
- `BLOCK_BASE`: ฐานเป้าหมายหลัก (Defeat condition)
- `BLOCK_TURRET`: ป้อมปืนป้องกันภัย
- `BLOCK_OTHER`: บล็อกสิ่งก่อสร้างอื่นๆ / สิ่งกีดขวาง
- `POINT_SEEK`: พิกัดจุดบนแมพ (เช่น จุดฮีล Heal Pad, จุดกำบัง, จุดรวมพล)

### 1.2 Entity Snapshot Data Structure
โครงสร้างข้อมูลย่อยบน Entity ที่เปิดให้ Mediator และ Event อ่านตอนคำนวณ Factors:
```json
{
  "unitId": "string",
  "team": "number (0 = Player/Ally, 1 = Enemy)",
  "hp": "number",
  "maxHp": "number",
  "weaponId": "string",
  "armorType": "string (NONE / BULLET / EXPLOSION)",
  "role": "string / archetypeId",
  "x": "number",
  "y": "number",
  "radius": "number",
  "alive": "boolean"
}
```

---

## 2. พจนานุกรมความต้องการ (Goals Dictionary & Priority Engine)

Goal คือ "ความอยากได้" ของ AI ซึ่งมีค่า Weight / Priority int กำหนดอยู่ Mediator จะเลือก Goal ที่มีคะแนนสูงสุดด้วยสูตร:

$$	ext{Priority} = 	ext{baseWeight} + 	ext{eventBoost} + 	ext{factors}$$

### รายการ Goals ทั้งหมดในระบบ:
1. `DESTROY_BASE`: ทำลายฐานผู้เล่นเมื่อรับรู้ตำแหน่ง หรืออยู่ในโซนปลายทาง
2. `ELIMINATE_PLAYER`: กำจัดหรือกดดันผู้เล่นเมื่อถูกตรวจพบ (Spotted), เกิด Aggro หรือโดนยิง
3. `ELIMINATE_TARGET`: ทำลายเป้าหมายการต่อสู้ทั่วไปที่ Blackboard จองไว้ (ยูนิต หรือ บล็อกป้อมปืน)
4. `REACH_PATH_GOAL`: เดินทางไปยังจุดปลายโซ่ หรือ Pivot ปัจจุบันของ General Layer (เป้าหมายพื้นฐาน)
5. `SURVIVE_RETREAT`: ถอยออกจากพื้นที่เมื่อ HP ต่ำ หรือโดนแรงกดดัน/ความเสียหายสูง
6. `SEEK_HEAL_POINT`: ไปยังจุดพิกัดฮีลบน Blackboard (ไม่รับรู้ว่าใครเป็น Medic รู้แค่พิกัด `seekX/Y`)
7. `HOLD_SECTOR` / `REGROUP_ALLIES`: รวมกลุ่มกับยูนิตฝ่ายเดียวกัน หรือรอจังหวะบุกใน Lane

---

## 3. พจนานุกรมขั้นตอนการทำงาน (Stages Dictionary — Single Job Units)

Stage คือ "วิธีทำ" ซึ่งจะอ่านข้อมูลจาก Blackboard แล้วส่งคืน Action list โดยไม่เลือก Goal หรือสลับ Stage เอง:

### 3.1 `APPROACH_PATH`
- **หน้าที่:** เดินตาม Pivots หรือ `pathGoal` บน Blackboard
- **ข้อจำกัด:** ไม่วิเคราะห์การยิง, ไม่ถอย, ไม่หาจุดฮีล
- **ผลลัพธ์ Action:** `MOVE` (+ `AIM` ตามทิศการเดินเบาๆ)

### 3.2 `ENGAGE`
- **หน้าที่:** ต่อสู้กับ `combatTarget` ที่ถูกจองบน Blackboard, รักษาระยะห่างที่เหมาะสม
- **ข้อจำกัด:** ไม่สร้างเส้นทาง General ใหม่, ไม่เปลี่ยนเป้าหมายเอง
- **ผลลัพธ์ Action:** `AIM` + `FIRE` / `RELOAD`

### 3.3 `RETREAT`
- **หน้าที่:** เคลื่อนที่ถอยออกจากแหล่งความเสียหายหรือระยะคุกคาม
- **ข้อจำกัด:** ไม่เปลี่ยนเป็น ENGAGE เอง (Mediator เป็นผู้สลับกลับเมื่อเงื่อนไขถอยหมดไป)
- **ผลลัพธ์ Action:** `MOVE`

### 3.4 `REGROUP`
- **หน้าที่:** เดินเข้าหาจุดรวมกลุ่ม หรือ Centroid ของเพื่อนร่วมทีมในกลุ่ม
- **ข้อจำกัด:** ไม่วิ่งไล่ตามผู้เล่น
- **ผลลัพธ์ Action:** `MOVE`

### 3.5 `SEEK_POINT`
- **หน้าที่:** เดินทางไปยังพิกัด `seekX/Y` (จุดฮีล/จุดกำบัง/จุดรวมพล)
- **ข้อจำกัด:** ไม่รับรู้ชนิดของจุด เมื่อถึงเป้าหมายจะส่ง Event แจ้งกลับไปยัง Mediator
- **ผลลัพธ์ Action:** `MOVE`

---

## 4. พจนานุกรมการกระทำ (Actions Dictionary — Unified Input Pipeline)

AI ส่งคำสั่งผ่าน Pipeline เดียวกันกับ Player (`IDrive` / Unified Input) เพื่อรักษากฎความเท่าเทียมและระบบ Simulation ที่ deterministic:

- `MOVE(dx, dy)`: ความตั้งใจในการเคลื่อนที่ (ส่งให้ Physics Simulation รวมความเร็ว)
- `AIM(aimRad)`: การเล็งหรือหันหน้าไปตามมุมที่กำหนด
- `FIRE`: ส่งคำสั่งยิงหากอาวุธพร้อมและอยู่ในช่วงคูลดาวน์ที่ถูกต้อง
- `RELOAD`: เติมกระสุนเข้าแมกกาซีน
- `PLACE` / `INTERACT` / `HARVEST`: คำสั่งปฏิสัมพันธ์กับสิ่งก่อสร้าง ทรัพยากร หรือซ่อมแซม

> **ข้อห้ามเด็ดขาด:** ห้ามแก้ไข HP Direct, ห้ามวาร์ปตำแหน่ง, หรือข้าม Cooldown นอกระบบ `applyActions` ของ Simulation
