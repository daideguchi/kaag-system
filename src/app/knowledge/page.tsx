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
  Plus, 
  Search, 
  FileText, 
  BookOpen, 
  AlertCircle,
  CheckCircle,
  Settings,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useKnowledge } from '@/hooks/useKnowledge'
import { BrowserKnowledgeCard } from '@/components/features/BrowserKnowledgeCard'

export default function KnowledgePage() {
  const { knowledge, loading, addKnowledge, updateKnowledge, deleteKnowledge } = useKnowledge()
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [notionConnected, setNotionConnected] = useState(false)
  const [checkingConnection, setCheckingConnection] = useState(true)
  
  const [newKnowledge, setNewKnowledge] = useState({
    title: '',
    description: '',
    content: '',
    tags: '',
    urls: '',
    priority: 5
  })

  useEffect(() => {
    checkNotionConnection()
  }, [])

  const checkNotionConnection = async () => {
    setCheckingConnection(true)
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setNotionConnected(data.connectionStatus?.notion || false)
      }
    } catch (error) {
      console.error('Failed to check Notion connection:', error)
    } finally {
      setCheckingConnection(false)
    }
  }

  const handleAddKnowledge = async () => {
    if (!newKnowledge.title.trim()) return

    try {
      await addKnowledge({
        ...newKnowledge,
        source_type: 'browser',
        tags: newKnowledge.tags ? JSON.stringify(newKnowledge.tags.split(',').map(tag => tag.trim())) : null,
        urls: newKnowledge.urls ? JSON.stringify(newKnowledge.urls.split(',').map(url => url.trim())) : null
      })
      
      setNewKnowledge({
        title: '',
        description: '',
        content: '',
        tags: '',
        urls: '',
        priority: 5
      })
      setShowAddForm(false)
    } catch (error) {
      console.error('Failed to add knowledge:', error)
    }
  }

  const filteredKnowledge = knowledge.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const browserKnowledge = filteredKnowledge.filter(item => item.source_type === 'browser')
  const notionKnowledge = filteredKnowledge.filter(item => item.source_type === 'notion')

  return (
    <Layout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ナレッジ管理</h1>
            <p className="text-gray-600 mt-1">知識とアイデアを整理・管理</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            新しいナレッジ
          </Button>
        </div>

        {/* 検索バー */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="ナレッジを検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notion連携状況 */}
        <Card className={notionConnected ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className={`h-5 w-5 ${notionConnected ? 'text-green-600' : 'text-orange-600'}`} />
                <div>
                  <h3 className={`font-medium ${notionConnected ? 'text-green-800' : 'text-orange-800'}`}>
                    Notion連携
                  </h3>
                  <p className={`text-sm ${notionConnected ? 'text-green-700' : 'text-orange-700'}`}>
                    {notionConnected 
                      ? 'Notionワークスペースと連携済み - ページを自動取得できます'
                      : 'Notionと連携していません - ページの自動取得を利用するには連携が必要です'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {checkingConnection ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                ) : notionConnected ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    接続済み
                  </Badge>
                ) : (
                  <>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      未接続
                    </Badge>
                    <Link href="/settings">
                      <Button size="sm">
                        <Settings className="h-3 w-3 mr-1" />
                        連携する
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 新規追加フォーム */}
        {showAddForm && (
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                新しいナレッジを追加
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">タイトル *</label>
                <Input
                  value={newKnowledge.title}
                  onChange={(e) => setNewKnowledge(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="ナレッジのタイトルを入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">説明</label>
                <Input
                  value={newKnowledge.description}
                  onChange={(e) => setNewKnowledge(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="短い説明を入力"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">内容 *</label>
                <Textarea
                  value={newKnowledge.content}
                  onChange={(e) => setNewKnowledge(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="ナレッジの詳細内容を入力"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">タグ</label>
                  <Input
                    value={newKnowledge.tags}
                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="タグ1, タグ2, タグ3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">関連URL</label>
                  <Input
                    value={newKnowledge.urls}
                    onChange={(e) => setNewKnowledge(prev => ({ ...prev, urls: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  キャンセル
                </Button>
                <Button 
                  onClick={handleAddKnowledge}
                  disabled={!newKnowledge.title.trim() || !newKnowledge.content.trim()}
                >
                  追加
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ナレッジ一覧 */}
        <div className="space-y-6">
          {/* ブラウザ入力ナレッジ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">ブラウザ入力</h2>
              <Badge variant="outline">{browserKnowledge.length}</Badge>
            </div>
            
            {browserKnowledge.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">まだブラウザ入力のナレッジがありません</p>
                  <p className="text-sm text-gray-400 mb-4">「新しいナレッジ」ボタンから追加してください</p>
                  <Button onClick={() => setShowAddForm(true)} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    最初のナレッジを追加
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {browserKnowledge.map((item) => (
                  <BrowserKnowledgeCard
                    key={item.id}
                    knowledge={item}
                    onUpdate={updateKnowledge}
                    onDelete={deleteKnowledge}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Notionナレッジ */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold">Notion連携</h2>
              <Badge variant="outline">{notionKnowledge.length}</Badge>
            </div>
            
            {!notionConnected ? (
              <Card className="border-dashed border-orange-200">
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                  <p className="text-orange-700 font-medium mb-2">Notion連携が必要です</p>
                  <p className="text-sm text-orange-600 mb-4">
                    Notionワークスペースと連携すると、ページを自動で取得・同期できます
                  </p>
                  <Link href="/settings">
                    <Button>
                      <Settings className="h-4 w-4 mr-2" />
                      今すぐ連携する
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : notionKnowledge.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">まだNotionページが取得されていません</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Notionでページを作成し、インテグレーションに権限を付与してください
                  </p>
                  <Button variant="outline" onClick={checkNotionConnection}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    再読み込み
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notionKnowledge.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {item.description && (
                        <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          Notion
                        </Badge>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          詳細
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 空の状態 */}
        {filteredKnowledge.length === 0 && searchTerm && (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">「{searchTerm}」に一致するナレッジが見つかりません</p>
              <p className="text-sm text-gray-400">検索条件を変更してみてください</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
} 