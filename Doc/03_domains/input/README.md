# input — Unified Input Pipeline

สถานะ: คน+บอทส่ง Action ช่องทางเดียว (V1) · เป็นตัวเชื่อม block ⇄ weapon

อ่านก่อน:
- AskKeep (Action กับ object · craft เปิด = MOVE เท่านั้น)
- AI ออก Action ผ่านช่องนี้ → `Doc/03_domains/ai/AI-Stage-Goals-and-Actions.txt`

กฎสั้น: UI/Hub ไม่หักของเอง · หักใน sim หลัง Action สำเร็จ (เช่น tryPlace → consume)

## INTERACT (ล็อก)

ปุ่ม E และ `btn_interactive` ไม่เปิดแผงเอง ทั้งคู่เข้า `dispatchUi('interact')` แล้วตั้ง `state.pendingInteract` เฟรมถัดไปใน `js/app/playSession.js` ส่ง `makeInteractAction` ก่อน `tickMatch` ซิมที่ `ActionType.INTERACT` เรียก `tryInteract` ใน `js/sim/block.js`

`tryInteract` เลือกบล็อกที่ใกล้สุดใน `interactRadius` แล้วแยกผล:

- ประตู สลับเปิดปิด
- เจนหรือฐาน ตั้ง `pendingUi` แล้ว `consumePendingUi` เปิดแผงรับของ
- `isFactory` (บล็อก `FACTORY_WEAPON`) เรียก `interactFactory` ตั้ง `pendingUi` ชนิด `upgrade`

ปุ่ม Take ของเจน ฐาน และโรงงานเข้า `pendingTake` ชุดเดียวกัน โรงงานเป็นชนิด `factory` แล้วเฟรมถัดไปส่ง `TAKE_FACTORY` ซิมฝากปืนในช่องที่ส่งมา หรือรับคืนเมื่อผลพร้อม ระหว่างอัปเกรดแอ็กชันนี้ไม่รับปืนเพิ่ม

ถ้าแผงเจนหรือฐานเปิดอยู่แล้ว การกดเดียวกันปิดแผง ไม่ส่งแอ็กชันซ้ำ การถืออาวุธไม่เกี่ยวกับ `btn_interactive` รีโหลดอยู่ที่ปุ่ม R
