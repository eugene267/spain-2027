// España 2027 일정표 댓글 저장소
// 구글 시트 > 확장 프로그램 > Apps Script 에 이 코드를 통째로 붙여넣고
// 배포 > 새 배포 > 웹 앱 (실행: 나, 액세스: 모든 사용자) 로 배포하세요.
// 코드를 고친 뒤에는 배포 관리 > 편집(연필) > 버전: 새 버전 > 배포 해야 반영됩니다.

const SHEET_NAME = '댓글';
const NAMES = ['세찬', '윤우', '준서', '유진'];
const MAX_TEXT = 500;
const MAX_TARGET = 150;
const MAX_LIST = 300;
const DAYS = ['13','14','15','16','17','18','19','20','21','22','23','24','25','26'];
const HEADER = ['시간', '이름', '날짜(1월)', '대상', '내용'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
  } else if (sh.getRange(1, 4).getValue() === '내용') {
    // 이전 버전(4열) 시트면 '대상' 열을 끼워 넣음
    sh.insertColumnBefore(4);
    sh.getRange(1, 1, 1, HEADER.length).setValues([HEADER]);
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
  const rows = sh.getRange(start, 1, last - start + 1, 5).getValues();
  const comments = rows
    .filter(r => r[1] && r[4])
    .map(r => ({
      t: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: String(r[1]),
      day: String(r[2] || ''),
      target: String(r[3] || '').replace(/^'/, ''),
      text: String(r[4]).replace(/^'/, '')
    }));
  return json_({ comments });
}

function doPost(e) {
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad json' }); }
  if (data.website) return json_({ ok: true }); // 스팸봇 함정 필드
  const name = String(data.name || '');
  if (NAMES.indexOf(name) < 0) return json_({ ok: false, error: 'name' });
  const text = clean_(data.text, MAX_TEXT);
  const target = clean_(data.target, MAX_TARGET);
  const day = DAYS.indexOf(String(data.day)) >= 0 ? String(data.day) : '';
  if (!text) return json_({ ok: false, error: 'empty' });

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    sheet_().appendRow([new Date(), name, day, target, text]);
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}
