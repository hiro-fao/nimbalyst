# Nimbalyst 日本語化実装ガイド (Japanese Localization Guide)

このドキュメントは、Nimbalyst の UI を日本語化するための実装手順とタスク管理をまとめたものです。

## 1. 目的
ユーザーが設定画面を含むアプリケーションの主要な UI を日本語で利用できるようにし、非英語圏のユーザーにとっての導入障壁を下げる。

## 2. 実装アプローチ
- **翻訳基盤**: `i18next` および `react-i18next` を採用し、標準的な i18n ワークフローを構築する。
- **リソース管理**: `packages/electron/src/i18n/locales/ja/common.json` に翻訳辞書を集中管理し、コードと文言を分離する。
- **適用範囲**: 設定画面（`SettingsView`）を起点とし、段階的に他のパネル・メイン画面へ拡大する。
- **作業ブランチ**: `bilingual`（`main` は変更しない）。

## 3. 実装タスクリスト

### Phase 1: 翻訳基盤の導入 (Foundation)
- [x] `i18next` および `react-i18next` ライブラリの導入
- [x] `packages/electron/src/i18n/index.ts` の作成（初期化設定）
- [x] `packages/electron/src/renderer/App.tsx` への i18n インポート追加

### Phase 2: 翻訳リソースの構築 (Resources)
- [x] `packages/electron/src/i18n/locales/ja/common.json` の作成
- [x] 主要な設定項目の英語 → 日本語 翻訳マップの定義（継続的に追加中）

### Phase 3: UI の日本語化実装 (Implementation)

#### 設定画面（Settings）
- [x] `SettingsView.tsx` のヘッダーおよびスコープ切替タブの翻訳
- [x] `SettingsSidebar.tsx` のグループ見出しおよびルートラベルの翻訳
- [x] Application グループ（通知・テーマ・ボイスモード・エージェント機能・詳細設定）
- [x] Agent Providers グループ（保存済みAPIキー・Claude・OpenAI Codex・OpenCode・GitHub Copilot・Grok Build・Cursor・Gemini）
- [x] Chat Providers グループ（Claude Chat・OpenAI・LM Studio）
- [x] Extensions グループ（Marketplace・Installed・Privileged Capabilities・Claude Plugins・MCP Servers一覧・Tools & Token Cost）
- [x] Account グループ（アカウント・モバイルアプリ・デバイス・共有リンク・QRペアリング）
- [x] Project グループ（Sharing・WorkspaceProjectSharingPanel本体・Agent Permissions・Trackers設定・AI Providers上書き）
- [ ] MCP サーバーの追加・編集フォーム内部（未着手）
- [ ] Project グループ内の GitHub タブ・Extensions タブ（未着手）

#### メインワークスペース画面
- [x] `WorkspaceWelcome.tsx`（ウェルカム画面: New file / Ask the agent カード）
- [x] `WorkspaceSidebar.tsx`（左ファイルパネル: セクションラベル・空状態・フィルター）
- [x] `WorkspaceSummaryHeader.tsx`
- [x] `NewFileDialog.tsx`（新規ファイル作成ダイアログ）
- [x] `HelpContent.ts`（左メニュー全アイコンのホバーツールチップ、47項目）
- [x] Tips: `TipCard.tsx` / `FilesEmptyTipDisplay.tsx`（共通UI）
- [x] Tips定義: `mobile-keep-awake.tsx` / `files-agent-context.tsx`（表示された2件のみ）
- [ ] Tips定義の残り約28件（`tips/definitions/` 配下、表示されたら都度対応 or 一括対応は要相談）
- [ ] `AllTipsDialog.tsx`（「すべてのヒント」一覧ダイアログ、着手直前で中断）
- [ ] タイトルバーの「New file」「New session」ボタン本体
- [ ] 左端の「DEV MODE」バッジ
- [ ] チャット入力欄のプレースホルダー

#### Tracker モード（大規模・未着手）
- [ ] `TrackerSidebar.tsx`（34KB、左パネルTYPES一覧）
- [ ] `TrackerMainView.tsx`（66KB、メインリスト・フィルター・ボタン類）
- [ ] `TrackerItemDetail.tsx`（94KB、項目詳細）
- [ ] `SessionKanbanBoard.tsx`（71KB）
- [ ] `TrackerGridView.tsx`（38KB）
- [ ] その他 `TrackerMode/` 配下 20ファイル以上
  - ※ Settings内の「Trackers」設定パネルとは別物。Trackerモード本体（画面全体）は規模が大きいため、着手前に進め方を相談する。

### Phase 4: 検証と調整 (Verification)
- [ ] ローカル環境での起動確認 (`npm run dev`)
- [ ] 日本語表示時のレイアウト崩れの修正
- [ ] 文言のニュアンス調整

## 4. 開発上の注意点
- **モノリポ構成**: 起動コマンドはルートではなく `packages/electron` フォルダ内で実行すること。
- **Node.js バージョン**: Node v24 以上を推奨。バージョン不一致によるエラー時は `--engine-strict=false` を検討すること。
- **キャッシュ**: 翻訳が反映されない場合は `node_modules/.vite` を削除して再起動すること。
- **HelpContent.ts のような静的データファイル**: React コンポーネントではないため `useTranslation` フックが使えない。`i18next.t()` をモジュールスコープで直接呼び出す方式を採用（`TeamBetaNotice.tsx` の `TEAM_BETA_TOOLTIP` も同様）。
- **見落としやすいパターン**: 「親パネルは翻訳したが、実際に描画している子コンポーネントを見落とす」ケースが複数回発生した（`ProjectSharingPanel.tsx` → `WorkspaceProjectSharingPanel.tsx`、`TrackerConfigPanel.tsx` → `trackerConfigUpgrade.ts` / `LocalKeyPrefixInput.tsx`）。表示確認は画面上のテキストで行い、ソース側は呼び出しチェーンを一段掘って確認すること。
