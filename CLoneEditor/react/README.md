# react — Editor UI (ว่างรอ scaffold)

วางแอป React ของ Map Editor ที่นี่

## Pack / เกม (บังคับ)

- **อ่าน:** `/data/pack/` ที่ root (`pack_manifest.json` + ไฟล์ในแมนิเฟสต์)
- **เขียน:** export ทับ root pack และ/หรือ Test Play handoff — **ห้าม** สำเนา pack ใต้ `CLoneEditor/`
- **ท่อเล่น:** `js/session/editorTestPlay.js` → `resolvePlayMap` → `applyEditorMap` (root)

`../vanilla/data/pack/` ไม่ใช่ความจริง (ว่างโดยตั้งใจ)

## ขอบเขตรอบแรก (แนะนำ)

1. New map / Import JSON (สัญญา `mapDoc` ที่ root `js/editor/mapDoc.js`)
2. Canvas / map view (เทียบ `mapView.js`)
3. แผงแท็บขวา (เทียบ `panels.js` + `sheetForm.js` + `recordForm.js`)
4. Export → `/data/pack/` + Test Play

## กฎสั้น

- State แมป = เอกสาร JSON เดียว (Memento: undo = snapshot)
- อย่า duplicate กติกาดาเมจ/ยิงใน React
- Asset ชื่อ ASCII

ยังไม่มี `package.json` ในรอบนี้ — เพิ่มเมื่อ scaffold จริง
