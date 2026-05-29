/**
 * Google Calendar -> iPad Dashboard JSON
 *
 * 使い方:
 * 1. script.google.com で新規プロジェクトを作る
 * 2. このコードを貼り付ける
 * 3. SECRET_TOKEN を好きな長い文字列に変える
 * 4. デプロイ > 新しいデプロイ > ウェブアプリ
 *    - 次のユーザーとして実行: 自分
 *    - アクセスできるユーザー: 全員
 * 5. 発行されたURLの末尾に ?token=SECRET_TOKEN を付ける
 */

const SECRET_TOKEN = "CHANGE_THIS_TO_A_LONG_RANDOM_TEXT";

function doGet(e) {
  const token = e.parameter.token || "";
  if (token !== SECRET_TOKEN) {
    return jsonOutput({ error: "Unauthorized" });
  }

  const tz = Session.getScriptTimeZone() || "Asia/Tokyo";
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const calendar = CalendarApp.getDefaultCalendar();
  const events = calendar.getEvents(start, end).map(event => {
    const startTime = event.getStartTime();
    const endTime = event.getEndTime();

    return {
      title: event.getTitle(),
      start: Utilities.formatDate(startTime, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      end: Utilities.formatDate(endTime, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      allDay: event.isAllDayEvent()
    };
  });

  return jsonOutput({
    updatedAt: Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    events
  });
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
