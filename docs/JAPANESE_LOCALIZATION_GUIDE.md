# Nimbalyst 日本語化実装ガイド (Japanese Localization Guide)

このドキュメントは、Nimbalyst の UI を日本語化するための実装手順とタスク管理をまとめたものです。

## 1. 目的
ユーザーが設定画面を含むアプリケーションの主要な UI を日本語で利用できるようにし、非英語圏のユーザーにとっての導入障壁を下げる。

## 2. 実装アプローチ
- **翻訳基盤**: `i18next` および `react-i18next` を採用し、標準的な i18n ワークフローを構築する。
- **リソース管理**: `packages/electron/src/i18n/locales/ja/common.json` に翻訳辞書を集中管理し、コードと文言を分離する。
- **適用範囲**: 設定画面（`SettingsView`）を起点とし、段階的に他のパネルへ拡大する。

## 3. 実装タスクリスト

### Phase 1: 翻訳基盤の導入 (Foundation)
- [ ] `i18next` および `react-i18next` ライブラリの導入
- [ ] `packages/electron/src/i18n/index.ts` の作成（初期化設定）
- [ ] `packages/electron/src/renderer/App.tsx` への i18n インポート追加

### Phase 2: 翻訳リソースの構築 (Resources)
- [ ] `packages/electron/src/i18n/locales/ja/common.json` の作成
- [ ] 主要な設定項目の英語 $\rightarrow$ 日本語 翻訳マップの定義

### Phase 3: UI の日本語化実装 (Implementation)
- [ ] `SettingsView.tsx` のヘッダーおよびスコープ切替タブの翻訳
- [ ] `SettingsSidebar.tsx` のグループ見出しおよびルートラベルの翻訳
- [ ] 各設定パネル（Claude, OpenAI, Gemini 等）の内部文言の翻訳

### Phase 4: 検証と調整 (Verification)
- [ ] ローカル環境での起動確認 (`npm run dev`)
- [ ] 日本語表示時のレイアウト崩れの修正
- [ ] 文言のニュアンス調整

## 4. 開発上の注意点
- **モノリポ構成**: 起動コマンドはルートではなく `packages/electron` フォルダ内で実行すること。
- **Node.js バージョン**: Node v24 以上を推奨。バージョン不一致によるエラー時は `--engine-strict=false` を検討すること。
- **キャッシュ**: 翻訳が反映されない場合は `node_modules/.vite` を削除して再起動すること。
