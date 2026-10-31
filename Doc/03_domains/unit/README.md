# unit — ClassUnit (Player / Enemy / Ally)

สถานะ: โครงร่วม + Unified Action มีใน V1 · ดู AskKeep §2

อ่านก่อน:
- `Doc/00_hub/AskKeep.txt` §2 ClassUnit
- Archetype ขั้นสูง / NextPlan → `Doc/03_domains/ai/NextPlan/02_*.md` (ยังไม่ทำในโค้ด)

ร่างยูนิตอยู่ที่ `data/pack/units.json` ไฟล์เดียว หนึ่ง id คือหนึ่งระเบียน ร่างกาย พลังชีวิต ความเร็ว สกิล ชุดเริ่ม เป้าหมาย และธงพฤติกรรมอยู่ที่ระเบียนนั้น ของสวมเป็น id ไปที่ `items.json` / `skills.json` / `weapons.json` โมเดลเป็น id ใน `js/assets/closedCatalog.js`

ผู้เล่นคือชนิด `PLAYER` ศัตรูพื้นฐานคือ `ENEMY_DEFAULT` ร่างที่เกิดตามคลื่นเช่น `GRUNT_BASIC` อยู่ในชีตเดียวกัน ทีมไม่ได้อยู่ที่ชนิดยูนิต และระเบียนนี้ไม่รู้ว่าคนหรือบอทเป็นคนคุม การเกิดกับทีมอยู่ที่แถว Spawn `aliases`, `waveComposition`, `waveTable` เป็นตารางคลื่น ไม่ใช่ตัวยูนิต

ชุดเริ่มอยู่ที่ร่างนั้น `currentSlot` คือช่องที่เลือกอยู่ ปืนในช่องนั้นคือปืนในมือ `active` ใช้กับเกราะและโล่ ชนิดเดียวกันติด `active` ได้ชิ้นเดียว ชิ้นที่สองไม่ถูกสวม

ศิลป์เสียงและโมเดลเป็นชั้นปิด ผู้สร้างเพิ่มไฟล์ เอดิเตอร์จัด id ที่มีอยู่เท่านั้น เสียงอยู่ `data/pack/audio.json`
