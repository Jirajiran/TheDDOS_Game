# turret — ป้อมจาก weapon registry

สถานะ: turret/Base ใช้ `weaponId` เดียวกับอาวุธมือถือ + `infiniteAmmo` บนบล็อก (ล็อกใน AskKeep)

อ่านก่อน:
- AskKeep «ล็อกเกมเพลย์ที่โค้ดทำตามแล้ว» (WEAPON_REGISTRY)
- `Doc/03_domains/weapon-item/`
- วางเป็นบล็อก → `Doc/03_domains/block/` + `input/`

โฟกัสสั้น: อย่าแยก JSON อาวุธป้อมคนละชุดจาก registry กลาง
