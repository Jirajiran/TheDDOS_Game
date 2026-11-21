# Main Timeline Frame 1 — Short Binding

## Flow ไป Frame 2
1. CardCreate กด `btn_create` → ยิง `MAP_CREATE_REQUEST` `{ name, pathCols, pathRows }`
2. **`globalBridge.js`** สร้าง `EditorData.doc` แล้วยิง `MAP_DATA_READY`
3. Frame 1 ฟัง `MAP_DATA_READY` → `root.gotoAndStop(1)` (Frame 2)

> ขั้นที่ 2 อยู่ใน bridge แล้ว — ไม่ต้องเขียนใน Animate Actions

## โค้ดที่วางใน Main Timeline Frame 1

```javascript
// ============================================================================
// Main Timeline Frame 1 Short Binding (Clean Architecture)
// ============================================================================
var root = this;
root.stop();

window.UIBus = window.UIBus || new createjs.EventDispatcher();
window.EditorData = window.EditorData || { doc: null };

if (window.UIAnchor && window.lib && window.lib.properties) {
    UIAnchor.base = lib.properties;
}
var bg = root.Color || root.BgScreen || root.bg;
if (bg && window.UIAnchor) {
    bg.mouseEnabled = false;
    UIAnchor.fill(bg);
}
if (root.CardCreate && window.UIAnchor) {
    UIAnchor.attach(root.CardCreate, "CENTER");
}
if (window.UIScreen) window.UIScreen.apply();

window.UIBus.off("MAP_DATA_READY", root._onMapDataReady);
root._onMapDataReady = function (evt) {
    if (window.UIInput && window.UIInput.commit) {
        window.UIInput.commit(true);
    }
    root.gotoAndStop(1); // Frame 2
};
window.UIBus.on("MAP_DATA_READY", root._onMapDataReady);
```
