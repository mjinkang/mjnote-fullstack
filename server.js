require('dotenv').config();
const express = require('express');
const path = require('path');

const aiRoutes = require('./src/routes/ai');
const lawRoutes = require('./src/routes/law');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' })); /* 파일 첨부(base64) 분석 대비 여유 있게 */
app.use('/api', aiRoutes);
app.use('/api', lawRoutes);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    lawOcConfigured: !!process.env.LAW_OC,
  });
});

app.listen(PORT, () => {
  console.log(`MJNote 서버 실행 중: http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY가 설정되지 않았습니다 — AI 분석 기능이 작동하지 않습니다.');
  }
  if (!process.env.LAW_OC) {
    console.warn('⚠️  LAW_OC가 설정되지 않았습니다 — 조문 정밀 링크가 검색결과 링크로만 동작합니다.');
  }
});
