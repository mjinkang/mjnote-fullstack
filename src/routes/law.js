const express = require('express');
const router = express.Router();

/* law.go.kr Open API — 법령명 → 현재 시행 중인 lsiSeq(법령일련번호) 조회.
   OC(발급받은 API 인증키)는 서버 환경변수로만 보관되어 클라이언트에 절대 노출되지 않는다.
   (기존 mjnote-law-proxy.js Cloudflare Worker와 동일한 로직 — 이제 별도 Worker 없이
   이 백엔드 서버 하나로 통합) */
const LAW_SEARCH_URL = 'http://www.law.go.kr/DRF/lawSearch.do';

function buildJoParams(jo, sub) {
  if (!jo) return null;
  const joNo = String(parseInt(jo, 10)).padStart(4, '0');
  const joBrNo = sub ? String(parseInt(sub, 10)).padStart(2, '0') : '00';
  return { joNo, joBrNo };
}

async function resolveLsiSeq(lawName, oc) {
  const url = `${LAW_SEARCH_URL}?OC=${encodeURIComponent(oc)}&target=law&type=JSON&query=${encodeURIComponent(lawName)}&display=20`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MJNote-Server/1.0' } });
  if (!res.ok) throw new Error('law.go.kr 검색 API 응답 오류: ' + res.status);

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('law.go.kr 응답 파싱 실패 (OC 값을 확인하세요)');
  }

  const list = (data.LawSearch && data.LawSearch.law) || [];
  const items = Array.isArray(list) ? list : [list];
  if (!items.length) throw new Error(`"${lawName}" 법령을 찾을 수 없습니다`);

  const exact = items.find((it) => (it['법령명한글'] || '').trim() === lawName && it['현행연혁코드'] === '현행');
  const current = items.find((it) => it['현행연혁코드'] === '현행');
  const picked = exact || current || items[0];

  return {
    lsiSeq: picked['법령일련번호'],
    efYd: picked['시행일자'],
    lawName: (picked['법령명한글'] || lawName).trim(),
  };
}

/* GET /api/law-resolve?law=법령명&jo=조문번호&sub=가지번호 */
router.get('/law-resolve', async (req, res) => {
  const oc = process.env.LAW_OC;
  if (!oc) {
    return res.status(500).json({ ok: false, error: 'LAW_OC가 서버에 설정되지 않았습니다. .env 파일을 확인하세요.' });
  }
  const lawName = (req.query.law || '').trim();
  const jo = req.query.jo;
  const sub = req.query.sub;
  if (!lawName) {
    return res.status(400).json({ ok: false, error: 'law 파라미터가 필요합니다' });
  }

  try {
    const { lsiSeq, efYd, lawName: resolvedName } = await Promise.race([
      resolveLsiSeq(lawName, oc),
      new Promise((_, reject) => setTimeout(() => reject(new Error('law.go.kr 응답 시간 초과')), 8000)),
    ]);
    if (!lsiSeq) {
      return res.status(404).json({ ok: false, error: `"${lawName}"의 lsiSeq를 확인할 수 없습니다` });
    }
    const joParams = buildJoParams(jo, sub);
    const url = joParams
      ? `https://www.law.go.kr/LSW/lsSideInfoP.do?lsiSeq=${lsiSeq}&joNo=${joParams.joNo}&joBrNo=${joParams.joBrNo}&docCls=jo&urlMode=lsScJoRltInfoR`
      : `https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=${lsiSeq}`;
    return res.json({ ok: true, url, lsiSeq, efYd, lawName: resolvedName });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e.message || e) });
  }
});

module.exports = router;
