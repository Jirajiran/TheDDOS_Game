# -*- coding: utf-8 -*-
import json
from pathlib import Path

root = Path(r"C:\Users\Orion\.cursor\projects\d-My-Projects-Game-WebGame-WantToPlay\agent-transcripts")

# 1) Inspect aae348aa
p = root / "f93ca767-ea67-41c2-8cc8-bd32393d96ff" / "subagents" / "aae348aa-5a36-4966-9efa-a0fc2784d7c0.jsonl"
print("=== aae348aa ===", p.exists(), p.stat().st_size if p.exists() else 0)
if p.exists():
    for i, line in enumerate(p.open(encoding="utf-8")):
        obj = json.loads(line)
        msg = obj.get("message", {})
        content = msg.get("content", [])
        print(f"line {i} role={obj.get('role')} parts={len(content) if isinstance(content, list) else type(content)}")
        if isinstance(content, list):
            for j, c in enumerate(content):
                if not isinstance(c, dict):
                    continue
                t = c.get("text", "") or ""
                name = c.get("name", "")
                print(f"  part {j} type={c.get('type')} name={name} textlen={len(t)}")
                if t:
                    print("   ", t[:400].replace("\n", " "))
                inp = c.get("input")
                if isinstance(inp, dict):
                    for k, v in inp.items():
                        if isinstance(v, str):
                            print(f"    {k} len={len(v)} head={v[:160].replace(chr(10), ' ')}")
                        else:
                            print(f"    {k}", type(v).__name__)

# 2) Find largest Write of sim.js and chronological order of writes
print("\n=== All Write sim.js ===")
writes = []
for jp in root.rglob("*.jsonl"):
    mtime = jp.stat().st_mtime
    with jp.open(encoding="utf-8", errors="replace") as f:
        for i, line in enumerate(f):
            if "sim.js" not in line or "Write" not in line:
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
                if c.get("name") != "Write":
                    continue
                inp = c.get("input") or {}
                path = str(inp.get("path", ""))
                if "sim.js" not in path:
                    continue
                contents = inp.get("contents", "")
                writes.append((mtime, jp.name, i, len(contents), contents))

writes.sort(key=lambda x: (x[0], x[2]))
for mtime, name, i, n, _ in writes:
    print(f"mtime={mtime:.0f} {name} line={i} bytes={n}")

# 3) Search for stepSim in any tool_result-like content across transcripts
print("\n=== stepSim occurrences ===")
for jp in root.rglob("*.jsonl"):
    with jp.open(encoding="utf-8", errors="replace") as f:
        for i, line in enumerate(f):
            if "export function stepSim" in line:
                print(jp.name, "line", i, "len", len(line))

# 4) agent-tools large files
at = Path(r"C:\Users\Orion\.cursor\projects\d-My-Projects-Game-WebGame-WantToPlay")
print("\n=== large files in project cursor folder ===")
for p2 in at.rglob("*"):
    if p2.is_file() and p2.stat().st_size > 40000:
        print(p2.relative_to(at), p2.stat().st_size)
