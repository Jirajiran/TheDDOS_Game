# -*- coding: utf-8 -*-
from pathlib import Path
import re

sim = Path(r"d:\_My Projects\_Game\WebGame\WantToPlay\_sim_recovered.js").read_text(encoding="utf-8")
print("recovered len", len(sim), "lines", sim.count("\n")+1)
print("export function:", re.findall(r"export function (\w+)", sim))
print("function:", [x for x in re.findall(r"^function (\w+)", sim, re.M)][:40])
print("has CONTINUOUS_BEAM", "CONTINUOUS_BEAM" in sim)
print("has pierce", "pierce" in sim.lower())
print("has CollisionLayer", "CollisionLayer" in sim)
print("has spawnProjectile", "spawnProjectile" in sim)
print("has tryFire", "tryFire" in sim)
print("has updateProjectiles", "updateProjectiles" in sim)
print("has beams", "beam" in sim.lower())

# What other files import from sim
root = Path(r"d:\_My Projects\_Game\WebGame\WantToPlay\js")
for p in root.glob("*.js"):
    t = p.read_text(encoding="utf-8", errors="replace")
    if "from './sim.js'" in t or 'from "./sim.js"' in t:
        m = re.search(r"import\s*\{([^}]+)\}\s*from\s*['\"]\.\/sim\.js['\"]", t, re.S)
        if m:
            names = [x.strip() for x in m.group(1).split(",") if x.strip()]
            print(f"\n{p.name} imports:", names)
            missing = [n for n in names if f"function {n}" not in sim and f"const {n}" not in sim and f"let {n}" not in sim and f"class {n}" not in sim and f"export function {n}" not in sim and f"export {{ {n}" not in sim]
            # also export { a, b }
            print("  missing from recovered:", missing)
