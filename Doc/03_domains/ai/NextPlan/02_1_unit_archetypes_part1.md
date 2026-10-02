# Unit Archetypes Catalog & JSON Specs (Blueprint Part 2.1)

> **สำหรับ Cursor AI / Developer Reference**  
> สถาปัตยกรรมเชื่อมโยง Unit Archetypes ผ่าน `unit_archetypes.json` และรายละเอียดของยูนิตลำดับที่ 1 - 5

---

## 1. ผังความสัมพันธ์ (The Bridge Architecture)

Stages Dictionary เป็นเพียง "คลังฟังก์ชันการทำงาน" (Code Execution Library) ที่ไม่จำเป็นต้องรู้จักประเภทของยูนิต ตัวที่ทำหน้าที่กำหนดว่ายูนิตแต่ละประเภทจะสามารถเรียกใช้ Goal/Stage ใดได้บ้าง และมีลำดับความสำคัญของเป้าหมายอย่างไร คือ `unit_archetypes.json`

```text
[ unit_archetypes.json ] ─── (กำหนด Weights, Allowed Goals, Target Priorities)
       │
       ▼
[ Event / Perception ]  ──── (ตรวจจับเป้าหมายตาม Target Priority List)
       │
       ▼
[ Mediator Decision ]   ───── (คำนวณ Priority เฉพาะ Goal ที่ยูนิตนั้นได้รับอนุญาต)
       │
       ▼
[ GoalToStage Mapping ] ─── (สลับไปยัง Stage ที่สอดคล้อง)
       │
       ▼
[ Stage Execution ]     ────── (อ่าน Blackboard แล้วส่ง Actions เข้า Unified Input)
```

- **ตัวอย่าง:** ถ้ายูนิตไม่มี Goal `SURVIVE_RETREAT` ใน JSON: ต่อให้ HP จะเหลือ 1% Mediator ก็จะไม่เลือก Goal นี้ ทำให้ไม่เกิดการสลับไปใช้ `RETREAT` Stage (ผลลัพธ์คือ สู้ตัวตาย)
- **ตัวอย่าง:** ถ้ายูนิตกำหนด `canRegroup: false` ใน JSON: Mediator จะข้าม Goal `REGROUP_ALLIES` ไปโดยอัตโนมัติ

---

## 2. สเปก JSON Schema และรายละเอียดพฤติกรรมยูนิต 1 - 5

### 2.1 โครงสร้าง JSON Config รวม (Units 1 - 5)
```json
{
  "unitArchetypes": {
    "GRUNT_BASIC": {
      "description": "1. หน่วยลูกกระจอก (SMG, AK47, Kar98, Shotgun) - มีวงจรการตัดสินใจครบถ้วน",
      "allowedGoals": ["DESTROY_BASE", "ELIMINATE_PLAYER", "SURVIVE_RETREAT", "SEEK_HEAL_POINT", "REGROUP_ALLIES"],
      "targetPriorityList": ["PLAYER", "BLOCK_TURRET", "BLOCK_BASE"],
      "behaviorFlags": {
        "retreatHpRatio": 0.25,
        "canRegroup": true,
        "preferredRange": "MEDIUM"
      }
    },
    "SUICIDE_BERSERKER": {
      "description": "2. หน่วยกล้าตาย - บุกปะทะอย่างเดียว ไม่ถอย ไม่ฮีล สู้จนตัวตาย",
      "allowedGoals": ["DESTROY_BASE", "ELIMINATE_PLAYER", "ELIMINATE_TARGET"],
      "targetPriorityList": ["PLAYER", "BLOCK_TURRET", "BLOCK_BASE"],
      "behaviorFlags": {
        "retreatHpRatio": 0.0,
        "canRegroup": false,
        "relentless": true,
        "preferredRange": "EXTREME_CLOSE"
      }
    },
    "STEALTH_SNIPER": {
      "description": "3.1 หน่วยลอบเร้น บุคคล - ซุ่มยิงเจาะจงเป้าหมาย Player จากระยะไกล",
      "allowedGoals": ["ELIMINATE_PLAYER", "SURVIVE_RETREAT"],
      "targetPriorityList": ["PLAYER"],
      "behaviorFlags": {
        "retreatHpRatio": 0.5,
        "fleeOnApproach": true,
        "preferredRange": "LONG_RANGE"
      }
    },
    "STEALTH_SHADOW_MELEE": {
      "description": "3.2 หน่วยลอบเร้นเงา - ดาบซามูไร/วิ่งเร็ว เน้นสังหาร Player ระยะประชิด ทำลายเฉพาะสิ่งกีดขวางที่ขวางทาง",
      "allowedGoals": ["ELIMINATE_PLAYER", "ELIMINATE_TARGET"],
      "targetPriorityList": ["PLAYER", "BLOCK_OTHER"],
      "behaviorFlags": {
        "canRegroup": false,
        "ignoreNonPathObstacles": true,
        "preferredRange": "MELEE"
      }
    },
    "STEALTH_ASSAULT_HEAVY": {
      "description": "3.3 หน่วยลอบเร้นโจมตี - เกราะหนักหมัดเหล็ก เน้นทำลายป้อมปืนระยะใกล้ > บล็อก > ยูนิต/Player",
      "allowedGoals": ["ELIMINATE_TARGET", "DESTROY_BASE"],
      "targetPriorityList": ["BLOCK_TURRET", "BLOCK_OTHER", "PLAYER", "ENEMY_UNIT"],
      "behaviorFlags": {
        "canRegroup": false,
        "preferredRange": "CLOSE"
      }
    },
    "STEALTH_DEMOLITION_SIEGE": {
      "description": "3.4 หน่วยลอบเร้นจอมทำลาย - ปืนใหญ่/จรวด/ครก เน้นทำลายป้อมปืนระยะไกล > บล็อก > ยูนิต/Player",
      "allowedGoals": ["ELIMINATE_TARGET", "DESTROY_BASE"],
      "targetPriorityList": ["BLOCK_TURRET", "BLOCK_OTHER", "PLAYER", "ENEMY_UNIT"],
      "behaviorFlags": {
        "canRegroup": false,
        "preferredRange": "LONG_RANGE"
      }
    },
    "SUPPORT_MEDIC": {
      "description": "4.1 หน่วยสนับสนุนแนวหลัง - คอยรักษาเพื่อนกลุ่มตัวเองที่ HP ต่ำสุด รักษาระยะห่างจากความขัดแย้ง",
      "allowedGoals": ["SEEK_HEAL_POINT", "REGROUP_ALLIES", "SURVIVE_RETREAT"],
      "targetPriorityList": ["ALLY_UNIT"],
      "behaviorFlags": {
        "targetSelectionRule": "LOWEST_HP_FRIENDLY_IN_GROUP",
        "stayInBackline": true,
        "allowCrossGroupHelp": false,
        "preferredRange": "LONG_SUPPORT"
      }
    },
    "COWARD_UNIT": {
      "description": "5. หน่วยขี้ขลาด - เน้นสู้ระยะไกล โดนยิงแล้วขวัญเสีย (Morale ลด) ถอย/แตกแถว รอตะลุมบุกใหม่เมื่อขวัญฟื้น",
      "allowedGoals": ["ELIMINATE_TARGET", "SURVIVE_RETREAT", "REGROUP_ALLIES"],
      "targetPriorityList": ["PLAYER", "ENEMY_UNIT"],
      "behaviorFlags": {
        "useMoraleSystem": true,
        "initialMorale": 100,
        "moraleDropOnHit": 40,
        "moraleRecoverRate": 15,
        "fleeMoraleThreshold": 30,
        "preferredRange": "MAX_WEAPON_RANGE"
      }
    }
  }
}
```

---

## 3. คำอธิบายรายละเอียดเชิงลึกของแต่ละประเภท (Units 1 - 5)

### 3.1 หน่วยลูกกระจอก (Grunt Basic)
- **พฤติกรรม:** ยูนิตมาตรฐานที่มีวงจรการตัดสินใจครบถ้วนทุก Stage (`APPROACH_PATH`, `ENGAGE`, `RETREAT`, `REGROUP`, `SEEK_POINT`)
- **กลไก:** เมื่อถูกยิงจะประเมิน %HP หากต่ำกว่า `retreatHpRatio` (25%) Mediator จะดันคะแนน `SURVIVE_RETREAT` เพื่อถอยไปหาจุดฮีล (`SEEK_HEAL_POINT`)

### 3.2 หน่วยกล้าตาย (Suicide Berserker)
- **พฤติกรรม:** สนใจเพียงการเคลื่อนที่เข้าหาเป้าหมายและโจมตีจนกว่าจะตาย
- **จุดต่างทาง Architecture:** ใน JSON ตัด `SURVIVE_RETREAT` และ `SEEK_HEAL_POINT` ออก ทำให้ Mediator ไม่คำนวณคะแนนการถอยหรือการฮีล ผลลัพธ์คือการไล่ล่าปะทะโดยไม่มีวันวิ่งหนี

### 3.3 กลุ่มหน่วยลอบเร้น (Stealth Archetypes)
เน้นการคัดกรองเป้าหมายเฉพาะเจาะจงผ่าน `targetPriorityList`:
1. **3.1 ลอบเร้นบุคคล (Sniper):** `targetPriorityList` มีเพียง `["PLAYER"]` เท่านั้น รักษาระยะยิงไกล ถ้าระยะห่างกับ Player ใกล้เกินไปจะเปิดเงื่อนไข `fleeOnApproach` เพื่อถอยฉาก
2. **3.2 ลอบเร้นเงา (Shadow Melee):** เน้นประชิดสังหาร Player ด้วยดาบ ปิดธง `canRegroup: false` เพื่อไม่ให้เข้า Stage `REGROUP` โจมตีบล็อกเฉพาะกรณีที่บล็อกนั้นขวาง Path การเดินเข้าหา Player เท่านั้น
3. **3.3 ลอบเร้นโจมตี (Heavy Assault):** ลำดับเป้าหมายจัดเป็น `BLOCK_TURRET` -> `BLOCK_OTHER` -> `PLAYER` เน้นเข้าทำลายป้อมและสิ่งก่อสร้างในระยะใกล้ก่อนยูนิต
4. **3.4 ลอบเร้นจอมทำลาย (Siege Demolition):** ใช้ลำดับเป้าหมายเดียวกับ 3.3 แต่กำหนด `preferredRange` เป็น `LONG_RANGE` เพื่อยิงถล่มป้อมและโครงสร้างจากนอกระยะยิงของป้อม

### 3.4 หน่วยสนับสนุนแนวหลัง (Support Medic)
- **พฤติกรรม:** สนใจเฉพาะเป้าหมายประเภท `ALLY_UNIT`
- **เงื่อนไขเฉพาะกลุ่ม (Group Scoped):** Mediator จะคัดเลือกเป้าหมายเฉพาะยูนิตที่มี `groupId` เดียวกัน และมีค่า %HP น้อยที่สุด (`targetSelectionRule: LOWEST_HP_FRIENDLY_IN_GROUP`) โดยไม่ข้ามไปช่วยกลุ่มอื่นเว้นแต่จะมีการรวมกลุ่มกัน
- **การวางตำแหน่ง (Backline Positioning):** คัดเลือกตำแหน่งยืนโดยคำนวณพิกัดยูนิตฝั่งเดียวกันที่อยู่ห่างจากเป้าหมายภัยคุกคาม (`BLOCK_TURRET`, `PLAYER`, `BLOCK_BASE`) มากที่สุด เพื่อป้องกันไม่ให้ Medic วิ่งเข้าไปในดงกระสุน

### 3.5 หน่วยขี้ขลาด (Coward Unit with Morale Engine)
- **กลไก Morale (ค่าความขวัญเสีย):**
  1. เมื่อถูกยิงโดน (Event `HIT_BY_BULLET`) ค่า Morale จะลดลงทันทีตาม `moraleDropOnHit` (เช่น -40)
  2. เมื่อ Morale ต่ำกว่า `fleeMoraleThreshold` (< 30) Mediator จะยก Priority ให้ Goal `SURVIVE_RETREAT` สูงสุดทันที และสั่งสละกลุ่ม (`UNGROUP`)
  3. ขณะอยู่ใน Stage `RETREAT` หากไม่มีภัยคุกคามรอบข้าง Morale จะค่อยๆ ฟื้นฟูขึ้นตาม `moraleRecoverRate` (+15/s)
  4. เมื่อ Morale ฟื้นกลับมาเต็ม Mediator จะลด Priority ของ `SURVIVE_RETREAT` ลง แล้วสั่งเข้า Stage `ENGAGE` หรือ `APPROACH_PATH` เพื่อกลับเข้าสู่การปะทะอีกครั้ง
