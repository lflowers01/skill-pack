"""Check that every quote in the dashboard data block appears word for word in the life-audit files.

Usage: python verify_quotes.py <path-to-life-audit>
A quote is any object with "text" and "sitting". Exits 1 and lists misses if any quote is not found.
Searches every .md file under life-audit/ except outputs/. Whitespace, case, and curly quotes are normalized.
"""
import json, os, re, sys


def norm(s):
    s = s.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", s).strip().lower()


def quotes(node):
    if isinstance(node, dict):
        if "text" in node and "sitting" in node:
            yield node["text"]
        for v in node.values():
            yield from quotes(v)
    elif isinstance(node, list):
        for v in node:
            yield from quotes(v)


def check(root):
    html = open(os.path.join(root, "outputs", "dashboard.html"), encoding="utf-8").read()
    m = re.search(r'<script id="data" type="application/json">(.*?)</script>', html, re.S)
    data = json.loads(m.group(1))
    corpus = []
    for d, _, files in os.walk(root):
        if os.path.relpath(d, root).split(os.sep)[0] == "outputs":
            continue
        for f in files:
            if f.endswith(".md"):
                corpus.append(norm(open(os.path.join(d, f), encoding="utf-8").read()))
    text = "\n".join(corpus)
    qs = list(quotes(data))
    return qs, [q for q in qs if norm(q) not in text]


if __name__ == "__main__":
    qs, missing = check(os.path.abspath(sys.argv[1]))
    for q in missing:
        print("NOT FOUND: " + q)
    print("%d quotes checked, %d not found" % (len(qs), len(missing)))
    sys.exit(1 if missing else 0)
