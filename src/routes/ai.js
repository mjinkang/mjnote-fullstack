const express = require('express');
const router = express.Router();

/* Gemini API 설정
   - 인증: x-goog-api-key 헤더 (GEMINI_API_KEY)
   - 엔드포인트: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
   - 모델은 .env의 GEMINI_MODEL로 바꿀 수 있음 (기본값: gemini-3.5-flash, 2026.7 기준 권장 모델)
   참고: https://ai.google.dev/gemini-api/docs/quickstart (2026.7 확인) */
const GEMINI_ENDPOINT_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-3.5-flash';

/* 클라이언트는 기존 코드 그대로 Anthropic 형식의 content 블록을 보낸다
   ({type:'text',text}, {type:'image',source:{type:'base64',media_type,data}}, {type:'document',...}).
   서버에서 이를 Gemini의 parts 형식({text} 또는 {inlineData:{mimeType,data}})으로 변환한다.
   문자열 prompt가 오면(첨부파일 없는 일반 검색) 그대로 텍스트 파트 하나로 취급한다. */
function toGeminiParts(prompt) {
  if (typeof prompt === 'string') {
    return [{ text: prompt }];
  }
  if (Array.isArray(prompt)) {
    return prompt.map((block) => {
      if (block.type === 'text') {
        return { text: block.text };
      }
      if ((block.type === 'image' || block.type === 'document') && block.source && block.source.type === 'base64') {
        return { inlineData: { mimeType: block.source.media_type, data: block.source.data } };
      }
      return { text: JSON.stringify(block) }; /* 알 수 없는 블록은 안전하게 텍스트로 폴백 */
    });
  }
  return [{ text: String(prompt || '') }];
}

async function callGemini(system, prompt, timeoutMs) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error('GEMINI_API_KEY가 서버에 설정되지 않았습니다. .env 파일을 확인하세요.'), { status: 500 });
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `${GEMINI_ENDPOINT_BASE}/${model}:generateContent`;

  const body = {
    contents: [{ role: 'user', parts: toGeminiParts(prompt) }],
  };
  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  const upstream = await Promise.race([
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Gemini API 응답 시간 초과(${timeoutMs / 1000}초)`)), timeoutMs)),
  ]);

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '');
    throw Object.assign(new Error(`Gemini API 오류 (${upstream.status}): ${errText.slice(0, 300)}`), { status: upstream.status });
  }

  const data = await upstream.json();
  const text =
    (data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts.map((p) => p.text || '').join('')) ||
    '';
  return text;
}

/* POST /api/ai-analyze
   body: { system: string, prompt: string | array }
   서버가 보관한 GEMINI_API_KEY로 Gemini API를 대신 호출한다.
   - 클라이언트에는 키가 전혀 노출되지 않는다.
   - Claude.ai 접속이나 로그인 없이도 어디서나(자체 도메인) 작동한다.
   - 45초 타임아웃으로 "영원히 로딩" 상태를 방지한다. */
router.post('/ai-analyze', async (req, res) => {
  const { system, prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'prompt가 필요합니다' });
  }
  try {
    const text = await callGemini(system, prompt, 45000);
    return res.json({ ok: true, text });
  } catch (e) {
    return res.status(e.status || 502).json({ ok: false, error: String(e.message || e) });
  }
});

module.exports = router;
