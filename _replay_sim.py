# -*- coding: utf-8 -*-
"""Reconstruct sim.js by replaying Write + StrReplace from transcripts in chrono order."""
import json
import re
from pathlib import Path

root = Path(r"C:\Users\Orion\.cursor\projects\d-My-Projects-Game-WebGame-WantToPlay\agent-transcripts")
out_dir = Path(r"d:\_My Projects\_Game\WebGame\WantToPlay")

# Collect all edit ops with approximate order: file mtime then line index
ops = []
for jp in root.rglob("*.jsonl"):
    mtime = jp.stat().st_mtime
    with jp.open(encoding="utf-8", errors="replace") as f:
        for i, line in enumerate(f):
            if "sim.js" not in line:
                continue
            try:
                obj = json.loads(line)
            except Exception:
                continue
            msg = obj.get("message", {})
            content = msg.get("content", [])
            if not isinstance(content, list):
                continue
            for c in content:
                if not isinstance(c, dict):
                    continue
                name = c.get("name")
                inp = c.get("input") or {}
                if not isinstance(inp, dict):
                    continue
                path = str(inp.get("path", ""))
                if name == "Write" and "sim.js" in path:
                    ops.append({
                        "kind": "Write",
                        "mtime": mtime,
                        "file": jp.name,
                        "line": i,
                        "contents": inp.get("contents", ""),
                    })
                elif name == "StrReplace" and "sim.js" in path:
                    ops.append({
                        "kind": "StrReplace",
                        "mtime": mtime,
                        "file": jp.name,
                        "line": i,
                        "old": inp.get("old_string", ""),
                        "new": inp.get("new_string", ""),
                        "replace_all": bool(inp.get("replace_all", False)),
                    })
                elif name == "Shell":
                    cmd = str(inp.get("command", ""))
                    if "sim.js" in cmd and ("write_text" in cmd or "path.write" in cmd or "open(" in cmd):
                        ops.append({
                            "kind": "Shell",
                            "mtime": mtime,
                            "file": jp.name,
                            "line": i,
                            "command": cmd[:500],
                            "full": cmd,
                        })

ops.sort(key=lambda o: (o["mtime"], o["line"]))

print(f"Total ops: {len(ops)}")
for o in ops:
    if o["kind"] == "Write":
        print(f"WRITE {o['file']}:{o['line']} len={len(o['contents'])}")
    elif o["kind"] == "StrReplace":
        print(f"SR    {o['file']}:{o['line']} old={len(o['old'])} new={len(o['new'])} all={o['replace_all']}")
    else:
        print(f"SHELL {o['file']}:{o['line']} {o['command'][:120].replace(chr(10),' ')}")

# Replay from last Write before corruption (skip shells that corrupted)
text = None
applied = 0
failed = 0
# Find last Write index
last_write_idx = max(i for i, o in enumerate(ops) if o["kind"] == "Write")
print(f"\nReplaying from Write at index {last_write_idx}")

text = ops[last_write_idx]["contents"]
print(f"Base length {len(text)}")

for o in ops[last_write_idx + 1 :]:
    if o["kind"] == "Shell":
        print(f"SKIP shell {o['file']}:{o['line']}")
        continue
    if o["kind"] != "StrReplace":
        continue
    old, new = o["old"], o["new"]
    if not old:
        failed += 1
        print(f"FAIL empty old {o['file']}:{o['line']}")
        continue
    count = text.count(old)
    if count == 0:
        failed += 1
        # show a hint
        snippet = old[:60].replace("\n", "\\n")
        print(f"FAIL miss {o['file']}:{o['line']} count=0 snippet={snippet!r}")
        continue
    if o["replace_all"]:
        text = text.replace(old, new)
        applied += 1
        print(f"OK allx{count} {o['file']}:{o['line']} -> len {len(text)}")
    else:
        if count != 1:
            # try first only like StrReplace default? Cursor StrReplace fails if not unique
            failed += 1
            print(f"FAIL nonunique {o['file']}:{o['line']} count={count}")
            continue
        text = text.replace(old, new, 1)
        applied += 1
        print(f"OK {o['file']}:{o['line']} -> len {len(text)}")

out = out_dir / "_sim_recovered.js"
out.write_text(text, encoding="utf-8", newline="\n")
print(f"\nWrote {out} len={len(text)} applied={applied} failed={failed}")
print("has stepSim", "stepSim" in text)
print("has spawnBeam", "spawnBeam" in text)
print("has unitMatchesFaction", "unitMatchesFaction" in text)
print("funcs sample:", re.findall(r"export function (\w+)", text)[:20])
