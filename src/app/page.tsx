'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Brain, 
  Settings,
  Plus,
  ArrowRight,
  BookOpen,
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { useDashboard } from '@/hooks/useDashboard'

export default function Dashboard() {
  const { stats, activities, loading } = useDashboard()
  const [connectionStatus, setConnectionStatus] = useState({
    notion: false,
    claude: false,
    github: false
  })

  useEffect(() => {
    checkConnections()
  }, [])

  const checkConnections = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setConnectionStatus(data.connectionStatus || {})
      }
    } catch (error) {
      console.error('Failed to check connections:', error)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  const hasAllConnections = connectionStatus.notion && connectionStatus.claude && connectionStatus.github

  return (
    <Layout>
      <div className="space-y-8">
        {/* ヘッダー */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">KAAG System</h1>
          <p className="text-lg text-gray-600">Knowledge Auto Article Generator</p>
        </div>

        {/* 接続状況の確認 */}
        {!hasAllConnections && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                セットアップが必要です
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-4">
                システムを使用するには、以下の連携設定が必要です：
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">Notion</span>
                  {connectionStatus.notion ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      接続済み
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      未接続
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">Claude AI</span>
                  {connectionStatus.claude ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      接続済み
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      未接続
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <span className="text-sm font-medium">GitHub</span>
                  {connectionStatus.github ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      接続済み
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      未接続
                    </Badge>
                  )}
                </div>
              </div>
              <Link href="/settings">
                <Button className="w-full md:w-auto">
                  <Settings className="h-4 w-4 mr-2" />
                  設定ページで連携する
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* 簡潔な統計 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-lg">ナレッジ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats?.totalKnowledge || 0}
              </div>
              <p className="text-sm text-gray-500">保存済み</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-lg">生成記事</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats?.articlesThisMonth || 0}
              </div>
              <p className="text-sm text-gray-500">AI生成済み</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-lg">公開記事</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats?.publishedArticles || 0}
              </div>
              <p className="text-sm text-gray-500">Zenn公開済み</p>
            </CardContent>
          </Card>
        </div>

        {/* メインアクション */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/knowledge">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  ナレッジ管理
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Notionページやブラウザ入力でナレッジを追加・管理
                </p>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  ナレッジを追加
                </Button>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/articles">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-green-600" />
                  記事生成
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  AIがナレッジからZenn記事を自動生成
                </p>
                <Button className="w-full" disabled={!hasAllConnections}>
                  <Brain className="h-4 w-4 mr-2" />
                  記事を生成
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* 最近のアクティビティ（簡潔版） */}
        {activities && activities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>最近のアクティビティ</span>
                <Link href="/analytics">
                  <Button variant="outline" size="sm">
                    詳細を見る
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.slice(0, 3).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 始め方ガイド（初回ユーザー向け） */}
        {(!stats?.totalKnowledge || stats.totalKnowledge === 0) && hasAllConnections && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">🚀 始め方</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</div>
                  <span className="text-blue-800">ナレッジ管理でNotionページやメモを追加</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</div>
                  <span className="text-blue-800">AIが自動でコンテンツを分析</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</div>
                  <span className="text-blue-800">Zenn記事を生成・公開</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
