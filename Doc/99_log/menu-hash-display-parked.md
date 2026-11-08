# Parked — MainMenu Hash Display

สถานะ: **ค้าง** · ยังไม่จำเป็นในเฟสนี้ · อย่าลงมือแก้จนกว่าจะเปิดงาน menu-net / lobby จริง

วันที่จด: 2026-11-08

## อาการ

- `HashingOutPut` (Display) ยังโชว์รหัสแบบมี prefix `#RM-` (เช่น `#RM-1234`)
- ความต้องการที่คุยไว้: Display ควรเป็น**เลข** (หรือค่าจริงของห้อง) ไม่โชว์โครง mock `#RM-`
- ทดบน local `http://127.0.0.1:8080/` ยังไม่ชัดว่าพอสำหรับยืนยัน lobby จริง → พักทดสอบรอบนี้

## จุดที่เกี่ยวข้อง (ตอนเปิดงานใหม่)

- สร้างรหัส: `js/mainMenuUi.js` → `UIRoom.generateHash()` คืน `"#RM-" + num`
- Display mockup: `Design/MainMenu.js` → `lib.HashingOutPut` ฟัง `ROOM_ENTER` / `ROOM_LEAVE`
- Input: `Design/MainMenu.js` → `lib.InputHash` (ลบ preview `#RM-...` ไปแล้ว · คงช่องกรอกว่าง)

## ขอบเขตที่ทำแล้ว / ยังไม่ทำ

- [x] เอา Preview `#RM-...` ออกจาก Input
- [ ] ปรับ Display / `generateHash` ให้แสดงเลขอย่างเดียว (หรือรูปแบบที่ตกลงใหม่)
- [ ] ยืนยัน join/host ข้ามแท็บจริงนอก mock

## เมื่อกลับมาทำ

1. ตกลงรูปแบบรหัสห้อง (เลขล้วน vs มี prefix)
2. ให้ `generateHash` + Display + `normalizeHash` / `joinByHash` ใช้รูปแบบเดียวกัน
3. ทดสอบ Host สร้างห้อง → Display อัปเดต · Guest กรอก Input แล้วเข้าได้
