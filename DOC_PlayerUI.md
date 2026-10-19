# DOC_PlayerUI — สัญญา Visual / Input

ที่มาอาร์ต: `Asset/AssetSVG/Ui/PlayerUIGamePlay.svg` · คลังปุ่ม `Asset/AssetSVG/Ui/Btn.svg`  
Runtime: `js/playerUiGamePlay.js` (visual only) · Intent: `dispatchUi` ใน `js/app.js` · กฎเกมอยู่ที่ `sim`

## หลัก (locked)

1. **SVG = visual เท่านั้น** — อ่าน state แล้ววาด / โชว์-ซ่อนแผง · ไม่แก้การเคลื่อนที่หรือ physics
2. **ไม่มี legacy HTML HUD** — ชิป wave/hp/hotbar/craft/receive/result HTML ถอดแล้ว · ใช้ PlayerUI SVG อย่างเดียว (+ Cheat debug)
3. **Anchor snap อย่างเดียว** — ไม่เปลี่ยนสเกลอาร์ต · ชิ้นที่โชว์ต้องอยู่ใต้ Anchor ที่ออกแบบ
4. **Press pool** — clone จาก Btn.svg เข้า `<defs>` ตอน mount · ซ่อน · โชว์เฉพาะใต้ปุ่มจริง (เช่น Exit ใน `Anchor_Center_3`) · ห้าม insert วาดที่ root
5. **`dispatchUi(intent)`** — คีย์ (F/E/Q/…) กับปุ่ม SVG เข้าท่อ Intent เดียวกัน · ไม่เรียก panels/sim คนละทางสำหรับ intent เดียวกัน
6. **Press feedback** = idle → onPress → idle · Catalog Yellow / Audio False = state idle

## Visual id map

| กลุ่ม | หน้าที่ |
|---|---|
| `Panel_item_1`…`6` | Hotbar หลัก — โชว์ครบ 6 กรอบเสมอ |
| `Panel_item_7`… | BackPack (แยกจาก Skill_Show) |
| `Slot_1`… | กริดแคตตาล็อกคราฟต์ |
| `NumberItem*` | ตัวเลข · text-anchor end |
| `Name_Item` / `Detail_Item` | ชื่อ / lore — ห้ามยัด cost |
| `Request_item_*` | แพ็ค cost จริง 1–N เข้าช่อง · ไม่ล็อกช่องว่างกลาง |
| `Icon_Current_slot` | icon ใหญ่ตอน select สูตร |
| `Skill_Show_1`…`3` | สกิล · Fist ที่ช่อง 1 · **ไม่ผูกกระเป๋า** |
| `btn_Audio` True/False | mute state idle |
| `Anchor_Center_3` / Exit | จบเกม · press จาก pool ใน defs |

Icon overlay เกือบทุกช่อง ~**60×60** ในกรอบ 72 · ยกเว้น `Icon_Current_slot` (ขนาดใหญ่ตามอาร์ต)

## Input → dispatchUi

| แหล่ง | Intent |
|---|---|
| F / `btn_Craft` | `craftToggle` (หลัง backpack equip logic ของ F) |
| E / `btn_interactive` | `interact` (ถ้า Gen เปิดอยู่แล้ว → `genClose`) |
| Q / `Skill_Show_1` | `castFist` |
| Setting / Audio / Exit / Gen take | `settingOpen` / `audioToggle` / `leaveGame` / `genTake` |
| Enter / click `InputChat` | `chatToggle` (open) · open แล้ว Enter = send+close |
| Esc (ขณะแชท) | ยกเลิกไม่ส่ง · `closeChat` |
| Canvas LMB ขณะแชท | dismiss ทันที → `chatMode=false` แล้วยิงด้วยคลิกนั้นได้ |

ไม่มีปุ่มวาดก็ยังมี Intent จากคีย์ได้ — ไม่บังคับปุ่มผีใน DOM

## Chat (UX)

- `chatMode`: บล็อก WASD/เกมเพลย์ · ข้อความเข้า HTML `.player-ui-chat-input` (พื้นโปร่ง · ตัวอักษรขาว)
- `ChatShow`: 32pt ขาว + stroke ดำ (`paint-order: stroke fill`)
- `InputChat` โชว์ตลอดเป็น hit zone · คลิกเปิดแชท · ตอนเปิดซ่อน placeholder SVG
- มัลติเพลย์เยอร์ chat net ยังนอกเฟสนี้

## Hotbar switch

- Wheel: ทุกช่อง ±1
- Delay 0.1s หลัง**ยิง** (fire lock) ไม่ใช่แค่ถือปืน
- Burst/beam ยังบล็อกสลับผ่าน `unitWeaponBusy`

## ห้ามทำ

- HTML HUD / rebuild result card ตอนจบเกม
- insert Btn fill ที่ SVG root (ลอยไม่มี snap)
- ซ่อนทั้ง `Anchor_Left_Bottom_FL` เพราะไม่มีกระเป๋า (สกิลหาย)
- ล็อก Request เป็น WOOD/Stone/Iron ตายตัวพร้อมช่องว่างกลาง
- คีย์เรียก panels โดยตรงคนละทางกับปุ่ม
