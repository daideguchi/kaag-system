# Notion OAuth 連携設定ガイド

KAAG System で Notion ワークスペースと OAuth 連携を行うための設定手順です。

## 1. Notion OAuth App の作成

### 1.1 Notion Developers にアクセス

1. [Notion Developers](https://developers.notion.com/) にアクセス
2. 右上の「Sign in」で Notion アカウントでログイン

### 1.2 OAuth App の作成

1. 「Create an integration」をクリック
2. 「Public integration」を選択
3. 以下の情報を入力：
   - **Name**: `KAAG System` (任意の名前)
   - **Logo**: 任意（省略可能）
   - **Description**: `Zenn記事自動生成システム`
   - **Company/Organization**: 任意
   - **Website**: `http://localhost:3000` (開発環境) / 本番 URL を入力

### 1.3 OAuth 設定

1. 「OAuth Domain & URIs」セクションで以下を設定：
   - **Redirect URIs**:
     - 開発環境: `http://localhost:3000/api/auth/notion/callback`
     - 本番環境: `https://your-domain.com/api/auth/notion/callback`

### 1.4 権限設定

1. 「Capabilities」セクションで以下を有効化：
   - ✅ Read content
   - ✅ Read user information including email addresses

## 2. 認証情報の取得

### 2.1 Client ID と Secret の取得

1. OAuth App の作成完了後、「Basic Information」タブから以下をコピー：
   - **Client ID** (例: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
   - **Client Secret** (例: `secret_abc123...`)

## 3. 環境変数の設定

### 3.1 .env ファイルの更新

```env
# Notion OAuth設定
NOTION_CLIENT_ID="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
NOTION_CLIENT_SECRET="secret_abc123..."
NOTION_REDIRECT_URI="http://localhost:3000/api/auth/notion/callback"
NEXTAUTH_URL="http://localhost:3000"
```

## 4. 連携の実行

### 4.1 システムでの連携

1. KAAG System の設定ページ (`/settings`) にアクセス
2. 「Notion 連携」セクションの「Notion と連携する」ボタンをクリック
3. Notion の認証画面でワークスペースを選択し、権限を承認
4. 連携完了後、自動的に設定ページにリダイレクト

### 4.2 連携の確認

- 設定ページの「連携状況」で ✅ が表示されることを確認
- ナレッジ管理ページで Notion ページの検索・取得が可能になります

## 5. トラブルシューティング

### 5.1 よくあるエラー

#### `invalid_client`

- Client ID または Client Secret が間違っている
- 環境変数の設定を再確認してください

#### `redirect_uri_mismatch`

- Redirect URI の設定が一致していない
- Notion Developers での設定と KAAG System の環境変数を確認

#### `access_denied`

- ユーザーが権限を拒否した
- 再度連携を試してください

### 5.2 権限エラー

連携後にページアクセスエラーが発生する場合：

1. Notion ワークスペースで対象ページを開く
2. 右上の「...」メニューから「Add connections」を選択
3. 作成した OAuth App を選択して権限を付与

## 6. セキュリティ考慮事項

### 6.1 本番環境での注意点

- HTTPS を使用してください
- Client Secret は絶対に公開しないでください
- 定期的にアクセストークンの有効性を確認してください

### 6.2 権限の最小化

- 必要最小限の権限のみを要求
- 不要になった OAuth App は削除してください

## 7. 参考資料

- [Notion Developers - Authorization](https://developers.notion.com/docs/authorization)
- [Notion OAuth Guide](https://developers.notion.com/docs/authorization#public-oauth-integration-flow)
