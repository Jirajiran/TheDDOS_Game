# Extended Unit Archetypes & System Rules (Blueprint Part 2.2)

> **สำหรับ Cursor AI / Developer Reference**  
> รายละเอียดและสเปก JSON ของยูนิตระดับสูง (ลำดับที่ 6 - 10) พร้อมกฎการทำงานเชื่อมโยงระบบ Engine

---

## 1. รายละเอียดและสเปก JSON ของยูนิตระดับสูง (Units 6 - 10)

### 1.1 JSON Config ของยูนิต 6 - 10
```json
{
  "unitArchetypes": {
    "COMMANDER_LEADER": {
      "description": "6. หน่วยผู้บัญชาการ - Local General ปล่อยออร่าเพิ่ม Morale คุมทิศทางกลุ่ม เป็น Centroid รวมพล",
      "isLocalGeneral": true,
      "moraleAuraRadius": 300,
      "allowedGoals": ["HOLD_SECTOR", "REGROUP_ALLIES", "ELIMINATE_PLAYER"],
      "targetPriorityList": ["PLAYER", "BLOCK_TURRET"],
      "behaviorFlags": {
        "isGroupLeader": true,
        "preferredRange": "MEDIUM"
      }
    },
    "COMBAT_ENGINEER": {
      "description": "7. หน่วยช่างเทคนิค - ซ่อมแซมป้อม/สิ่งก่อสร้าง วางป้อมปืน/กับดักในทางแคบ",
      "hasPlacementSkill": true,
      "placeableBlockTypes": ["BLOCK_TURRET", "BLOCK_TRAP_MINE"],
      "allowedGoals": ["REPAIR_STRUCTURE", "PLACE_TRAP", "ELIMINATE_TARGET"],
      "targetPriorityList": ["BLOCK_TURRET", "BLOCK_OTHER"],
      "behaviorFlags": {
        "interactTargetType": "FRIENDLY_BUILDINGS_FIRST",
        "preferredRange": "CLOSE"
      }
    },
    "SHIELD_VANGUARD": {
      "description": "8. หน่วยโล่ป้องกัน - ถือโล่รับกระสุน Raycast/Projectile ใช้สกิล Roar ดึง Aggro",
      "hasPassiveShield": true,
      "shieldColliderRadius": 60,
      "activeSkills": ["TAUNT_ROAR"],
      "allowedGoals": ["PROTECT_ALLY", "ENGAGE", "HOLD_SECTOR"],
      "targetPriorityList": ["PLAYER", "ENEMY_UNIT"],
      "behaviorFlags": {
        "armorType": "BULLET",
        "bodyguardMode": true,
        "retreatHpRatio": 0.05,
        "preferredRange": "EXTREME_CLOSE"
      }
    },
    "FLANK_SKIRMISHER": {
      "description": "9. หน่วยโฉบฉวย - ยิง Burst แล้วถอยสลับตำแหน่งโอบล้อม (Flank Pathing)",
      "useLocalFlankPathing": true,
      "burstDurationSec": 2.0,
      "allowedGoals": ["ELIMINATE_PLAYER", "FLANK_POSITION", "SURVIVE_RETREAT"],
      "targetPriorityList": ["PLAYER"],
      "behaviorFlags": {
        "relocateAfterBurst": true,
        "preferredRange": "MEDIUM_CLOSE"
      }
    },
    "DYNAMIC_PHASE_BOSS": {
      "description": "10. มินิบอสสลับเฟส - สลับอาวุธ/สกิล/Stage ตาม %HP แบบ Live-time",
      "isDynamicDriver": true,
      "phases": [
        {
          "hpRatio": 0.5,
          "weaponId": "LAZER",
          "activeSkills": ["SPEED_BOOST"],
          "allowedGoals": ["ELIMINATE_PLAYER", "HOLD_SECTOR"],
          "behaviorFlags": {
            "preferredRange": "LONG_RANGE"
          }
        },
        {
          "hpRatio": 0.0,
          "weaponId": "MELEE_SAW",
          "activeSkills": ["MELEE_DASH"],
          "allowedGoals": ["SUICIDE_ATTACK", "ELIMINATE_TARGET"],
          "behaviorFlags": {
            "preferredRange": "EXTREME_CLOSE",
            "relentless": true
          }
        }
      ]
    }
  }
}
```

---

## 2. คำอธิบายรายละเอียดและกลไกของยูนิต 6 - 10

### 2.1 หน่วยผู้บัญชาการ (Commander Leader / Local General)
- **แนวคิด:** เป็นศูนย์กลางของกลุ่ม (Group Leader) ที่คอยดึงยูนิตขี้ขลาด (Coward Unit) หรือลูกกระจอกกลับเข้ารวมแถว
- **การทำงาน:**
  - ทำหน้าที่เป็น Local General ประมวลผลคำสั่งกลุ่มเฉพาะยูนิตใน `groupId` ตัวเอง
  - ปล่อยออร่าในรัศมี `moraleAuraRadius` (300px) ลดการสูญเสีย Morale ของลูกน้องลง 50%
  - ทำหน้าที่เป็นพิกัด Centroid ใน Stage `REGROUP` ของลูกน้อง
  - **บทลงโทษ:** หาก Commander ตาย ยูนิตขี้ขลาดในกลุ่มจะเสียค่า Morale ทันที 50% และแตกแถวทันที

### 2.2 หน่วยช่างเทคนิค / วางกับดัก (Combat Engineer / Sapper)
- **แนวคิด:** ไม่เน้นเข้าปะทะตรงๆ แต่เน้นซ่อมแซมป้อม/กำแพงฝั่งเดียวกัน และวางป้อมปืน/กับดักระเบิด
- **การทำงาน:**
  - ค้นหา `BLOCK_TURRET` หรือ `BLOCK_OTHER` ฝั่งตนเองที่เสียหายเพื่อเข้าไปซ่อมแซม
  - หากพบทางแคบ (Chokepoint) จะสลับไปใช้ Stage `PLACE_BLOCK` เพื่อวาง `BLOCK_TURRET` หรือ `BLOCK_TRAP_MINE`
  - เมื่อป้อมปืนของตนเองพัง จะกลับมาเป็นยูนิตต่อสู้ธรรมดา

### 2.3 หน่วยโล่ป้องกันแนวหน้า (Shield Vanguard / Tank)
- **แนวคิด:** ยูนิตเกราะหนัก มีโล่กั้นกระสุน คอยเดินนำหน้ายูนิตแนวหลัง (Medic/Sniper) เพื่อรับความเสียหายแทน
- **การทำงาน:**
  - มี `ShieldCollider` ยื่นออกมาด้านหน้าเพื่อสกัด Raycast / Projectile ก่อนถึงยูนิต
  - มีสกิล `TAUNT_ROAR` สร้าง Pulse Collider ส่ง Event `TAUNT_TRIGGERED` ดึง Aggro ของยูนิตและป้อมปืนศัตรูรอบข้างให้หันมารุมโจมตีตนเอง
  - ไม่ถอยหนี้แม้ HP ต่ำ (`retreatHpRatio: 0.05`)

### 2.4 หน่วยโฉบฉวยยิงแล้วถอย (Hit-and-Run Skirmisher)
- **แนวคิด:** ยิงชุดสั้น (Burst Fire) แล้วถอยออกไปตั้งหลักในมุมอับ (Flank) ก่อนวนกลับมายิงใหม่
- **การทำงาน:**
  - เมื่อเข้า Stage `ENGAGE` ยิงครบ `burstDurationSec` (2 วินาที) จะส่ง Event `BURST_COMPLETE` ลง Blackboard
  - Mediator จะปรับ Priority ของ `FLANK_POSITION` ให้สูงขึ้นชั่วคราว เพื่อสั่งให้ยูนิตวิ่งฉากออกข้างโดยใช้เส้นทาง Local Flank Pathing

### 2.5 มินิบอสสลับเฟส (Dynamic Phase Boss)
- **แนวคิด:** เป็นตัวอย่างของ Dynamic Driver Unit ที่สลับพฤติกรรม สกิล และ Stage ตามระดับ %HP
- **เฟส 1 (HP > 50%):** ยิงปืนยิงไกล (`LAZER`), กดใช้สกิลเพิ่มความเร็ว (`SPEED_BOOST`), รักษาระยะ `LONG_RANGE`
- **เฟส 2 (HP <= 50%):** สลับอาวุธเป็นเลื่อยไฟฟ้าประชิด (`MELEE_SAW`), เข้าโหมด Enrage พุ่งชนด้วยสกิล `MELEE_DASH`, ปรับเป็น `SUICIDE_ATTACK` ไม่ถอยหนี

---

## 3. การนำไปใช้ร่วมกับระบบคำนวณและ Drive ทั้ง 3 รูปแบบ

### 3.1 การป้องกันไม่ให้ยูนิตเข้ารุมป้อมจุดเดียว (Prevent Dogpiling)
ยูนิตสายทำลาย (`STEALTH_ASSAULT_HEAVY`, `COMBAT_ENGINEER`) ใช้สูตรคำนวณน้ำหนักการสแกนเป้าหมาย:

$$	ext{Score} = 	ext{distanceToTurret} + (	ext{currentAttackersCount} 	imes K) - 	ext{turretPriorityScore}$$

ทำให้เมื่อมีเพื่อนรุมป้อมใดป้อมหนึ่งอยู่ ค่า `currentAttackersCount` จะดันคะแนนสูงขึ้น ยูนิตตัวอื่นจะเปลี่ยนเป้าหมายไปทำลายป้อมข้างเคียงแทนโดยอัตโนมัติ

### 3.2 การสลับ Stage ตามการสลับอาวุธ (Live-time Weapon Override - Drive แบบที่ 2)
หากยูนิตลูกกระจอก (`GRUNT_BASIC`) เก็บปืน Sniper บนพื้นขึ้นมาถือ ตัวปืนจะส่ง Enum Data ประจำปืนไป Override ค่า `currentStage` และ `preferredRange` ให้กลายเป็น `LONG_RANGE` ทันที โดยไม่ต้องเขียนโค้ดเปลี่ยน Class ใหม่

### 3.3 โครงสร้างคำสั่งสเปกเดียวผ่าน Unified Input Pipeline
ไม่ว่าจะเป็นยูนิตประเภทใด Actions ที่ส่งออกมาจาก Stage จะถูกแปลงเป็น Schema เดียวกันเสมอ:
```json
{
  "tick": 1042,
  "unitId": "unit_sec_09",
  "actionType": "MOVE",
  "payload": {
    "dx": 0.707,
    "dy": -0.707
  }
}
```
ทำให้ระบบ Simulation Engine ประมวลผลได้อย่างมีระเบียบ และรองรับการทำ Memento Snapshot / Rollback ได้ 100%
