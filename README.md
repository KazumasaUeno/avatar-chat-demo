# avatar-chat-demo

ブラウザだけで動く「3D アバターと話す」デモです。

- 公開ページ: https://kazumasaueno.github.io/avatar-chat-demo/
- 文字を入力して送信すると、アバターが返事を読み上げ（ブラウザ内蔵の音声合成・日本語）、話している間だけ口が動きます。
- **返事は決まった文言です。AI にはつながっていません**（入力内容はどこにも送信されません）。
- `viewer.html` はアバターの表示確認用ページです（ドラッグで回転）。

## 使っているもの

- [three.js](https://threejs.org/) と [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)（CDN から読み込み）

## クレジット

アバター: VRoid Project「AvatarSample_A」(VRoid Hub ライセンス: 再配布・商用可)
