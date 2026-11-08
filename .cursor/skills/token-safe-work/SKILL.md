---
name: token-safe-work
description: >-
  Caps Doc reads, stops on junk/secrets, and avoids wide repo scans to save
  tokens. Use when starting work, reading Doc/, exploring folders, merging
  branches, touching API keys/env, or when the user asks for safe/cheap token
  use, INDEX-only Doc reads, or to stop and ask before opening a file.
---

# Token-safe work

อ่าน skill นี้ก่อนสำรวจหรือลงมืองานที่กินบริบทง่าย

## Doc

- ห้ามอ่านเอกสารทั้งโฟลเดอร์ `Doc` พร้อมกัน
- ตรวจสารบัญ `Doc/INDEX.md` ก่อน แล้วเปิดอ่านเฉพาะไฟล์ที่จำเป็น
- สูงสุด **1–2 ไฟล์ Doc ต่อรอบ**
- สถานะค้างดูท้าย `Doc/00_hub/AskKeep.txt` ก่อนไล่ Doc อื่น

## หยุดถามก่อน

หยุดทันที แล้วถามผู้ใช้ก่อนดำเนินการต่อ เมื่อเจออย่างใดอย่างหนึ่ง:

- ชื่อไฟล์ที่ดูเป็นระบบปกป้อง / secret / key dump
- เนื้อหาขยะที่กินโทเคนโดยไม่ช่วยงาน (decode ฐาน 2, แปลงรหัสไม่จำเป็น, สคริปต์ตัวอย่างยาวมีคีย์)
- API key / Bearer / `.env` จริง (ไม่ใช่แค่ `.env.example` แบบ placeholder)
- กิ่ง/โฟลเดอร์สำรองทั้งก้อนที่ยังไม่สมบูรณ์ (เช่น `theddos-gameWebBrach`) ถ้ายืนจะ merge ทั้งโฟลเดอร์

อย่าคัดลอกคีย์เต็มลงแชท · บอกให้ revoke + ใช้ `.env` ที่ gitignore

## สำรวจโค้ด

- ชี้พาธ/บรรทัดที่รู้แล้วก่อน · อย่า glob ทั้ง repo หรือทั้งกิ่ง
- grep แคบด้วย `glob` / `path` / `head_limit`
- อย่าอ่าน SVG/asset ใหญ่ทั้งไฟล์ถ้าต้องการแค่ `id` — grep ชื่อพอ
- งานเล็กที่รู้จุดแก้: บอกบรรทัดให้ผู้ใช้ทำเองได้ถ้าคุ้มกว่า Agent

## ลงมือ

- ล็อกความเข้าใจ (reply-understanding) ก่อนโค้ดเมื่อเป็นงานออกแบบ/หลายข้อ
- แก้เฉพาะจุดที่ยืนยัน · ห้าม “สำรวจแล้วแก้เผื่อ” ทั้งต้น
- ห้าม merge/copy ทั้งโฟลเดอร์กิ่ง · คัดชิ้นที่ขาดทีละไฟล์
- API ภายนอก: อ่านแค่ชื่อตัวแปรจาก `.env.example` · ค่าจริงอยู่นอกแชท

## แชท

- แชทยาวหรืองานใหญ่ชุดใหม่ → แนะนำแชทใหม่ + อ้าง AskKeep สั้นๆ
- อย่าแนบรูป Usage / ไฟล์ขยะ / กิ่งทั้งต้นเข้าแชทถ้าไม่จำเป็น
