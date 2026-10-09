# avatar-chat-demo

ブラウザだけで動く「3D アバターと話す」デモです。

- 公開ページ: https://kazumasaueno.github.io/avatar-chat-demo/
- 文字を入力して送信すると、アバターが返事を読み上げ（ブラウザ内蔵の音声合成・日本語）、話している間だけ口が動きます。
- **返事は決まった文言です。AI にはつながっていません**（入力内容はどこにも送信されません）。
- 右上の歯車から、アバター（同梱 2 体／自分の VRM）・言語（日本語 / English）・声・話す速さ・背景色を変えられます。設定はこのブラウザにだけ保存され、読み込んだ VRM はどこにも送信しません。
- `viewer.html` はアバターの表示確認用ページです（ドラッグで回転）。

## 使っているもの

- [three.js](https://threejs.org/) と [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)（CDN から読み込み）

## クレジット

アバター: 「Rinka」（作者: E129 JR East、VRoid Hub ライセンス: 再配布・商用可・クレジット不要）
アバター: 「AvatarSample_A」（作者: VRoid Project、VRoid Hub ライセンス: 再配布・商用可・クレジット不要）
