'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { 
  Settings, 
  Key, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  ExternalLink,
  Github,
  BookOpen
} from 'lucide-react'

interface ConnectionStatus {
  notion: boolean | null
  claude: boolean | null
  github: boolean | null
}

interface APISettings {
  notion_token: string
  anthropic_api_key: string
  github_token: string
  github_owner: string
  github_repo: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<APISettings>({
    notion_token: '',
    anthropic_api_key: '',
    github_token: '',
    github_owner: '',
    github_repo: 'zenn-articles-auto'
  })
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    notion: null,
    claude: null,
    github: null
  })
  
  const [showTokens, setShowTokens] = useState({
    notion: false,
    claude: false,
    github: false
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 現在の設定を取得
  useEffect(() => {
    fetchCurrentSettings()
  }, [])

  const fetchCurrentSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
        setConnectionStatus(data.connectionStatus || connectionStatus)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '設定が保存されました' })
        // 保存後に接続テストを実行
        await testAllConnections()
      } else {
        throw new Error('保存に失敗しました')
      }
    } catch (error) {
      setMessage({ type: 'error', text: '設定の保存に失敗しました' })
    } finally {
      setIsSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const testConnection = async (service: 'notion' | 'claude' | 'github') => {
    setIsTesting(true)
    try {
      const response = await fetch(`/api/settings/test/${service}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      const result = await response.json()
      setConnectionStatus(prev => ({
        ...prev,
        [service]: result.success
      }))

      if (!result.success) {
        setMessage({ type: 'error', text: `${service}の接続テストに失敗しました: ${result.error}` })
      }
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        [service]: false
      }))
      setMessage({ type: 'error', text: `${service}の接続テストでエラーが発生しました` })
    } finally {
      setIsTesting(false)
    }
  }

  const testAllConnections = async () => {
    setIsTesting(true)
    await Promise.all([
      testConnection('notion'),
      testConnection('claude'),
      testConnection('github')
    ])
    setIsTesting(false)
  }

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="h-4 w-4 text-gray-400" />
    return status ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: boolean | null) => {
    if (status === null) return <Badge variant="outline">未テスト</Badge>
    return status ? 
      <Badge className="bg-green-100 text-green-800">接続OK</Badge> : 
      <Badge variant="destructive">接続NG</Badge>
  }

  const toggleTokenVisibility = (service: 'notion' | 'claude' | 'github') => {
    setShowTokens(prev => ({
      ...prev,
      [service]: !prev[service]
    }))
  }

  const maskToken = (token: string, show: boolean) => {
    if (!token) return ''
    if (show) return token
    return token.length > 8 ? `${token.substring(0, 4)}${'*'.repeat(token.length - 8)}${token.substring(token.length - 4)}` : '*'.repeat(token.length)
  }

  const createRepository = async () => {
    if (!settings.github_repo) {
      setMessage({ type: 'error', text: 'リポジトリ名を入力してください' })
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch('/api/github/create-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoName: settings.github_repo,
          description: `Zenn記事管理リポジトリ - KAAG Systemで自動生成`,
          isPrivate: false
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `リポジトリ「${result.data.name}」を作成しました！Zennとの連携設定を行ってください。` 
        })
        // 作成されたリポジトリのURLを開く
        window.open(result.data.html_url, '_blank')
      } else {
        setMessage({ type: 'error', text: result.error || 'リポジトリの作成に失敗しました' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'リポジトリ作成中にエラーが発生しました' })
    } finally {
      setIsTesting(false)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">設定</h1>
            <p className="text-gray-600 mt-2">API設定と接続状況を管理</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={testAllConnections} disabled={isTesting} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
              全体テスト
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '保存中...' : '設定を保存'}
            </Button>
          </div>
        </div>

        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="api-settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="api-settings">API設定</TabsTrigger>
            <TabsTrigger value="connection-status">接続状況</TabsTrigger>
          </TabsList>

          <TabsContent value="api-settings" className="space-y-6">
            {/* Notion設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Notion 連携
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">🔗 簡単連携</h4>
                  <p className="text-xs text-blue-700 mb-3">
                    ワンクリックでNotionワークスペースと連携できます。連携後は自動的にページやデータベースにアクセス可能になります。
                  </p>
                  <Button
                    onClick={() => window.location.href = '/api/auth/notion'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isTesting}
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Notionと連携する
                  </Button>
                </div>

                {/* 連携状況表示 */}
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">連携状況</span>
                    {getStatusIcon(connectionStatus.notion)}
                  </div>
                  {getStatusBadge(connectionStatus.notion)}
                  {connectionStatus.notion && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p>✅ ワークスペースとの連携が完了しています</p>
                      <p>📖 ページ・データベースの読み取り権限があります</p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">連携後の機能</h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• ページ・データベースの自動検索</li>
                    <li>• コンテンツの自動取得・同期</li>
                    <li>• 記事生成時の参照データとして活用</li>
                    <li>• リアルタイム更新の検知</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Claude設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Claude API (Anthropic)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">API Key</label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showTokens.claude ? 'text' : 'password'}
                        value={settings.anthropic_api_key}
                        onChange={(e) => setSettings(prev => ({ ...prev, anthropic_api_key: e.target.value }))}
                        placeholder="sk-ant-xxxxxxxxxxxxxxxx"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1"
                        onClick={() => toggleTokenVisibility('claude')}
                      >
                        {showTokens.claude ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => testConnection('claude')}
                      disabled={isTesting || !settings.anthropic_api_key}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    記事の分析・生成に使用されます
                  </p>
                </div>

                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Claude APIキーの取得方法</h4>
                  <ol className="text-xs text-purple-700 space-y-1 list-decimal list-inside">
                    <li><a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a>にアクセス</li>
                    <li>アカウントを作成またはログイン</li>
                    <li>「API Keys」セクションで新しいキーを作成</li>
                    <li>クレジット残高を確認し、必要に応じて追加</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* GitHub設定 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  GitHub API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Personal Access Token</label>
                  <div className="flex gap-2 mt-1">
                    <div className="relative flex-1">
                      <Input
                        type={showTokens.github ? 'text' : 'password'}
                        value={settings.github_token}
                        onChange={(e) => setSettings(prev => ({ ...prev, github_token: e.target.value }))}
                        placeholder="ghp_xxxxxxxxxxxxxxxx"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1"
                        onClick={() => toggleTokenVisibility('github')}
                      >
                        {showTokens.github ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => testConnection('github')}
                      disabled={isTesting || !settings.github_token}
                    >
                      <TestTube className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">GitHub Owner</label>
                    <Input
                      value={settings.github_owner}
                      onChange={(e) => setSettings(prev => ({ ...prev, github_owner: e.target.value }))}
                      placeholder="your-username"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Repository</label>
                    <div className="flex gap-2">
                      <Input
                        value={settings.github_repo}
                        onChange={(e) => setSettings(prev => ({ ...prev, github_repo: e.target.value }))}
                        placeholder="zenn-articles-auto"
                      />
                      <Button
                        variant="outline"
                        onClick={createRepository}
                        disabled={isTesting || !settings.github_token || !settings.github_repo}
                        title="リポジトリを作成"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">GitHubトークンの取得方法</h4>
                  <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                    <li>GitHubの「Settings」→「Developer settings」→「Personal access tokens」</li>
                    <li>「Generate new token (classic)」をクリック</li>
                    <li>「repo」スコープを選択</li>
                    <li>トークンを生成してコピー</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connection-status" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Notion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">接続状況</span>
                      {getStatusIcon(connectionStatus.notion)}
                    </div>
                    {getStatusBadge(connectionStatus.notion)}
                    <p className="text-xs text-gray-500 mt-2">
                      ページ・データベースの読み取り、検索機能
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Claude
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">接続状況</span>
                      {getStatusIcon(connectionStatus.claude)}
                    </div>
                    {getStatusBadge(connectionStatus.claude)}
                    <p className="text-xs text-gray-500 mt-2">
                      コンテンツ分析・記事生成機能
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    GitHub
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">接続状況</span>
                      {getStatusIcon(connectionStatus.github)}
                    </div>
                    {getStatusBadge(connectionStatus.github)}
                    <p className="text-xs text-gray-500 mt-2">
                      Zenn記事の自動公開機能
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 機能説明 */}
            <Card>
              <CardHeader>
                <CardTitle>システム機能の説明</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-blue-700 mb-2">📖 Notion連携</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• ページ・データベース検索</li>
                      <li>• コンテンツ自動取得</li>
                      <li>• リアルタイム同期</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-purple-700 mb-2">🤖 AI分析・生成</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• コンテンツ要約・分析</li>
                      <li>• Zenn記事フォーマット生成</li>
                      <li>• SEO最適化</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">🚀 自動公開</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• GitHubリポジトリ連携</li>
                      <li>• Zenn自動公開</li>
                      <li>• バージョン管理</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
} 