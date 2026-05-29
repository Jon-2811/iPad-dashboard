# iPad Desk Dashboard v2

第6世代iPadで使う想定の、無料・ブラウザベースの卓上ダッシュボードです。

## 追加した機能

- 好きな背景画像を設定可能
- 背景を少し薄く表示
- 背景に暗いオーバーレイを重ねて文字を読みやすくする
- 背景を少しぼかして文字の視認性を上げる
- ポモドーロタイマー追加
  - 25分作業
  - 5分休憩
  - 4セット後に15分休憩

## 入っている機能

- 時計
- 日付
- 天気
- 第121回医師国家試験までのカウントダウン
- ポモドーロタイマー
- 通常タイマー
- 簡易カレンダー表示
- YouTube Musicを開くボタン

## 背景画像の変え方

一番簡単な方法：

1. 好きな画像を `background.jpg` という名前にする
2. このフォルダ内に置く
3. ページを再読み込みする

別名にしたい場合は、`app.js` のここを変更します。

```js
backgroundImage: "background.jpg",
```

例：

```js
backgroundImage: "images/my-background.png",
```

## 背景の見やすさ調整

`app.js` のここを変更します。

```js
backgroundOpacity: 0.58,
backgroundBlurPx: 2,
```

おすすめ：

- 文字が見にくい → `backgroundOpacity` を 0.40〜0.50 に下げる
- 背景をもっとはっきり見せたい → `backgroundOpacity` を 0.65〜0.75 に上げる
- 背景がごちゃつく → `backgroundBlurPx` を 4〜6 に上げる

## ポモドーロ設定の変え方

`app.js` のここを変更します。

```js
pomodoro: {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  roundsBeforeLongBreak: 4
}
```

たとえば 50分作業・10分休憩にするなら：

```js
pomodoro: {
  workMinutes: 50,
  shortBreakMinutes: 10,
  longBreakMinutes: 20,
  roundsBeforeLongBreak: 3
}
```

## iPadでの使い方

1. GitHub Pages、Vercel、Cloudflare Pagesなどにアップロード
2. iPadのSafariでURLを開く
3. 共有ボタン → ホーム画面に追加
4. 横向きでスタンドに置く

## 注意

iPadでは、WebアプリからYouTube Musicの再生情報やジャケット画像を自由に取得するのは難しいです。
音楽はYouTube Musicアプリでバックグラウンド再生し、このダッシュボードは時計・予定・天気表示用として使うのが安定です。
