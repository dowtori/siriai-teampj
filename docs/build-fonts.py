# -*- coding: utf-8 -*-
"""
문서 빌드 — 브랜드 폰트를 HTML 안에 직접 넣는다.

docs/<이름>/index.src.html  →  docs/<이름>/index.html

보는 사람 PC에 Pretendard 가 깔려 있든 아니든 같은 자소 폭과 자간으로
렌더되도록, 폰트 파일을 base64 로 문서에 심는다.
(아티팩트는 외부 폰트 CDN 을 막기 때문에 이 방법이 필요하다.)

    python docs/build-fonts.py
"""
import sys, io, base64, pathlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parents[1]
FONTS = ROOT / "prototype" / "public" / "fonts"
TARGETS = ["kickoff", "board", "deck"]
TOKEN = "/*__FONTFACES__*/"

FACES = [
    ("Pretendard", 400, "pretendard-400.woff2"),
    ("Pretendard", 500, "pretendard-500.woff2"),
    ("Pretendard", 700, "pretendard-700.woff2"),
    ("Inter Tight", "300 700", "inter-tight.woff2"),
]


def b64(p: pathlib.Path) -> str:
    data = p.read_bytes()
    if data[:4] != b"wOF2":
        raise SystemExit(f"[!] woff2 가 아닙니다: {p.name}")
    print(f"    {p.name:26s} {len(data)/1024:7.1f} KB")
    return base64.b64encode(data).decode("ascii")


def main():
    print("[1] 폰트 읽기")
    block = "\n".join(
        "@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
        "font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2')}"
        % (fam, w, b64(FONTS / f))
        for fam, w, f in FACES
    )

    print("\n[2] 문서 만들기")
    for t in TARGETS:
        src, out = ROOT / "docs" / t / "index.src.html", ROOT / "docs" / t / "index.html"
        if not src.exists():
            print(f"    건너뜀 (없음): docs/{t}/index.src.html")
            continue
        html = src.read_text(encoding="utf-8")
        if TOKEN not in html:
            raise SystemExit(f"[!] 플레이스홀더 {TOKEN} 가 없습니다: {src}")
        out.write_text(html.replace(TOKEN, block), encoding="utf-8")
        print(f"    docs/{t}/index.html   {out.stat().st_size/1024/1024:5.2f} MB")


if __name__ == "__main__":
    main()
