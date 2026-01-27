import re
import json
import math
import sys
from collections import Counter
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple

# 정규식 컴파일
SENT_SPLIT = re.compile(r'(?<=[.!?。？！])\s+|(?<=[다요죠]\.)\s+|[\n\r]+')
TOKEN = re.compile(r"[0-9A-Za-z가-힣]+")

# 한국어 조사를 대충 떼어내는 정규식 (형태소 분석기 없이 성능 향상용)
# 은,는,이,가,을,를,에,에서,로,으로,도,만,까지...
JOSA_PATTERN = re.compile(r"(은|는|이|가|을|를|에|에서|로|으로|도|만|까지|의)$")

SENSATIONAL = {
    "충격", "경악", "단독", "속보", "대반전", "논란", "발칵", "파장", "결국", "폭로", "초유", "전격"
}

def tokenize(text: str) -> List[str]:
    if not text:
        return []
    # 1. 기본 토큰화
    tokens = [t.lower() for t in TOKEN.findall(text)]
    # 2. 조사 제거 (간이 형태소 분석)
    refined = []
    for t in tokens:
        if len(t) > 1:
            t = JOSA_PATTERN.sub("", t)
        refined.append(t)
    return refined

def split_sentences(text: str) -> List[str]:
    if not text:
        return []
    parts = [p.strip() for p in SENT_SPLIT.split(text) if p and p.strip()]
    out = []
    for p in parts:
        if len(p) > 600:
            for i in range(0, len(p), 300):
                out.append(p[i:i+300].strip())
        else:
            out.append(p)
    return out

def cosine_counter(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0
    dot = 0.0
    for k, av in a.items():
        bv = b.get(k)
        if bv:
            dot += av * bv
    na = math.sqrt(sum(v*v for v in a.values()))
    nb = math.sqrt(sum(v*v for v in b.values()))
    if na == 0 or nb == 0:
        return 0.0
    return float(dot / (na * nb))

def jaccard(a: set, b: set) -> float:
    if not a or not b:
        return 0.0
    inter = len(a & b)
    uni = len(a | b)
    return inter / uni if uni else 0.0

@dataclass
class EvidenceRow:
    sent_idx: int
    summary_sent: str
    evidence_text: str
    score: float
    verdict: str

def best_evidence(summary_sent: str, content_sents: List[str]) -> Tuple[str, float]:
    s_tok = tokenize(summary_sent)
    if not s_tok:
        return "", 0.0

    s_cnt = Counter(s_tok)
    best_text = ""
    best_score = 0.0

    for c in content_sents:
        c_tok = tokenize(c)
        if not c_tok: continue
        c_cnt = Counter(c_tok)
        sim = cosine_counter(s_cnt, c_cnt)
        if sim > best_score:
            best_score = sim
            best_text = c

    return best_text, best_score

def verdict_from_score(sim: float) -> str:
    # 조사 제거 후에는 매칭율이 올라가므로 기준을 살짝 조정
    if sim >= 0.30: return "OK"    # 확실함
    if sim >= 0.15: return "WEAK"  # 애매함
    return "FAIL"                  # 근거 없음

def quality_score_and_flags(title: str, ai_summary: str, content: str, cross_source_count: int = 1) -> Tuple[int, List[str], str, List[EvidenceRow]]:
    flags = []

    # ★ [핵심 수정] 요약이 없으면 '제목'을 요약 대신 사용하여 본문을 검증함
    target_text = ai_summary
    if not target_text or not target_text.strip():
        target_text = title

    sum_sents = split_sentences(target_text)
    cont_sents = split_sentences(content)

    evidence_rows: List[EvidenceRow] = []
    ok_cnt = 0
    weak_cnt = 0

    # 검증 대상이 너무 짧으면(제목만 달랑) 본문 전체에서 증거 찾기
    for i, ss in enumerate(sum_sents):
        ev, sim = best_evidence(ss, cont_sents)
        vd = verdict_from_score(sim)

        # 제목으로 검증할 땐 기준을 조금 관대하게 (제목은 함축적이므로)
        if not ai_summary and vd == "FAIL" and sim >= 0.1:
            vd = "WEAK"

        if vd == "OK": ok_cnt += 1
        elif vd == "WEAK": weak_cnt += 1

        evidence_rows.append(EvidenceRow(i, ss, ev, sim, vd))

    total = max(1, len(sum_sents))
    ok_ratio = ok_cnt / total
    weak_ratio = weak_cnt / total
    fail_ratio = 1.0 - ok_ratio - weak_ratio

    # --- 플래그 계산 ---

    # 1. Title-Body Mismatch
    t_set = set(tokenize(title))
    c_set = set(tokenize(content))
    title_body_sim = jaccard(t_set, c_set)
    # 제목이 아주 짧으면 우연히 겹칠 수 있으니 길이 보정 없이 단순 체크
    if title_body_sim < 0.05 and len(content) > 100:
        flags.append("TITLE_BODY_MISMATCH")

    # 2. Sensational Check
    if any(w in title for w in SENSATIONAL):
        flags.append("SENSATIONAL_TITLE")

    # 3. Evidence Checks
    if ok_ratio < 0.4:
        flags.append("LOW_EVIDENCE")
    if fail_ratio >= 0.5: # 절반 이상이 헛소리면 문제
        flags.append("EVIDENCE_CONTRADICTION_OR_GAP")

    # 4. Cross Source
    if cross_source_count <= 1:
        flags.append("LOW_CROSS_SOURCE")

    # --- 점수 계산 (0~100) ---
    score = 100

    # 근거 부족 시 감점
    score -= int(50 * fail_ratio)
    score -= int(20 * max(0.0, 0.4 - ok_ratio))

    # 보너스
    score += min(15, (cross_source_count - 1) * 5)

    # 페널티
    if "TITLE_BODY_MISMATCH" in flags: score -= 20
    if "SENSATIONAL_TITLE" in flags: score -= 10
    if len(content) < 200: score -= 10 # 너무 짧은 본문

    score = max(0, min(100, score))

    # 배지
    if score >= 75 and "EVIDENCE_CONTRADICTION_OR_GAP" not in flags:
        badge = "✅"
    elif score >= 40:
        badge = "⚠️"
    else:
        badge = "❌"

    return score, flags, badge, evidence_rows

def run_one(item: Dict[str, Any]) -> Dict[str, Any]:
    title = item.get("title") or ""
    # camelCase, snake_case 모두 대응
    ai_summary = item.get("ai_summary") or item.get("aiSummary") or ""
    content = item.get("content") or ""

    # 숫자형 변환 안전장치
    try:
        cross = int(item.get("cross_source_count") or 1)
    except:
        cross = 1

    score, flags, badge, evid = quality_score_and_flags(title, ai_summary, content, cross)

    return {
        "news_id": item.get("id"),
        "quality_score": score,
        "risk_flags": flags,
        "badge": badge,
        # 로그 너무 길어지면 evidence 배열은 빼도 됨
        "evidence_summary": f"OK={len([e for e in evid if e.verdict=='OK'])}/{len(evid)}"
    }

if __name__ == "__main__":
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')

    input_str = sys.stdin.read().strip()
    if not input_str:
        print("[]")
        sys.exit(0)

    try:
        if input_str.startswith("["):
            data = json.loads(input_str)
            if isinstance(data, list):
                outs = [run_one(x) for x in data]
            else:
                outs = [run_one(data)]
        else:
            # JSONL 처리
            outs = []
            for line in input_str.splitlines():
                if line.strip():
                    outs.append(run_one(json.loads(line)))

        print(json.dumps(outs, ensure_ascii=False))

    except Exception as e:
        # 에러 나면 빈 리스트 반환해서 자바 터지는 거 방지
        # 실제로는 stderr에 로그 남기는 게 좋음
        sys.stderr.write(str(e))
        print("[]")