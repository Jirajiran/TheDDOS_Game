# weapon-item — ClassBaseGun + inventory items

สถานะ: WEAPON_REGISTRY เดียว · craft/hotbar มีใน V1 · ดู AskKeep §3

อ่านก่อน:
- `Doc/00_hub/AskKeep.txt` §3 ClassBaseGun
- ยิง/วางของผ่าน pipeline → `Doc/03_domains/input/`
- ป้อมใช้ weaponId เดียวกัน → `Doc/03_domains/turret/`

## รูปปืน (ล็อก)

กลุ่ม `Weapon_*`, `Icon_*`, `Action_*`, `Core_*`, `Bullet_Rpg` อยู่ใน `Asset/AssetSVG/Unit/Unit_Template.svg` ชื่อใน `WEAPON_BTN_ART` (`js/view/cosmetics.js`) ชี้ไอดีนั้น เกมเพลย์ยังใช้ id อย่าง `M1991` ไม่ใช้ชื่อกราฟิก

`preloadEquipArtCache` คืนพรอมิสของ `preloadWeaponBtnArt` แรสเตอร์ครั้งเดียวลงแมป เรียกซ้ำได้พรอมิสเดิม ช่วง `equip_art_cache` ใน `js/session/boot.js` และ `js/session/loading.js` บังคับรอ สูงสุด 60 วินาที หน้าโหลดค้างจนพูลครบก่อนเข้าเล่น ตอนวาดอ่านแมป ไม่แรสเตอร์ใหม่ทุกเฟรม

ปืนในมือและป้อมใช้ภาพ `Weapon_*` ผ่าน `getWeaponBtnImage` ไอคอนฮอตบาร์ยังเป็น `Icon_*` ผ่าน `getWeaponIconHref`
