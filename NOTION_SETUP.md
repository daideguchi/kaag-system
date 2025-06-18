# Notion 連携設定ガイド

## 概要

このガイドでは、KAAG システムと Notion を連携させるための手順を説明します。

## 前提条件

- Notion アカウントを持っていること
- Notion ワークスペースにアクセス権限があること

## 設定手順

### 1. Notion Integration の作成

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. 「New integration」をクリック
3. 必要情報を入力：
   - **Name**: `KAAG System`（任意の名前）
   - **Logo**: アップロード（任意）
   - **Associated workspace**: 使用するワークスペースを選択
4. 「Submit」をクリック

### 2. Integration Token の取得

1. 作成した Integration ページで「Secrets」セクションを確認
2. 「Internal Integration Token」をコピー
   - 形式: `secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Notion ページ・データベースへの権限付与

#### ページに権限を付与する場合：

1. Notion で使用したいページを開く
2. 右上の「Share」ボタンをクリック
3. 「Invite」セクションで作成した Integration（例：KAAG System）を検索
4. 権限レベルを選択（通常は「Can read」）
5. 「Invite」をクリック

#### データベースに権限を付与する場合：

1. Notion で使用したいデータベースを開く
2. 右上の「...」メニューをクリック
3. 「Connections」→「Connect to」を選択
4. 作成した Integration（例：KAAG System）を選択

### 4. KAAG システムでの設定

1. KAAG システムの設定ページ（`/settings`）にアクセス
2. 「API 設定」タブを選択
3. 「Notion API」セクションで以下を設定：
   - **Integration Token**: コピーしたトークンを貼り付け
4. 「テスト」ボタンをクリックして接続を確認
5. 「設定を保存」をクリック

### 5. 動作確認

1. 「接続状況」タブで Notion の状態を確認
2. 「接続 OK」が表示されれば設定完了
3. 「ナレッジ管理」ページで「Notion」タブから検索・取得をテスト

## トラブルシューティング

### よくあるエラーと対処法

#### 「API token is invalid」エラー

- **原因**: トークンが間違っているか期限切れ
- **対処**: トークンを再確認・再生成

#### 「object not found」エラー

- **原因**: ページ・データベースに Integration の権限がない
- **対処**: 権限付与手順を再実行

#### 「unauthorized」エラー

- **原因**: Integration がワークスペースに権限がない
- **対処**: Integration 設定でワークスペース権限を確認

### デバッグ方法

1. ブラウザの開発者ツールでネットワークタブを確認
2. API レスポンスのエラーメッセージを確認
3. Notion Integration ページで「Recent activity」を確認

## 制限事項

### API 制限

- **レート制限**: 1 秒あたり 3 リクエスト
- **ファイルサイズ**: 5MB 以下
- **リクエストサイズ**: 1000 件まで

### 対応コンテンツ

- ✅ テキストブロック
- ✅ 見出し（H1-H3）
- ✅ リスト（番号付き・箇条書き）
- ✅ コードブロック
- ✅ 引用
- ✅ 画像（URL）
- ❌ ファイル・動画
- ❌ データベース内の formula・relation

## セキュリティ

### トークン管理

- トークンは環境変数として安全に保存
- バージョン管理システムにコミットしない
- 定期的なトークンの更新を推奨

### 権限管理

- 必要最小限の権限のみ付与
- 使用しないページ・データベースへの権限は削除
- チーム利用時は個別の Integration を作成

## サポート

問題が解決しない場合：

1. このガイドの手順を再確認
2. [Notion API Documentation](https://developers.notion.com/) を参照
3. KAAG システムの設定ページでエラーメッセージを確認
