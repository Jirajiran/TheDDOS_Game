# ai — Stage / Goal / Mediator

สถานะโค้ด: **Phase 1 ✓ · 2a ✓ · 2b ✓ · 2c PLACE ✓ · 3 archetypes ✓**  
`decideEnemyActions` = General pivots → Local path layer → Mediator (allowedGoals filter) → Unified Input  
ดู AskKeep «NextPlan delivery» ข้อ 3

## ไฟล์ในโฟลเดอร์นี้

| ไฟล์ | บทบาท |
|------|--------|
| `AI-Stage-Goals-and-Actions.txt` | blueprint สั้น · สูตร Goal→Stage→Action |
| `NextPlan/` | สเปกต่อยอด (architecture · dictionaries · archetypes · prerequisites) |

โค้ด runtime: `js/ai/blackboard.js` · `mediator.js` · `events.js` · `archetypes.js` · `local_group_manager.js` · `place_kit.js` · `stages/*` · `js/general.js` · `js/config.js` (`UNIT_ARCHETYPE_REGISTRY`)

### Phase 3 (สั้น)
- Archetype data: `allowedGoals` · `targetPriorityList` · `behaviorFlags`
- Mediator คะแนนเฉพาะ Goal ที่อนุญาต · Stages ไม่รู้จัก archetype
- Spawn ผสมจาก `WAVE_ARCHETYPE_COMPOSITION` · Boss `DYNAMIC_PHASE_BOSS` สลับเฟสตาม hpRatio

อ่านคู่กับ AskKeep §4 General vs Unit stage

โฟกัสงาน AI: `@Doc/03_domains/ai` อย่างเดียวพอ — ไม่ต้องดึงทั้ง Doc
