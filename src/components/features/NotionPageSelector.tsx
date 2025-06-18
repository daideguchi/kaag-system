'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  FileText, 
  Database, 
  Calendar, 
  CheckCircle, 
  Clock, 
  User,
  Tag,
  ExternalLink,
  Loader2,
  RefreshCw,
  BookOpen,
  Folder,
  Hash,
  Eye,
  Zap,
  ArrowRight,
  Sparkles,
  Brain,
  Target
} from 'lucide-react'
import { useNotion } from '@/hooks/useNotion'

interface NotionPage {
  id: string
  title: string
  url: string
  icon?: string
  cover?: string
  parent_type?: string
  parent_title?: string
  last_edited_time: string
  created_time: string
  properties?: any
  database_id?: string
  preview_content?: string
}

interface NotionDatabase {
  id: string
  title: string
  url: string
  icon?: string
  cover?: string
  description?: string
  properties: any
  created_time: string
  last_edited_time: string
}

interface NotionPageSelectorProps {
  onPageSelect: (page: NotionPage) => void
  trigger?: React.ReactNode
  selectedPageId?: string
}

export function NotionPageSelector({ onPageSelect, trigger, selectedPageId }: NotionPageSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('pages')
  const [pages, setPages] = useState<NotionPage[]>([])
  const [databases, setDatabases] = useState<NotionDatabase[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewPage, setPreviewPage] = useState<NotionPage | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [smartCategory, setSmartCategory] = useState<string>('')

  const { searchPages, getDatabases, testConnection, getPageContent } = useNotion()

  // Notionの接続テスト
  useEffect(() => {
    if (open) {
      checkConnection()
    }
  }, [open])

  // リアルタイム検索
  useEffect(() => {
    if (searchQuery.trim()) {
      const delayedSearch = setTimeout(() => {
        handleSearch()
      }, 300) // 300ms のデバウンス
      
      return () => clearTimeout(delayedSearch)
    } else {
      loadInitialData()
    }
  }, [searchQuery])

  const checkConnection = async () => {
    try {
      setLoading(true)
      setError(null)
      await testConnection()
      await loadInitialData()
    } catch (err) {
      setError('Notionとの接続に失敗しました。設定を確認してください。')
      console.error('Notion connection error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadInitialData = async () => {
    try {
      // 最近のページを取得
      const recentPages = await searchPages('')
      setPages(recentPages.slice(0, 20)) // 最初の20件

      // データベース一覧を取得
      const dbList = await getDatabases()
      setDatabases(dbList)
    } catch (err) {
      console.error('Failed to load initial data:', err)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadInitialData()
      return
    }

    try {
      setLoading(true)
      const results = await searchPages(searchQuery)
      setPages(results)
    } catch (err) {
      setError('検索に失敗しました')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ページプレビュー機能
  const handlePagePreview = async (page: NotionPage) => {
    try {
      setPreviewPage(page)
      
      // ページ内容を取得してプレビューに表示
      const content = await getPageContent(page.id)
      const pageWithContent = {
        ...page,
        preview_content: content.substring(0, 300) + (content.length > 300 ? '...' : '')
      }
      setPreviewPage(pageWithContent)
      
      // スマートカテゴリ判定
      const category = determineSmartCategory(page.title, content)
      setSmartCategory(category)
    } catch (err) {
      console.error('Failed to preview page:', err)
    }
  }

  // スマートカテゴリ判定ロジック
  const determineSmartCategory = (title: string, content: string): string => {
    const text = (title + ' ' + content).toLowerCase()
    
    if (text.includes('react') || text.includes('javascript') || text.includes('typescript') || text.includes('プログラミング')) {
      return 'tech'
    } else if (text.includes('デザイン') || text.includes('ui') || text.includes('ux')) {
      return 'design'
    } else if (text.includes('ビジネス') || text.includes('戦略') || text.includes('マーケティング')) {
      return 'business'
    } else if (text.includes('学習') || text.includes('勉強') || text.includes('教育')) {
      return 'education'
    } else {
      return 'general'
    }
  }

  // ワンクリック連携
  const handleQuickConnect = async (page: NotionPage) => {
    setIsConnecting(true)
    try {
      // ページ内容を取得
      const content = await getPageContent(page.id)
      const category = determineSmartCategory(page.title, content)
      
      const enhancedPage = {
        ...page,
        preview_content: content,
        smart_category: category
      }
      
      onPageSelect(enhancedPage)
      setOpen(false)
    } catch (err) {
      console.error('Failed to connect page:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPageIcon = (page: NotionPage) => {
    if (page.icon) return page.icon
    if (page.parent_type === 'database_id') return <Database className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getDatabaseIcon = (database: NotionDatabase) => {
    return database.icon || <Database className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      tech: 'bg-blue-100 text-blue-800',
      design: 'bg-purple-100 text-purple-800',
      business: 'bg-green-100 text-green-800',
      education: 'bg-orange-100 text-orange-800',
      general: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      tech: 'テクノロジー',
      design: 'デザイン',
      business: 'ビジネス',
      education: '教育',
      general: '一般'
    }
    return labels[category as keyof typeof labels] || '一般'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <Search className="h-4 w-4 mr-2" />
            Notionページを選択
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Notionページを直感的に選択
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
            <Button onClick={checkConnection} variant="outline" size="sm" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              再接続
            </Button>
          </div>
        )}

        <div className="flex-1 flex gap-4">
          {/* 左側: 検索とリスト */}
          <div className="w-1/2 flex flex-col">
            {/* 検索バー */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ページを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* タブ */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pages" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  ページ
                </TabsTrigger>
                <TabsTrigger value="databases" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  データベース
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pages" className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pages.map((page) => (
                      <Card 
                        key={page.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedPageId === page.id ? 'ring-2 ring-blue-500' : ''
                        } ${previewPage?.id === page.id ? 'bg-blue-50' : ''}`}
                        onClick={() => handlePagePreview(page)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getPageIcon(page)}
                                <h3 className="font-medium truncate">{page.title}</h3>
                              </div>
                              
                              {page.parent_title && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                  <Folder className="h-3 w-3" />
                                  {page.parent_title}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Clock className="h-3 w-3" />
                                {formatDate(page.last_edited_time)}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuickConnect(page)
                              }}
                              disabled={isConnecting}
                            >
                              {isConnecting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Zap className="h-4 w-4 mr-1" />
                                  連携
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="databases" className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {databases.map((database) => (
                    <Card key={database.id} className="cursor-pointer hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getDatabaseIcon(database)}
                          <h3 className="font-medium">{database.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{database.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(database.created_time)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 右側: プレビュー */}
          <div className="w-1/2 border-l pl-4">
            {previewPage ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getPageIcon(previewPage)}
                    <h2 className="text-lg font-semibold">{previewPage.title}</h2>
                  </div>
                  <Button
                    onClick={() => handleQuickConnect(previewPage)}
                    disabled={isConnecting}
                    className="flex items-center gap-2"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" />
                        連携する
                      </>
                    )}
                  </Button>
                </div>

                {smartCategory && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">スマートカテゴリ</span>
                    </div>
                    <Badge className={getCategoryColor(smartCategory)}>
                      {getCategoryLabel(smartCategory)}
                    </Badge>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        プレビュー
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm">
                        {previewPage.preview_content || 'コンテンツを読み込み中...'}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        詳細情報
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">作成日:</span>
                          <span>{formatDate(previewPage.created_time)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">更新日:</span>
                          <span>{formatDate(previewPage.last_edited_time)}</span>
                        </div>
                        {previewPage.parent_title && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">親:</span>
                            <span>{previewPage.parent_title}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>ページを選択してプレビューを表示</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 