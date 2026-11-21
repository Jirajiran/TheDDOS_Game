# API & Data Contract (Editor) — สรุปที่ bridge รับผิดชอบ

## Lifecycle
```
CardCreate btn_create
  → MAP_CREATE_REQUEST { name, pathCols, pathRows }
  → globalBridge สร้าง EditorData.doc (kind: theddos-map)
  → MAP_DATA_READY { doc }
  → Main Timeline Frame 1 → gotoAndStop(1) ไป Frame 2
```

## Map Document ขั้นต่ำที่ bridge สร้าง
* `kind: "theddos-map"`, `version: "1"`, `pathLocked: true`
* `pathCols` / `pathRows` (**2–16**, กันพิมพ์เกินเพดานใน TextField)
* `playerSpawns`: host เริ่มต้น
* `teams`: Team 1 / Team 2
* `damageMatrix` fallback
* `areas` / `placedObjects` / `spawns` ว่าง

รายละเอียด schema เต็มดูเอกสารอ้างอิงสถาปัตยกรรม Editor เดิมได้
