import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
json_path = os.path.join(ROOT, "docs", "probe_textures_textures.json")

with open(json_path, "r", encoding="utf-8") as f:
    d = json.load(f)

print(f"Total Textures Analyzed: {len(d)}\n")
print(f"{'Texture Name':<28} | {'Total':<5} | {'Fills':<5} | {'Strokes':<7} | {'Sample Colors / Widths'}")
print("-" * 80)

for k in sorted(d.keys()):
    v = d[k]
    fills = [x for x in v if x["a"] == "fill"]
    strokes = [x for x in v if x["a"] == "stroke"]
    details = []
    if len(strokes) > 0:
        widths = set(s.get("width") for s in strokes)
        details.append(f"stroke-w:{list(widths)}")
    if len(v) == 0:
        details.append("EMPTY! (0 instructions)")
    print(f"{k:<28} | {len(v):<5} | {len(fills):<5} | {len(strokes):<7} | {', '.join(details)}")
