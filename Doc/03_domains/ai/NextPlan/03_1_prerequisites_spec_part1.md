# Core Systems Prerequisites Specification (Blueprint Part 3.1)

> **สำหรับ Cursor AI / Infrastructure Task Prompt**  
> รายการระบบและโครงสร้างพื้นฐาน (Core Systems Prerequisites) ที่ต้องพัฒนาเพิ่มใน Engine เพื่อรองรับ Active/Passive Skills และ Area Colliders/Triggers

---

## 1. ภาพรวมภารกิจ (Infrastructure Task Purpose)

พัฒนาระบบพื้นฐาน (Core Systems, Skill Framework, Colliders, Local AI) เพื่อรองรับยูนิตประเภทใหม่ (Commander, Engineer, Shield Vanguard, Skirmisher, Phase Boss) ให้สามารถทำงานผ่าน Unified Action Pipeline และ AI Stage Engine ได้อย่างสมบูรณ์

---

## 2. ระบบ Skill & Passive Component System

ยูนิตในอนาคตจำเป็นต้องมี Passive / Active Skills ติดตัวโดยไม่ต้องพึ่งพาระบบ Inventory เพียงอย่างเดียว

### 2.1 Active Skills Framework
- เพิ่ม `actionType: "CAST_SKILL"` เข้าสู่ Unified Input Pipeline Schema
- **Payload Schema:**
  ```json
  {
    "actionType": "CAST_SKILL",
    "payload": {
      "skillId": "string",
      "targetPosVec2": { "x": "number", "y": "number" },
      "targetEntityId": "string"
    }
  }
  ```

### 2.2 Active Skills Timeline Logic (ลำดับช่วงเวลา 4 เฟส)
Active Skill แต่ละสกิลจะมีวงจรเวลาชัดเจน ดังนี้:

```text
[ READY ] ──(กดใช้)──> [ CASTING ] ──(รำเสร็จ)──> [ ACTIVE EFFECT ] ──(หมดเวลา)──> [ COOLDOWN ] ──(ครบเวลา)──> [ READY ]
```

1. **READY:** สกิลพร้อมใช้งาน
2. **CASTING:** ร่ายสกิล (หากโดนขัดจังหวะ สกิลจะถูกยกเลิก)
3. **ACTIVE EFFECT:** ช่วงผลของสกิลทำงานค้างอยู่ เช่น วิ่งไว 3 วินาที (`activeTimer`)
4. **COOLDOWN:** หลังผล Active หมดลง เข้าสู่นับถอยหลัง เช่น 10 วินาที (`cooldownTimer`) เมื่อครบจะกลับสู่สถานะ `READY`

### 2.3 Passive Component Matrix (Static vs Conditional)
ระบบติดตัว Entity (เช่น Speed Modifier, Damage Reduction, Raycast Shield, Morale Resistance) คำนวณผ่าน Engine Loop:

- **Static Passive (ติดตัวถาวร):** บวกค่า Stat เข้าโครงสร้างยูนิตทันทีเมื่อเกิด เช่น
  $$	ext{moveSpeed} = 	ext{baseSpeed} 	imes 1.15$$
- **Conditional Passive (ติดตัวตามเงื่อนไข):** ตรวจสอบ State ของยูนิตทุกเฟรม เช่น วิ่งไวขึ้นเมื่อ HP < 50%:
  ```javascript
  // ตรวจสอบ Conditional Passive ใน Engine Loop
  if (unit.currentHp / unit.maxHp < 0.5) {
      unit.speedBuff = 1.3; // เพิ่ม Speed 30% เมื่อ HP ต่ำกว่า 50%
  } else {
      unit.speedBuff = 1.0; // ค่าปกติ
  }
  ```

---

## 3. ระบบ Area Collider & Trigger System (Aura, Heal Pad, Mine, Trap)

ใช้ประมวลผลเอฟเฟกต์เชิงพื้นที่ (AoE) ทั้งในระดับสิ่งก่อสร้างและออร่าติดตัวยูนิต โดยใช้วิธีสะสมเวลา (`accumulator += dt`) แบบเดียวกับระบบ Tick Damage ของ Laser Gun เพื่อประหยัด CPU

```text
               ┌──> [ ONE_SHOT (Landmine) ] ───────> AoE Damage ──> ทำดาเมจตัวเอง 100% (ระเบิดหายไป)
               │
[ Trigger Area Engine ] ├──> [ CONTINUOUS_TICK (Heal Pad) ] ──> ส่ง +HP ทุกๆ X วินาที (ไม่ทำดาเมจตัวเอง)
               │
               └──> [ DURABILITY_TRAP (กับดัก) ] ───> ส่ง Damage ใส่เป้าหมาย ──> ทำดาเมจตัวเอง Y%
```

### 3.1 อัตราการส่งค่า (Tick Interval)
- กำหนด `intervalSec` (เช่น 0.5s สำหรับ Heal Pad หรือกับดักไฟฟ้า)
- ถ้ายูนิตแช่อยู่ในรัศมี ตัวสะสมเวลา `accumulator += dt` จะทำงาน เมื่อ `accumulator >= intervalSec` จะส่ง Event ทำงาน 1 ครั้ง

### 3.2 อายุการใช้งาน (Durability & Self-Damage Pipeline)
- **ONE_SHOT (Landmine กับระเบิด):** เมื่อศัตรูเข้าใกล้ระยะ `PROXIMITY_ENTER` จะทำ AoE Damage ใส่ศัตรูรอบๆ พร้อมส่งดาเมจใส่ตัวเอง 100% ของ `maxHp` ทันที (ระเบิดแล้วหายไป)
- **CONTINUOUS_TICK (Heal Pad / Morale Aura):** ส่งผลฟื้นฟู HP หรือออร่าตามช่วงเวลา ไม่ทำดาเมจใส่ตัวเอง
- **DURABILITY_TRAP (กับดักหนีบ/กับดักหนาม):** ทำงานผ่านท่อประมวลผลเดียวกับ Landmine แต่ส่งดาเมจใส่ตัวเองเป็นเปอร์เซ็นต์ เช่น ครั้งละ 25% ของ `maxHp` เมื่อใช้งานครบ 4 ครั้ง HP ของกับดักจะเหลือ 0 แล้วพังไปเองโดยอัตโนมัติ
