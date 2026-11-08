# สถาปัตยกรรมระบบอินเทอร์เฟซและข้อกำหนด GDD (UI & HUD Architecture Specification)

เอกสารฉบับนี้เป็นข้อกำหนดสถาปัตยกรรมระดับระบบ (System Architecture Specification) สำหรับโครงสร้างภาพอินเทอร์เฟซ (SVG Structure), เลย์เอาต์แบบ Anchor, และสเตทการทำงานของหน้าจอเมนูหลัก (Main Menu) และหน้าจอขณะเล่น (Gameplay HUD) ของระบบเกมเว็บ โดยผ่านการเรียบเรียงและขัดเกลาข้อมูล (Data Cleaning) เพื่อให้เหลือเฉพาะข้อกำหนดทางเทคนิคที่จำเป็นสำหรับการประมวลผลของปัญญาประดิษฐ์และนักพัฒนา

---

## 1. สถาปัตยกรรมหน้าจอเมนูหลัก (Main Menu Architecture)

โครงสร้างสเกลและพิกัดของเมนูหลักยึดตามอาร์ตเวิร์ก `Asset/AssetSVG/Ui/MainMenu.svg` ซึ่งควบคุมผ่านรันไทม์ `js/mainMenuUi.js`

### 1.1 พิกัดและการแสดงผล (Viewport & Transform Specs)
* **รากการจัดวาง (Root Coordinate)**: `MainMeun` วางไว้ที่ Transform `(640, 360)` ซึ่งตรงกับตำแหน่งกึ่งกลางหน้าจอเว็บ (Viewport 16:9 Aspect Ratio `meet`)
* **พื้นหลัง (Color Canvas)**: อิลิเมนต์ `#Color` (พิกเซลเต็มเว็บ `CSS #101820`) ถูกแยกออกจากโครงสร้าง UI และสั่งซ่อนตอน Mount เพื่อใช้ Canvas พื้นหลังของเว็บแทน
* **ฮับกลาง (Center Group)**: `Group_Center_Center` วางไว้ที่ Offset `(0, 0)` จากราก เพื่อการ Snap กึ่งกลางหน้าจอแบบเบ็ดเสร็จ
* **แผงสกิน (Skin Panel)**: `Group_Center_left` ใน SVG ถูกกำหนดพิกัดจริงเป็นแผงฝั่งขวาสุด (`x ≈ +639`) สำหรับจัดการสกินตัวละคร

### 1.2 ลำดับชั้นกลุ่มอ็อบเจกต์ (Object Group Hierarchy)

| ลำดับชั้น (Layer) | ชื่อกลุ่ม (Group ID) | ฟังก์ชันและองค์ประกอบภายใน (Description & Children) |
| :--- | :--- | :--- |
| **ชั้นนอก (Outer Layer)** | `Color` | พื้นหลังสีเต็มหน้าจอ (`CSS #101820`) |
| | `MainMeun` | รากหลักของเมนู แสดงผลหลังจบเฟส `BOOT` เข้าสู่สเตท `MENU` |
| **กลุ่มหลัก (Main Groups)** | `Group_Center_Center` | ฮับกลาง ประกอบด้วยกรอบ ป้ายชื่อ และปุ่มเลือกโหมด |
| | `GroupJoinRoom` | แผงแสดงรายชื่อผู้เล่นในห้อง (`Player_n`) พร้อมปุ่มเตะ (`KickPlayer_n`) |
| | `Join_or_Crate` | กลุ่มปุ่ม Join / Create Room พร้อมอินพุตรหัสห้อง (`ROOM`) |
| | `PlayNow` | ปุ่มเริ่มเกม (`PLAY`) เพื่อส่งสเตทไปยัง `LOADING` |
| | `Group_Center_left` | แผงเลือกสกินฝั่งขวา (`LabelSkin`, `Skin_Default_*`, `Skin_Custom_*`) |
| | `LabelShow` | กล่องคำแนะนำวิธีเล่น (How to play) บริเวณมุมซ้าย |
| | `btn_Audio` / `btn_Link` | ปุ่มสลับเปิด-ปิดเสียง และปุ่มยูทิลิตี้/ลิงก์ภายนอก |

### 1.3 องค์ประกอบภายในฮับกลาง (`Group_Center_Center`)
* **โหมดการเล่น (Left Hub, `x ≈ -254`)**:
  * `Select_Alone_player`: ปุ่มเลือกโหมดเล่นคนเดียว (ALONE) กำหนดสเตทเลือกเริ่มต้น (`Btn_Press_True_FL`)
  * `Select_JoinRoom_player`: ปุ่มเลือกโหมดเข้าร่วมห้อง (JOIN ROOM) เริ่มต้นซ่อนสเตทกด (`Btn_Press_false_FL`)
* **ประเภทแผนที่ (Right Hub, `x ≈ +253`)**:
  * `Select_FlatLand_Mode`: เลือกแผนที่ราบ (FLATLAND) เป็นค่าเริ่มต้น
  * `Select_Resource`: เลือกแผนที่เน้นทรัพยากร (RESOURCE)
  * `Select_Resource_FL`: ปุ่มโหลดไฟล์แมปภายนอก (`LOAD FILE` ผ่าน `Icon_LoadFile`)
* **ตรรกะการสลับโหมด (State Toggle)**: การสลับโหมดทำโดยการควบคุมซ่อน-เปิดสตรีม (`Btn_Press_True` / `Btn_Press_false`) ของโหนดที่มีอยู่แล้ว ไม่ใช้วิธีลบหรือสร้างโหนดใหม่ใน DOM

---

## 2. สถาปัตยกรรมหน้าจอขณะเล่น (Gameplay HUD Architecture)

โครงสร้าง HUD ขณะเล่นยึดตามอาร์ตเวิร์ก `Asset/AssetSVG/Ui/PlayerUIGamePlay.svg` (ViewBox `1280×720`) ซึ่งจะปักตามขอบจอ (Anchor Snap) ทับชั้น HTML HUD เดิม

### 2.1 ระบบเลย์เอาต์ตามจุดปัก (Anchor Layout Specs)
องค์ประกอบลูกของ `Layout_GamePlay` ถูกแบ่งตามตำแหน่งจุดปักขอบจอ ดังนี้:

| กลุ่มจุดปัก (Anchor ID) | พิกัดอาร์ต (Art Offset) | หน้าที่และองค์ประกอบภายใน (Functions & Children) |
| :--- | :--- | :--- |
| `Anchor_Right_Top` | มุมบนขวา | `Btn_Setting`, `Btn_Audio`, แผงเป้าหมาย `Panel_objective` (`ObjectShow`, `ObjectiveDetail`) |
| `Anchor_Center_Top` | กลางบน | แถบเวลา `Load_Day` (แถบไล่สีระบบวัน-คืน), แผงเวลา `Panel_Day`, `NumberTime` |
| `Anchor_Top_Left` | มุมบนซ้าย | ไอคอนและตัวเลขเวฟศัตรู `IconWave`, `Number_Wave` |
| `Anchor_Center_1` | กลางจอ (Modal 1) | แผงคราฟต์ไอเทม `PanelCraft` (เริ่มต้นซ่อน แสดงเมื่อกด `F` หรือปุ่มคราฟต์) |
| `Anchor_Center_2` | กลางจอ (Modal 2) | แผงตั้งค่าระบบ `Panel_Setting` (เริ่มต้นซ่อน แยกสโคปจาก `Anchor_Center_1`) |
| `Anchor_Center_Bottom` | กลางล่าง | แผง Hotbar หลักสำหรับสล็อต 1–6 (`Panel_item_1` … `Panel_item_6`) |
| `Anchor_Left_Bottom` | มุมล่างซ้าย | แถบ HP (`Hp_Fill`), รายละเอียดอาวุธ `GunDetail`, ปุ่มคราฟต์ `btn_Craft`, ช่องแชต Stub |
| `Anchor_Left_Bottom_FL` | มุมล่างซ้ายซ้อน | แผงกระเป๋าเป้ `BackPack` (`tyle_1`–`3`) แสดงเฉพาะเมื่อสวมใส่กระเป๋า |

### 2.2 ข้อกำหนดรายละเอียดของแต่ละองค์ประกอบ (Component Specifications)

#### 1) แผงเป้าหมายและตั้งค่า (`Anchor_Right_Top`)
* **แผงเป้าหมาย (`Panel_objective`)**: อินเจ็กต์ข้อความเป้าหมายแมทช์ผ่าน `ObjectiveDetail` โดยอัปเดตตัวเลขพลังชีวิตของฐานจาก `match.base.hp` / `maxHp`
* **การควบคุมระบบ**: `Btn_Setting` ทำหน้าที่เปิด Modal ตั้งค่า (`Anchor_Center_2`) โดยสามารถใช้เป็นช่องทางออกจากแมทช์ได้

#### 2) แถบเวลาและตัวนับเวฟ (`Anchor_Center_Top` & `Anchor_Top_Left`)
* **แถบเวลาวัน-คืน (`Load_Day`)**: แถบ Linear Gradient แสดงสภาวะเวลา (`#B6F7FF` = เช้า, `#55008C` = กลางคืน, `#FFEA87` = ช่วงเปลี่ยนผ่าน)
* **ตัวนับเวฟ (`Number_Wave`)**: ผูกกับ `match.waveIndex` โดยเมื่ออยู่ในระหว่างเวฟการต่อสู้ สีฟอนต์จะเปลี่ยนเป็นสีแดง (`rgb(255,0,0)`) และกลับเป็นสีขาวเมื่อจบเวฟ

#### 3) แผงคราฟต์ไอเทม Modal (`Anchor_Center_1` — `PanelCraft`)
* **เงื่อนไขการเปิด**: เปิดด้วยปุ่ม `btn_Craft` บน HUD หรือปุ่มคีย์ลัด `F`
* **ระบบกริดและแคตตาล็อก**: ประกอบด้วยสล็อตรายการ `Slot_1` … `Slot_20` ควบคู่ปุ่มแยกหมวดหมู่ (`Btn_Catalog_weapon`, `Block`, `Turrent`, `Ammo`, `Gen`, `Other`)
* **ตรรกะการคราฟต์**: เลือกหมวดหมู่ → เลือกสล็อต (`Icon_Select_slot`) → กดปุ่มยืนยัน `Btn_confirm_Craft` (`Icon_Hanmmer`)
* **ข้อจำกัดการสเตต**: ขณะเปิดแผง `PanelCraft` ยูนิตจะถูกจำกัดให้อยู่ในโหมดเคลื่อนที่เท่านั้น (`MOVE` only) ห้ามยิงหรือเปลี่ยนอาวุธ

#### 4) ระบบ Hotbar และกระเป๋าเป้ (`Anchor_Center_Bottom` & `Anchor_Left_Bottom_FL`)
* **Hotbar พื้นฐาน (1–6)**: สล็อต `Panel_item_1` ถึง `Panel_item_6` รองรับไอเทมเริ่มต้นสูงสุด 6 ช่อง (ของเริ่มต้นแนะนำ 2 ชิ้น: `Base` และ `Gun m1911`)
* **กระเป๋าเป้เสริม (`BackPack` สล็อต 7–12)**:
  * ไม่ใช่ปุ่มกด HUD แต่เป็นไอเทมอุปกรณ์สวมใส่ (`tyle_1`, `tyle_2`, `tyle_3`)
  * เมื่อสวมใส่แล้ว แผง `Anchor_Left_Bottom_FL` จะเปิดแสดงสล็อต `Panel_item_7` … `Panel_item_12` อัตโนมัติ (ขยายความจุสูงสุดได้ถึง 12 ช่อง)
  * การถอด/ใส่กระเป๋าทำได้โดยการยืนใกล้ไอเทมกระเป๋าบนพื้นแล้วกด `F` (สวมใส่) หรือกด `F` ค้าง 3 วินาที (ถอด)

---

## 3. คลังอิลิเมนต์ปุ่มมาตรฐาน (`Btn.svg` Specs)

ปุ่มควบคุมทั้งหมดในเมนูและ HUD ใช้โครงสร้างการ Clone จากคลังปุ่มกลาง `Asset/AssetSVG/Ui/Btn.svg`

* **สถานะการเลือก (Selection Toggle)**: สลับระหว่าง `Btn_Press_True` และ `Btn_Press_False` เพื่อแสดงสถานะเลือก/ไม่เลือก
* **การระบุชื่อโหนดในโค้ด (Exact Node IDs)**:
  * ปุ่มระบบ: `Btn_Setting`, `Btn_Audio`, `Btn_Admin`
  * ปุ่มหมวดหมู่คราฟต์: `Btn_Catalog_weapon`, `Block`, `Turrent`, `Ammo`, `Gen`, `Other`
  * ชุดสีปุ่ม: `Btn_Gray_on/off`, `Btn_Bule_on/off`, `Btn_Red_on/off` (อ้างอิงชื่อตาม ID อาร์ตเวิร์กจริง)

---

## 4. ลูปการเปลี่ยนสเตทระบบ (System App State Flow)

ลำดับการทำงานของแอปพลิเคชันถูกล็อกตามสเตทไดอะแกรมดังนี้:

```
[BOOT] ──(Preload Assets/Modules)──> [MENU] ──(Select Mode/Map & Play)──> [LOADING] ──> [PLAYING] ──(Win/Lose)──> [RESULT] ──(Click Return)──> [MENU]
```

1. **BOOT**: ตรวจสอบ DOM และ Preload Asset ขนาน เข้าสู่ `MENU` เมื่อพร้อม
2. **MENU**: ผู้เล่นตั้งค่าชื่อ, เลือกโหมด (Alone / Join), เลือกแมพ (Flat / Resource / Load File), และเลือกสกิน
3. **LOADING**: สร้าง World, Alloc Occupancy, และเตรียมความพร้อมของ Pool ขนานกัน
4. **PLAYING**: สลับเข้าสู่แมทช์การต่อสู้ Mount หน้าจอ `PlayerUIGamePlay.svg` ทับ HTML HUD
5. **RESULT**: แสดงแผงสรุปผลแพ้/ชนะ (ฐานพัง / เคลียร์ครบทุกเวฟ) รอรับ Action กดปุ่มเพื่อวนกลับสู่สเตท `MENU`
