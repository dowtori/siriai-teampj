# -*- coding: utf-8 -*-
"""
data/db.local.json (실데이터) → data/db.json (배포용)

개인 식별정보만 바꾼다. 캠페인 · 금액 · 진행 수치는 그대로 둔다.
같은 사람은 항상 같은 가명이 되도록 해시로 고정한다.
"""
import sys, io, json, hashlib, pathlib

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "db.local.json"
OUT = ROOT / "data" / "db.json"

SURNAME = "김이박최정강조윤장임한오서신권황안송류전홍고문양손배"
GIVEN = ["서준", "하윤", "도윤", "서연", "지호", "지우", "예준", "하은", "시우", "수아",
         "주원", "지아", "건우", "다은", "우진", "채원", "선우", "유진", "연우", "소율"]

CITY = ["서울 강남구", "서울 마포구", "서울 성동구", "경기 성남시", "경기 고양시",
        "인천 연수구", "부산 해운대구", "대구 수성구", "광주 서구", "대전 유성구"]


def h(s: str, n: int) -> int:
    return int(hashlib.sha1(str(s).encode()).hexdigest(), 16) % n


def fake_name(seed: str) -> str:
    return SURNAME[h(seed + "s", len(SURNAME))] + GIVEN[h(seed + "g", len(GIVEN))]


def fake_phone(seed: str) -> str:
    return f"010-{h(seed + 'p', 9000) + 1000}-{h(seed + 'q', 9000) + 1000}"


def fake_addr(seed: str) -> str:
    return f"{CITY[h(seed + 'c', len(CITY))]} ○○로 {h(seed + 'n', 90) + 10}"


def main():
    if not SRC.exists():
        raise SystemExit(f"[!] 원본이 없습니다: {SRC}\n    먼저 scripts/migrate.py 를 돌리세요.")

    db = json.loads(SRC.read_text(encoding="utf-8"))
    n = 0
    for p in db["participations"]:
        pii = p["pii"]
        seed = p["id"]
        if pii.get("realName"):
            pii["realName"] = fake_name(seed); n += 1
        if pii.get("phone"):
            pii["phone"] = fake_phone(seed)
        if pii.get("address"):
            pii["address"] = fake_addr(seed)

    db["meta"]["anonymized"] = True
    db["meta"]["note"] = "배포용 — 실명 · 연락처 · 주소는 가명으로 바꾼 데이터입니다."

    OUT.write_text(json.dumps(db, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"개인정보 {n}건 가명 처리")
    print(f"→ {OUT}  ({OUT.stat().st_size / 1024:.0f} KB)")
    print("\n캠페인 · 금액 · 진행 수치는 그대로입니다.")


if __name__ == "__main__":
    main()
