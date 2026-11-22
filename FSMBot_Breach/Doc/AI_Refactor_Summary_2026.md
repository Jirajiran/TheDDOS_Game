# AI Architecture & Refactor Summary (2026)

เอกสารสรุปการปรับปรุงและจัดระเบียบสถาปัตยกรรมระบบ AI ของบอทตาม Blueprint (`AI-Stage-Goals-and-Actions.txt`) และหลักการ Event → Blackboard → Mediator → Stage → Unified Input

---

## 1. สรุปรายการไฟล์ที่มีการแก้ไข (Refactored Files)

### A. `FSMBot_Breach/js/ai/blackboard.js` (Three-Axis Blackboard Data Contract)
- **วัตถุประสงค์:** จัดระเบียบตัวแปรบน Blackboard ของยูนิตให้สะอาด เป็นระเบียบ และแบ่งแยกหน้าที่ชัดเจนตาม 3 แกนหลัก เพื่อให้อ่านและ Debug ง่าย พร้อมรักษากลไก Backward Compatibility สำหรับโค้ดเดิมทั้งหมด
- **การเปลี่ยนแปลง:**
  - **แกนที่ 1 (Decision & Priority Axis):** จัดเก็บสถานะ `activeGoal`, `activeStage`, `priorityScratch`, `eventBoost`, `priority`, `combatTargetKind`, `combatTargetId`, `combatLockTimer`, `aggroChase`
  - **แกนที่ 2 (Navigation & Spatial Axis):** จัดเก็บสถานะพิกัดเดิน `pathGoalX/Y`, `pathGoalRadius`, `pathPivots`, `pivotIndex`, `groupId`, `sectorStart/End`, รวมถึงตัวแปรช่วยคำนวณ Local Steering (`strafeSign`, `virtualWaypoint`, `stuckTimer`)
  - **แกนที่ 3 (Survival & Tactical Axis):** จัดเก็บสถานะ HP (`hpRatio`, `retreatHpRatio`, `recoverHpRatio`, `isRetreatLatched`), พิกัดแหล่งอันตราย (`threatSourceX/Y`), และจุดยุทธวิธี (`seekX/Y`, `seekKind`, `allyCentroidX/Y`)
  - อัปเดตฟังก์ชัน `createBlackboard()` และ `ensureBlackboard()` ให้สร้างและตรวจสอบโครงสร้าง 3 แกนอัตโนมัติทุกยูนิต

---

### B. `FSMBot_Breach/js/ai/mediator.js` (Anti-Pattern Prevention & Robust Goal Scoring)
- **วัตถุประสงค์:** ป้องกันช่องโหว่ทางตรรกะ (Anti-Patterns) ที่เคยถูกเตือนไว้ใน Blueprint เช่น การจองเป้าแต่คะแนนไม่ขึ้น หรือการยกคะแนนต่อสู้โดยไม่มีเป้าหมาย
- **การเปลี่ยนแปลง:**
  - **Target-Lock Baseline Guarantee Factor:** เพิ่มสูตรคำนวณ factors ใน `factorScores()` เมื่อยูนิตมีการจองเป้าหมาย (`hasReservedTarget`) ระบบจะบวกคะแนนพื้นฐาน (`+220`) ให้กับ Goal `ELIMINATE_PLAYER` หรือ `ELIMINATE_TARGET` เสมอ ทำให้คะแนนสูงกว่า `REACH_PATH_GOAL` (100) อย่างแน่นอน ตัดปัญหาอาการบอทยืนติด A→B ทั้งที่มีเป้าหมายอยู่ตรงหน้า
  - **Pre-Score Target Validation:** เพิ่มการตรวจสอบความถูกต้องของเป้าหมายที่จองไว้ที่ต้นฟังก์ชัน `decideUnitViaMediator()` หากเป้าหมายตาย (`hp <= 0` หรือ `dead`) ระบบจะล้างค่า `combatTargetId = -1` และ `combatTargetKind = null` อัตโนมัติ ป้องกันปัญหา ENGAGE ว่างเป้า (Ghost Engagement)
  - **Single-Tick Event Queue Drain:** เพิ่มการล้างคิว Event (`bb.events.length = 0`) ทุกต้นเฟรมใน Mediator tick เพื่อป้องกันปัญหา Event ตกค้างหรือเกิดลูปคำนวณซ้ำซ้อนข้ามเฟรม

---

## 2. การตรวจสอบความถูกต้อง (Verification)
- ทุกไฟล์ผ่านการทดสอบคอมไพล์ผ่าน `compile_applet` และตรวจไวยากรณ์ TypeScript ผ่าน `lint_applet` สำเร็จด้วยสถานะ **0 Errors / 0 Type Issues**
