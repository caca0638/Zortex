import glob
import re
import os

patterns = ['beginFill', 'drawCircle', 'lineStyle', 'endFill', 'drawRect', 'drawPolygon', 'drawEllipse', 'drawRoundedRect']

def count_patterns():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    index_path = os.path.join(base_dir, "index.html")
    with open(index_path, "r", encoding="utf-8", errors="ignore") as f:
        idx_content = f.read()

    js_files = glob.glob(os.path.join(base_dir, "js", "**", "*.js"), recursive=True)
    js_contents = []
    for jf in js_files:
        with open(jf, "r", encoding="utf-8", errors="ignore") as f:
            js_contents.append(f.read())

    print("=" * 65)
    print(f"{'Method':<18} | {'index.html':<12} | {'js/ (Diger)':<12} | {'TOPLAM':<12}")
    print("-" * 65)
    results = {}
    for p in patterns:
        rx = re.compile(r'\.' + p + r'\(')
        idx_c = len(rx.findall(idx_content))
        js_c = sum(len(rx.findall(jc)) for jc in js_contents)
        total = idx_c + js_c
        results[p] = (idx_c, js_c, total)
        print(f"{p:<18} | {idx_c:<12} | {js_c:<12} | {total:<12}")
    print("=" * 65)
    return results

if __name__ == "__main__":
    count_patterns()
