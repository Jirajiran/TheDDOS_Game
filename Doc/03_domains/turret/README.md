# turret — ป้อมจาก weapon registry

สถานะ: turret/Base ใช้ `weaponId` เดียวกับอาวุธมือถือ + `infiniteAmmo` บนบล็อก (ล็อกใน AskKeep)

อ่านก่อน:
- AskKeep «ล็อกเกมเพลย์ที่โค้ดทำตามแล้ว» (WEAPON_REGISTRY)
- `Doc/03_domains/weapon-item/`
- วางเป็นบล็อก → `Doc/03_domains/block/` + `input/`

โฟกัสสั้น: อย่าแยก JSON อาวุธป้อมคนละชุดจาก registry กลาง

## รูปบนป้อม (ล็อก)

ฐานบล็อกเป็นสี่เหลี่ยมคงที่ ชั้นปืนหมุนตาม `turretAimRad` ใน `drawTurretGun` (`js/view/render.js`) ใช้ `getWeaponBtnImage` ของ `weaponId` ชุดเดียวกับปืนที่ผู้เล่นถือ ไม่ใช้ `Icon_*` ป้อม `TURRET_M1911` จึงได้รูปกลุ่ม `Weapon_Colt_1911` พูลรูปมาจากเอกสารอาวุธ ไม่ได้แรสเตอร์ตอนยิงหรือตอนวาดแต่ละเฟรม
