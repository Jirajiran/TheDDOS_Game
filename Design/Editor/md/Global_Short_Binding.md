# Global Short Binding (Editor)

## ตำแหน่งใน Adobe Animate
* Actions Panel (F9) → **Global > Scripts**

## โค้ดที่วางใน Animate

```javascript
// ===== Actions > Global > Scripts (งาน Editor เท่านั้น) =====
// Global Short Binding (เชื่อมต่อผ่าน globalBridge.js ที่โหลดจาก HTML Template)
if (window.EditorBridge && typeof window.EditorBridge.initGlobal === "function") {
    window.EditorBridge.initGlobal(this);
}
```

## หมายเหตุ (logic อยู่ใน `libs/globalBridge.js` / `js/editor/globalBridge.js`)
* `initGlobal` ตั้ง `UIScreen` / `UIAnchor` และผูก canvas
* CardCreate ใช้ short binding: `EditorBridge.initCardCreate(this)` (ดู `Input_Component_Action.md`)
* Bridge ฟัง **`MAP_CREATE_REQUEST`** → สร้าง `EditorData.doc` → ยิง **`MAP_DATA_READY`**  
  (Main Timeline Frame 1 ฟัง `MAP_DATA_READY` แล้ว `gotoAndStop(1)` ไป Frame 2)
* อย่าแก้ `Index.html` / `Index.js` ด้วยมือ — publish จาก Animate จะทับ
