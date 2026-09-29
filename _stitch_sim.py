# -*- coding: utf-8 -*-
"""Extract the most recent pre-corruption sim.js by replaying Read tool outputs
from agent transcripts (they include line-numbered file contents)."""
import os, json, re
from collections import defaultdict

root = r"C:\Users\Orion\.cursor\projects\d-My-Projects-Game-WebGame-WantToPlay\agent-transcripts"
out_dir = r"d:\_My Projects\_Game\WebGame\WantToPlay\_recover"
os.makedirs(out_dir, exist_ok=True)

# Prefer chronological order by mtime of jsonl files
jsonls = []
for dp, _, fs in os.walk(root):
    for f in fs:
        if f.endswith(".jsonl"):
            p = os.path.join(dp, f)
            jsonls.append((os.path.getmtime(p), p))
jsonls.sort()

# Collect Read results for sim.js: map line_number -> (mtime, text)
# Also track tool results that look like file dumps with Lnnn: prefix
line_map = {}  # lineno -> (mtime, text)
chunks = []

read_result_re = re.compile(r"^(\d+)\|(.*)$")

def ingest_read_text(text, mtime):
    """Parse 'NNN|content' style read output into line_map."""
    if not text or "export function" not in text and "function " not in text:
        # still try
        pass
    lines = text.splitlines()
    # Detect format: "     1|code" or "1|code" from Cursor Read tool
    parsed = 0
    for raw in lines:
        m = re.match(r"^\s*(\d+)\|(.*)$", raw)
        if not m:
            continue
        ln = int(m.group(1))
        content = m.group(2)
        prev = line_map.get(ln)
        if prev is None or mtime >= prev[0]:
            line_map[ln] = (mtime, content)
        parsed += 1
    return parsed

total_parsed = 0
files_touched = 0
for mtime, path in jsonls:
    with open(path, encoding="utf-8", errors="replace") as fh:
        for line in fh:
            if "sim.js" not in line:
                continue
            # tool result payloads often embedded
            try:
                obj = json.loads(line)
            except Exception:
                continue
            # Look for tool results with file content
            msg = obj.get("message") or obj
            content = msg.get("content")
            if not isinstance(content, list):
                continue
            for part in content:
                if not isinstance(part, dict):
                    continue
                # Assistant sometimes echoes; prefer tool_result
                t = part.get("type")
                text = None
                if t == "tool_result":
                    text = part.get("content")
                    if isinstance(text, list):
                        # sometimes list of text blocks
                        bits = []
                        for b in text:
                            if isinstance(b, dict) and b.get("type") == "text":
                                bits.append(b.get("text") or "")
                            elif isinstance(b, str):
                                bits.append(b)
                        text = "\n".join(bits)
                    if not isinstance(text, str):
                        continue
                    # Only if it looks like a sim.js read (has line numbers + known symbols)
                    if "|" not in text[:200] and "\n" in text[:200]:
                        # might still be yes
                        pass
                    if re.search(r"^\s*\d+\|", text, re.M) and (
                        "initMatchGameplay" in text
                        or "tickMatch" in text
                        or "tryFire" in text
                        or "updateProjectiles" in text
                        or "from './config.js'" in text
                    ):
                        n = ingest_read_text(text, mtime)
                        if n:
                            total_parsed += n
                            files_touched += 1
                # Also extract Write contents as baseline (lower priority via earlier mtime)
                if t == "tool_use" and part.get("name") == "Write":
                    inp = part.get("input") or {}
                    p = (inp.get("path") or "").replace("\\", "/")
                    if p.endswith("js/sim.js"):
                        contents = inp.get("contents") or ""
                        # seed line_map with Write if empty-ish for those lines
                        for i, l in enumerate(contents.splitlines(), 1):
                            prev = line_map.get(i)
                            # Write is baseline; only fill if no later read
                            if prev is None:
                                line_map[i] = (mtime - 0.001, l)

print("line_map size", len(line_map), "parsed chunks", total_parsed, "files", files_touched)
if not line_map:
    raise SystemExit("no lines recovered")

max_ln = max(line_map)
# Fill gaps? leave blank for missing
out_lines = []
missing = []
for i in range(1, max_ln + 1):
    if i in line_map:
        out_lines.append(line_map[i][1])
    else:
        missing.append(i)
        out_lines.append("")  # placeholder

out = os.path.join(out_dir, "sim_stitched.js")
with open(out, "w", encoding="utf-8", newline="\n") as fh:
    fh.write("\n".join(out_lines))
    if out_lines:
        fh.write("\n")
print("wrote", out, "max_ln", max_ln, "missing", len(missing))
if missing:
    # collapse consecutive missing for report
    ranges = []
    a = missing[0]
    b = missing[0]
    for x in missing[1:]:
        if x == b + 1:
            b = x
        else:
            ranges.append((a, b))
            a = b = x
    ranges.append((a, b))
    print("missing ranges (first 40):", ranges[:40])
