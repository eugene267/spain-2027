// España 2027 일정표 댓글 저장소
// 구글 시트 > 확장 프로그램 > Apps Script 에 이 코드를 통째로 붙여넣고
// 배포 > 새 배포 > 웹 앱 (실행: 나, 액세스: 모든 사용자) 로 배포하세요.

const SHEET_NAME = '댓글';
const MAX_NAME = 20;
const MAX_TEXT = 500;
const MAX_LIST = 300;
const DAYS = ['13','14','15','16','17','18','19','20','21','22','23','24','25','26'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['시간', '닉네임', '날짜(1월)', '내용']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 시트 수식으로 해석되지 않게 막기
function clean_(s, max) {
  s = String(s || '').replace(/\r\n?/g, '\n').trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function doGet() {
  const sh = sheet_();
  const last = sh.getLastRow();
  if (last < 2) return json_({ comments: [] });
  const start = Math.max(2, last - MAX_LIST + 1);
  const rows = sh.getRange(start, 1, last - start + 1, 4).getValues();
  const comments = rows
    .filter(r => r[1] && r[3])
    .map(r => ({
      t: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]).replace(/^'/, ''),
      day: String(r[2] || ''),
      text: String(r[3]).replace(/^'/, '')
    }));
  return json_({ comments });
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad json' }); }
  if (data.website) return json_({ ok: true }); // 스팸봇 함정 필드
  const name = clean_(data.name, MAX_NAME);
  const text = clean_(data.text, MAX_TEXT);
  const day = DAYS.indexOf(String(data.day)) >= 0 ? String(data.day) : '';
  if (!name || !text) return json_({ ok: false, error: 'empty' });

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    sheet_().appendRow([new Date(), name, day, text]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}
