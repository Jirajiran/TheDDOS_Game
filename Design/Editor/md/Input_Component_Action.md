# CardCreate Frame 1 — Short Binding

Logic ทั้งหมดอยู่ที่ `globalBridge.js` → `EditorBridge.initCardCreate(this)`

## กติกา TextField
* Main Frame 1 → แสดง  
* เฟรมอื่น → ไม่แสดง  
* `input_cols` / `input_rows`: ช่วง **2–16** (กันพิมพ์ตัวอักษร, เกิน 16 ตัดทันที, blur แล้วต่ำกว่า 2 → 2)  


## วางใน MovieClip `CardCreate` (Frame 1) แค่นี้

```javascript
// ===== MovieClip CardCreate (Frame 1) : Actions - Frame =====
if (window.EditorBridge && typeof window.EditorBridge.initCardCreate === "function") {
    window.EditorBridge.initCardCreate(this);
}
```

> ห้ามวาง `UIInputField.attach(...)` ยาว ๆ ใน Animate อีก  
> แก้ใน FLA แล้ว Publish ใหม่ (อย่าแก้ `Index.js` ด้วยมือ)
