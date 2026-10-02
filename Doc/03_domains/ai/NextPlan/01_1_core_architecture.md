# AI Stage Engine — Core Architecture & Principles (Blueprint Part 1.1)

> **สำหรับ Cursor AI / Developer Reference**  
> **สถานะโค้ดปัจจุบัน:** ฟังก์ชัน `decideEnemyActions` ใน `js/sim.js` ยังเป็นก้อน Monolithic ที่รวมการ Approach, Engage และ Retreat ไว้ในฟังก์ชันเดียว ต้องทำการ Refactor แยกสถาปัตยกรรมออกเป็น Layer ตามพิมพ์เขียวนี้

---

## 1. ภาพรวมสถาปัตยกรรมและสูตรหลัก (Core Architecture & Formula)

### 1.1 สูตรจำสั้น (The Core Formula)
การประมวลผลการตัดสินใจของ AI ทุกตัวในระบบจะวิ่งผ่าน Pipeline กลางแบบเป็นลำดับขั้นดังนี้:

```text
Input -> Event (+ Δpriority) -> Mediator (argmax Goal) -> GoalToStage -> Stage (Blackboard -> Action List) -> Unified Input
```

### 1.2 การแยก Layer (General vs Unit Stage)
ระบบแยกความรับผิดชอบการตัดสินใจออกเป็น 2 ชั้นอย่างเด็ดขาด เพื่อป้องกันไม่ให้ยูนิตแต่ละตัวต้องประมวลผลข้อมูลทั้งแผนที่เกินความจำเป็น:

1. **General Stage (ระดับกลุ่ม / แผนที่):**
   - รับผิดชอบการปูเส้นทางหลัก (Path / L1 pivots) 
   - ดูแล Sector ของแมพ คำนวณจุดยุทธศาสตร์ในภาพรวม
   - กระจายเป้าหมายหลักให้แต่ละกลุ่มยูนิต

2. **Unit Stage (ระดับตัวละคร):**
   - รับเป้าหมายจาก Blackboard มาดำเนินการเฉพาะหน้า เช่น เดิน เล็ง ยิง ถอย
   - **ข้อห้าม:** ห้ามค้นหาหรือคำนวณเส้นทางทั้งแผนที่ด้วยตัวเอง ให้ใช้ข้อมูลพิกัด/เป้าหมายที่จองไว้บน Blackboard เท่านั้น

---

## 2. กฎเหล็กสถาปัตยกรรม (Architectural Principles - MUST Rules)

ต้องปฏิบัติตามกฎ 7 ข้อนี้อย่างเคร่งครัด ห้ามละเว้นในทุกกรณี:

1. **Stages ห้ามรู้จักกัน (Single Job Only):**
   - Stage A ห้ามเรียก Stage B โดยตรงอย่างเด็ดขาด แต่ละ Stage ทำหน้าที่ประมวลผลงานเดียวเท่านั้น
2. **Mediator / Blackboard เป็นผู้สลับ Stage:**
   - การเปลี่ยนหรือสลับ Stage ทำผ่านการเปรียบเทียบ Priority Integer ของ Goal ใน Mediator เท่านั้น
3. **ผลลัพธ์การทำงานต้องเป็น Actions:**
   - แต่ละ Stage รับข้อมูลจาก Blackboard ทำงานเดี่ยว (Single job) แล้วส่งคืนคำสั่งในรูปแบบ Action list ออกมาเท่านั้น
4. **แยกแยะ Goal และ Stage:**
   - **Goal:** คือ "สิ่งที่อยากได้" (+ Priority int) ประมวลผลที่ Mediator
   - **Stage:** คือ "วิธีทำ ณ ปัจจุบัน" ประมวลผลที่ Stage execution
5. **แยกแยะ Event และ Stage:**
   - **Event:** คือคำอธิบาย Input / สถานะที่เกิดขึ้นในเฟรม ซึ่งจะเขียนเพิ่ม `Δpriority`, Target, หรือ Flags ลงใน Blackboard
   - Event ไม่ใช่ตัวสลับ Stage โดยตรง
6. **การทำงานเป็น Deterministic 100%:**
   - ผลลัพธ์การตัดสินใจต้องเกิดจาก State แบบ 100% (Given same state + inputs = same actions)
   - สุ่มได้เฉพาะ Noise เบาๆ ทางกายภาพเท่านั้น เช่น ทิศทางการสแตรฟหลบกระสุน (`Strafe sign` +1 / -1)
7. **ไม่ hardcode เรื่องราวใน Stage:**
   - ระบบรับรู้ตำแหน่งจุดเติมพลังงาน จุดกำบัง หรือป้อมปืน เป็นเพียงพิกัด / ID บน Blackboard
   - ไม่ถือบทบาท archetype หรือชื่อเรื่องราวใดๆ ไว้ใน Stage code

---

## 3. แผนผังกระบวนการทำงาน (System Architecture Flow)

```text
[ Perception Pipeline ]
  └── ตรวจพบ Entity -> แปลงเป็น TargetKind + ID
       │
       ▼
[ Event Processing ]
  └── รับข้อมูล Input ในเฟรม -> คำนวณ Δpriority -> อัปเดตข้อมูลลง Blackboard
       │
       ▼
[ Mediator Decision ]
  └── คำนวณ Priority = baseWeight + eventBoost + factors -> เลือก argmax Goal
       │
       ▼
[ GoalToStage Mapping ]
  └── แปลง Active Goal ที่ได้คะแนนสูงสุด -> Active Stage
       │
       ▼
[ Active Stage Execution ]
  └── อ่านข้อมูลจาก Blackboard -> ประมวลผลสร้าง Action List
       │
       ▼
[ Unified Input Pipeline ]
  └── ส่ง Actions { tick, unitId, actionType, payload } เข้าสู่ Physics Simulation Engine
```

---

## 4. ข้อควรระวังและการเปรียบเทียบสิ่งที่มักเข้าใจผิด (Clarification Matrix)

| สิ่งที่มักเข้าใจผิด | ความจริงในสถาปัตยกรรม (Architectural Truth) |
| :--- | :--- |
| **Priority ของ Stage** | **ไม่มี** — Priority อยู่ที่ Goal เท่านั้น Stage แค่ทำงานตามที่โดนเรียก |
| **การเลือก Stage = การจอง Target** | **ไม่ใช่** — Blackboard เป็นผู้จอง Target, Mediator เป็นผู้เลือก Stage |
| **Enum UnitKind คือ Goal** | **ไม่ใช่** — Enum เป็นเพียงพจนานุกรมชนิดข้อมูล ไม่ใช่ความต้องการ |
| **Event เป็นตัวสั่งวาร์ป/เรียก Stage** | **ไม่ใช่** — Event เป็นเพียงคำอธิบาย Input เพื่อเขียน `Δpriority` ลง Blackboard |
| **บอทวิ่งหาหมอเพราะรู้ว่าเป็น Medic** | **ไม่ใช่** — Mediator ตั้งค่า `SEEK_HEAL_POINT` บน Blackboard บอทรู้แค่พิกัด `seekX/Y` |

---

## 5. แนวทางการจัดโครงสร้างโค้ดและการรีแฟกเตอร์ (Refactoring Roadmap)

### 5.1 โครงสร้างไฟล์ที่แนะนำ
```text
js/ai/
├── mediator.js           # ควบคุม Priority Engine และสลับ Stage ตาม argmax Goal
├── blackboard.js         # เก็บ State / Reserved Targets / Flags ของยูนิต
├── local_group_manager.js# ระบบจัดการกลุ่มย่อย Local General
└── stages/               # แยกไฟล์ Stage ย่อยเฉพาะงาน
    ├── approach.js       # APPROACH_PATH
    ├── engage.js         # ENGAGE
    ├── retreat.js        # RETREAT
    ├── regroup.js        # REGROUP
    └── seek_point.js     # SEEK_POINT
```

### 5.2 Data-Driven Configuration
- ย้ายค่า `baseWeight`, `eventBoost`, ตาราง `GoalToStage`, และพฤติกรรมยูนิต ไปไว้ที่ Config กลาง (`game_pack.json` / `unit_archetypes.json`)

### 5.3 Deterministic Testing Protocol
- ทดสอบระบบด้วยชุด Input/Event เดียวกัน และ Seed เดียวกัน ผลลัพธ์ Action Output ต้องได้เหมือนกัน 100% ทุกครั้ง
