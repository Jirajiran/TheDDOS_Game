# Core Systems Prerequisites Specification (Blueprint Part 3.2)

> **สำหรับ Cursor AI / Infrastructure Task Prompt**  
> รายการระบบ Local Group AI, Raycast Shield, Taunt Engine, และ AI Construction/Repair Pipeline

---

## 1. ระบบ Local Group General Manager (ระบบผู้บัญชาการระดับกลุ่ม)

ลดภาระการคำนวณของ GameManager กลาง โดยสร้างตัวประมวลผลระดับกลุ่มเล็ก (`js/ai/local_group_manager.js`)

### 1.1 มุมมองการตรวจจับ (Raycast Fan)
- ยูนิตในกลุ่มใช้ Raycast กระจายหน้า 45 องศา (1 -> 3 -> 5 เส้น) ในการมองเห็นภัยคุกคาม
- มี Pi-radius วงเล็กกันศัตรูหลุดเข้ามาประชิดด้านหลัง

### 1.2 งบการเลี้ยวและอุปสรรค (Steering Budget)
- กลุ่มมีเพดานคิดจุดเลี้ยวหลบสิ่งกีดขวาง (`Steering Budget` ประมาณ 10 จุด)
- หากงบเลี้ยวหมดและติดทาง จะสั่งให้ยูนิตเปลี่ยนเป้าหมายเข้าสู้กับสิ่งกีดขวางที่ขวางทางทันที

### 1.3 การตัดขาดเป็นอิสระ (Detach & Local Pathing)
- หากกลุ่มแยกตัวออกจาก General หลัก หรือไม่สามารถไปตามทางหลักได้ Local General จะสร้างเส้นทางโอบล้อม (Flank Coordinates) หรือหลบหลีกเฉพาะกลุ่มขึ้นมาเอง
- เมื่อถึงจุดหมายแล้วจะสลายตัวกลับไปรับคำสั่งจาก General หลักตามเดิม

### 1.4 Morale & Anti-Retreat Lock
- ยูนิตภายใต้ออร่า Commander จะถูกล็อก `moraleLossRate` ให้ลดลง 50%
- ติดเงื่อนไข `lockRetreat: true` ไม่ให้ถอยหนีได้ง่าย

---

## 2. ระบบ Raycast Interception Shield & Taunt Engine

รองรับยูนิตแท็งก์ถือโล่/สะพายโล่ และการใช้สกิลดึง Aggro

```text
[ กระสุน / Raycast ] ──────> [ Shield Collider (ยื่นออกมาบัง) ] ──(หักล้าง/ลด ดาเมจ)──> [ Unit Main Collider ]
```

### 2.1 CCD Raycast Shield Collider
- ใน `WeaponSystem.js` เพิ่มการตรวจจับ Raycast / Projectile กับ `ShieldCollider` พิเศษที่ยื่นออกมาด้านหน้ายูนิต ก่อนที่จะถึง Main Unit Collider
- หากกระสุนชนถูก `ShieldCollider` ให้หักล้าง Damage ออกจาก ShieldHP หรือลดความเสียหายลงตามประเภทเกราะ (`armorType`) โดยไม่ทะลุไปโดน Unit HP

### 2.2 Aggro / Threat Taunt Engine (Roar Skill)
- เมื่อยูนิตใช้สกิล `TAUNT_ROAR` จะสร้าง Pulse Collider กระจายออกไป
- ยูนิตศัตรูและป้อมปืน (`BLOCK_TURRET`) ในระยะที่ติด Event `TAUNT_TRIGGERED` จะถูกบังคับเขียนค่า `priorityScratch[ELIMINATE_TARGET]` บน Blackboard ให้เปลี่ยนเป้าหมายล็อกมาที่ยูนิต Shield Vanguard ทันที

---

## 3. ระบบ AI Construction & Repair Action Pipeline (ประแจซ่อมแซม & ขวานทำลาย)

ต่อยอดระบบ Melee เดิมที่มีอยู่แล้วใน Engine ให้ AI สามารถเข้าซ่อมแซมสิ่งก่อสร้าง หรือวางป้อม/กับดักได้ผ่าน Pipeline

### 3.1 ท่อประมวลผล Melee กลาง (Unified Melee Pipeline Matrix)
ใช้ระยะโจมตีประชิดและเปิด/ปิด Collider เดียวกันกับการชก/ฟัน แต่แยกผลลัพธ์ตามประเภทเครื่องมือ (Melee Tool):

| ชนิดเครื่องมือ | Target เป็น สิ่งก่อสร้างฝ่ายเดียวกัน (`BLOCK` / `TURRET`) | Target เป็น สิ่งก่อสร้างฝ่ายตรงข้าม | Target เป็น ยูนิตสิ่งมีชีวิต (`UNIT`) |
| :--- | :--- | :--- | :--- |
| **ขวาน (Axe)** | ไม่ทำงาน | ทำดาเมจแรงพิเศษ (Structure Breaker) | ทำดาเมจประชิดปกติ |
| **ประแจ (Wrench)** | ซ่อมแซม (+HP สิ่งก่อสร้าง) | ไม่ทำงาน | ไม่เกิดผล / ไม่ทำดาเมจ |

> **ข้อกำหนด:** ประแจซ่อมแซมเฉพาะสิ่งก่อสร้าง/ป้อมปืน (`BLOCK_TURRET`, `BLOCK_BASE`, `BLOCK_OTHER`) ฝ่ายเดียวกันเท่านั้น **ไม่รักษา/ไม่เพิ่ม HP ให้ยูนิตสิ่งมีชีวิต**

### 3.2 AI Repair Action Payload
```json
{
  "actionType": "INTERACT_OBJECT",
  "payload": {
    "interactType": "REPAIR",
    "targetEntityId": "turret_01"
  }
}
```
เมื่อ AI ถือ Wrench และอยู่ในระยะประชิดกับป้อมปืนฝั่งเดียวกันที่เสียหาย จะสั่ง `TriggerWeapon` เพื่อฟื้นฟู HP ให้สิ่งก่อสร้างจนเต็ม

### 3.3 AI Structure Placement
ปรับ Stage `PLACE_BLOCK` ให้ AI สามารถสั่งวาง `BLOCK_TURRET` หรือ `BLOCK_TRAP_MINE` ลงบนพิกัด L3 Grid ที่ว่างอยู่ได้

---

## 4. โครงสร้าง JSON Schema อัปเดตสำหรับ Cursor AI

นำไปใช้อ้างอิงใน `unit_archetypes.json`:

```json
{
  "COMMANDER_LEADER": {
    "isLocalGeneral": true,
    "moraleAuraRadius": 300,
    "allowedGoals": ["HOLD_SECTOR", "REGROUP_ALLIES", "ELIMINATE_PLAYER"],
    "targetPriorityList": ["PLAYER", "BLOCK_TURRET"]
  },
  "COMBAT_ENGINEER": {
    "hasPlacementSkill": true,
    "placeableBlockTypes": ["BLOCK_TURRET", "BLOCK_TRAP_MINE"],
    "allowedGoals": ["REPAIR_STRUCTURE", "PLACE_TRAP", "ELIMINATE_TARGET"],
    "targetPriorityList": ["BLOCK_TURRET", "BLOCK_OTHER"]
  },
  "SHIELD_VANGUARD": {
    "hasPassiveShield": true,
    "shieldColliderRadius": 60,
    "activeSkills": ["TAUNT_ROAR"],
    "allowedGoals": ["PROTECT_ALLY", "ENGAGE"],
    "targetPriorityList": ["PLAYER", "ENEMY_UNIT"]
  },
  "FLANK_SKIRMISHER": {
    "useLocalFlankPathing": true,
    "burstDurationSec": 2.0,
    "allowedGoals": ["ELIMINATE_PLAYER", "FLANK_POSITION", "SURVIVE_RETREAT"],
    "targetPriorityList": ["PLAYER"]
  },
  "DYNAMIC_PHASE_BOSS": {
    "isDynamicDriver": true,
    "phases": [
      {
        "hpRatio": 0.5,
        "activeSkills": ["SPEED_BOOST"],
        "allowedGoals": ["ELIMINATE_PLAYER"]
      },
      {
        "hpRatio": 0.0,
        "activeSkills": ["MELEE_DASH"],
        "allowedGoals": ["SUICIDE_ATTACK"]
      }
    ]
  }
}
```
