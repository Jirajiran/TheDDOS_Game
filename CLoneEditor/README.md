# CLoneEditor — React port sandbox

โฟลเดอร์นี้เป็น **โคลนงาน Editor** สำหรับพอร์ต UI เป็น React  
ของเล่นจริงยังอยู่ที่ root: `editor.html` + `js/editor/*` — **อย่าทับจนกว่าจะยืนยันตัดสลับ**

## ความจริงของแพ็ก (บังคับ)

| | |
|--|--|
| **อ่าน/เขียน** | `/data/pack/` ที่ **root** เท่านั้น |
| **`vanilla/data/pack/`** | **ไม่ใช่ความจริง** — ว่าง + ป้าย `NOT_SOURCE_OF_TRUTH.md` |
| React | loader / export / Test Play ชี้ root · ห้ามเก็บสำเนา pack แก้ใน `CLoneEditor` |

แก้ยูนิต·ปืน·ไอเท็ม·กติกาใน Editor → เขียนกลับ root pack หรือส่ง Test Play ผ่านท่อเดิม → เกมจึงตาม

## โครง

| โฟลเดอร์ | บทบาท |
|---------|--------|
| `Doc/` | สำเนาสเปก editor (ชี้รายละเอียด) · สเปกหลักยังที่ `Doc/03_domains/editor/` |
| `vanilla/` | สแนปช็อตโค้ด UI/ท่ออ้างอิง (ไม่รวม pack JSON) |
| `react/` | แอป React ใหม่ — R/W pack ที่ root |

## สิ่งที่โคลนแล้ว (`vanilla/`)

| ต้นทาง (root) | สำเนาในนี้ |
|---------------|------------|
| `editor.html` | `vanilla/editor.html` |
| `css/editor.css` | `vanilla/css/editor.css` |
| `js/editor/*.js` | `vanilla/js/editor/` |
| `js/session/editorTestPlay.js` | `vanilla/js/session/editorTestPlay.js` |
| `js/world/applyEditorMap.js` | `vanilla/js/world/applyEditorMap.js` |
| `Doc/03_domains/editor/*` | `Doc/` |
| `data/pack/*.json` | **ไม่โคลน** — ใช้ `/data/pack/` |

`vanilla/` **รันเดี่ยวไม่ได้** — import ชั้นเกมที่ root  
แก้ production ที่ root · `vanilla/` เป็นแผนที่ฟังก์ชันตอนพอร์ตเท่านั้น

## สัญญาที่ React ต้องเคารพ

1. **แมปเอกสาร** — หนึ่งไฟล์ JSON = หนึ่งแมป (`mapDoc` shape)
2. **คลังชนิด** — อ่าน/เขียนผ่าน `/data/pack/` (+ overlay บนเอกสารแมป)
3. **Art pool** — bake ตอน loading · วาดจาก pool
4. **Test Play** — `theddos_editor_testplay` → `resolvePlayMap` / `applyEditorMap` ที่ root
5. **Data-driven** — ไม่ hardcode กติกาใน UI

รายละเอียดแผง → `Doc/README.md` · สถานะงาน → `Doc/DocEditor.txt` · ความจริงสเปก → `/Doc/03_domains/editor/`

## ชั้นที่แชร์จาก root (ไม่ fork)

- `/data/pack/` · `pack_manifest.json`
- `js/assets/closedCatalog.js` · art / SVG
- `js/defs/*` · `js/session/resolvePlayMap.js` · `js/world/applyEditorMap.js`
- ซิม (`js/sim/*`) — Editor ไม่เป็น sim

## React (`react/`)

UI เท่านั้น · pack + Test Play ที่ root  
ดู `react/README.md`

## Sync กลับ root (ตัดสลับ UI)

1. ชี้ entry editor ไป build ของ `react/`
2. คง handoff Test Play + shape JSON + path `/data/pack/`
3. อัปเดต `Doc/03_domains/editor/` · `vanilla/` เป็น archive ตามตกลง
