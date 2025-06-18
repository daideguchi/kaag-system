'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useKnowledge } from '@/hooks/useKnowledge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineStatus, PipelineProgress } from '@/components/ui/pipeline-status'
import { NotionReferenceCard } from '@/components/ui/notion-reference'
import { FileUploadCard } from '@/components/ui/file-upload'
import { BrowserKnowledgeCard } from '@/components/features/BrowserKnowledgeCard'
import { 
  Plus, 
  Search, 
  FileText, 
  FolderOpen,
  ExternalLink,
  Filter,
  Edit,
  Trash2,
  Download,
  Upload,
  Brain,
  Wand2,
  RefreshCw,
  Eye,
  Sparkles,
  BookOpen,
  Grid,
  Layout as LayoutIcon,
  List
} from 'lucide-react'
import { NotionPageSelector } from '@/components/features/NotionPageSelector'
import { NotionWorkspaceBrowser } from '@/components/features/NotionWorkspaceBrowser'
import type { KnowledgeData, KnowledgeStatus } from '@/types'

export default function KnowledgePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedKnowledge, setSelectedKnowledge] = useState<KnowledgeData | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedPage, setSelectedPage] = useState<any>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addMode, setAddMode] = useState<'notion' | 'workspace'>('notion')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const { 
    knowledge, 
    loading, 
    error, 
    createKnowledge, 
    updateKnowledge, 
    deleteKnowledge, 
    analyzeContent,
    generateArticle,
    publishArticle,
    refetch 
  } = useKnowledge({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    search: searchTerm || undefined
  })

  // データをソースタイプ別に分類
  const notionKnowledge = knowledge.filter(k => k.source_type === 'notion')
  const browserKnowledge = knowledge.filter(k => k.source_type === 'browser')
  const fileKnowledge = knowledge.filter(k => k.source_type === 'file')

  // 新規ナレッジ追加フォーム
  const [newKnowledge, setNewKnowledge] = useState({
    title: '',
    content: '',
    source_type: 'notion' as const,
    source_url: '',
    category: '',
    tags: [] as string[]
  })

  const handleAddNotionReference = async (url: string, notionPage?: any) => {
    try {
      await createKnowledge({
        title: notionPage?.title || 'Notionページ読み込み中...',
        content: notionPage?.content || '',
        source_type: 'notion',
        source_url: url,
        category: 'tech',
        tags: [],
        notion_reference: notionPage ? {
          page_id: notionPage.id,
          page_title: notionPage.title,
          page_url: notionPage.url,
          last_synced_at: new Date().toISOString(),
          notion_updated_at: notionPage.last_edited_time
        } : undefined
      })
    } catch (error) {
      console.error('Failed to add Notion reference:', error)
    }
  }

  const handleBrowserKnowledgeSave = async (data: any) => {
    try {
      if (data.id) {
        // 更新
        await updateKnowledge(data.id, data)
      } else {
        // 新規作成
        await createKnowledge({
          ...data,
          status: 'draft'
        })
      }
      refetch()
    } catch (error) {
      console.error('Failed to save browser knowledge:', error)
    }
  }

  const handleFileUpload = async (file: File, content: string) => {
    try {
      await createKnowledge({
        title: file.name.replace(/\.[^/.]+$/, ''), // 拡張子を除去
        content: content,
        source_type: 'file',
        source_url: file.name,
        category: 'tech',
        tags: []
      })
    } catch (error) {
      console.error('Failed to upload file:', error)
    }
  }

  const handleAnalyzeContent = async (knowledgeId: string) => {
    try {
      await analyzeContent(knowledgeId)
    } catch (error) {
      console.error('Failed to analyze content:', error)
    }
  }

  const handleGenerateArticle = async (knowledgeId: string) => {
    try {
      await generateArticle(knowledgeId)
    } catch (error) {
      console.error('Failed to generate article:', error)
    }
  }

  const handlePublishArticle = async (knowledgeId: string) => {
    try {
      await publishArticle(knowledgeId)
    } catch (error) {
      console.error('Failed to publish article:', error)
    }
  }

  const handleDeleteKnowledge = async (knowledgeId: string) => {
    try {
      await deleteKnowledge(knowledgeId)
      refetch()
    } catch (error) {
      console.error('Failed to delete knowledge:', error)
    }
  }

  const handleSyncNotion = async (pageId: string) => {
    try {
      // 対象のナレッジを取得
      const targetKnowledge = knowledge.find(k => k.notion_reference?.page_id === pageId)
      if (!targetKnowledge) {
        console.error('Knowledge not found for page ID:', pageId)
        return
      }

      // Notion APIから最新の内容を取得
      const response = await fetch('/api/notion/page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetKnowledge.notion_reference!.page_url }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Notion page')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to sync Notion page')
      }

      const notionPage = result.data

      // ナレッジを更新
      await updateKnowledge(targetKnowledge.id, {
        title: notionPage.title,
        content: notionPage.content,
        notion_reference: {
          ...targetKnowledge.notion_reference!,
          last_synced_at: new Date().toISOString(),
          notion_updated_at: notionPage.last_edited_time
        }
      })

      console.log('Notion page synced successfully')
    } catch (error) {
      console.error('Failed to sync Notion page:', error)
    }
  }

  const handleNotionPageSelect = async (page: any) => {
    setSelectedPage(page)
    setShowAddDialog(false)
    
    // 自動でナレッジ作成
    try {
      await handleAddNotionReference(page.url, page)
      refetch()
    } catch (error) {
      console.error('Failed to add selected Notion page:', error)
    }
  }

  const getStatusCounts = () => {
    const counts = {
      all: knowledge.length,
      draft: knowledge.filter(k => k.status === 'draft').length,
      notion_referenced: knowledge.filter(k => k.status === 'notion_referenced').length,
      analyzed: knowledge.filter(k => k.status === 'analyzed').length,
      generated: knowledge.filter(k => k.status === 'generated').length,
      published: knowledge.filter(k => k.status === 'published').length
    }
    return counts
  }

  const getCategoryCounts = () => {
    const counts = {
      all: knowledge.length,
      tech: knowledge.filter(k => k.category === 'tech').length,
      business: knowledge.filter(k => k.category === 'business').length,
      personal: knowledge.filter(k => k.category === 'personal').length,
      other: knowledge.filter(k => k.category === 'other').length
    }
    return counts
  }

  const filteredKnowledge = knowledge.filter(item => {
    const matchesSearch = !searchTerm || 
                         item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const statusCounts = getStatusCounts()
  const categoryCounts = getCategoryCounts()

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ナレッジ管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              記事生成の元となるナレッジを管理します
            </p>
          </div>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Notionから追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Notionページを直感的に選択
                </DialogTitle>
              </DialogHeader>
              
              <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'notion' | 'workspace')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notion" className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    検索で選択
                  </TabsTrigger>
                  <TabsTrigger value="workspace" className="flex items-center gap-2">
                    <Grid className="h-4 w-4" />
                    ワークスペースブラウザ
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="notion" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      ページタイトルで検索してNotionページを選択してください
                    </p>
                    <NotionPageSelector
                      onPageSelect={handleNotionPageSelect}
                      selectedPageId={selectedPage?.id}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="workspace" className="mt-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      ワークスペースを階層的に表示してページを選択してください
                    </p>
                    <NotionWorkspaceBrowser
                      onPageSelect={handleNotionPageSelect}
                      selectedPageId={selectedPage?.id}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ナレッジを検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="カテゴリ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="tech">技術</SelectItem>
                  <SelectItem value="business">ビジネス</SelectItem>
                  <SelectItem value="personal">個人</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステータス</SelectItem>
                  <SelectItem value="notion_referenced">Notion参照済み</SelectItem>
                  <SelectItem value="content_analyzed">内容分析済み</SelectItem>
                  <SelectItem value="article_generated">記事生成済み</SelectItem>
                  <SelectItem value="article_published">公開済み</SelectItem>
                  <SelectItem value="error">エラー</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge List */}
        <div className="space-y-4">
          {filteredKnowledge.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {knowledge.length === 0 ? 'ナレッジがありません' : '条件に一致するナレッジがありません'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  {knowledge.length === 0 
                    ? '最初のNotionページを参照して記事生成を始めましょう' 
                    : '検索条件やフィルターを変更してお試しください'
                  }
                </p>
                {knowledge.length === 0 && (
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Notionから追加
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Notionページからナレッジを追加
                        </DialogTitle>
                      </DialogHeader>
                      
                      <Tabs value={addMode} onValueChange={(v) => setAddMode(v as 'notion' | 'workspace')}>
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="notion" className="flex items-center gap-2">
                            <Search className="h-4 w-4" />
                            検索で選択
                          </TabsTrigger>
                          <TabsTrigger value="workspace" className="flex items-center gap-2">
                            <Grid className="h-4 w-4" />
                            ワークスペースブラウザ
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="notion" className="mt-4">
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                              ページタイトルで検索してNotionページを選択してください
                            </p>
                            <NotionPageSelector
                              onPageSelect={handleNotionPageSelect}
                              selectedPageId={selectedPage?.id}
                              trigger={
                                <Button variant="outline" className="w-full h-12 justify-start">
                                  <Search className="mr-2 h-4 w-4" />
                                  {selectedPage ? selectedPage.title : 'Notionページを検索...'}
                                </Button>
                              }
                            />
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="workspace" className="mt-4">
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                              ワークスペースを階層的に表示してページを選択してください
                            </p>
                            <NotionWorkspaceBrowser
                              onPageSelect={handleNotionPageSelect}
                              selectedPageId={selectedPage?.id}
                            />
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredKnowledge.map((knowledge) => (
              <Card key={knowledge.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {knowledge.title}
                        </h3>
                        <PipelineStatus status={knowledge.status} size="sm" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {knowledge.content.substring(0, 150)}...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>作成: {new Date(knowledge.created_at).toLocaleDateString('ja-JP')}</span>
                        {knowledge.notion_reference && (
                          <span>同期: {new Date(knowledge.notion_reference.last_synced_at || '').toLocaleDateString('ja-JP')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedKnowledge(knowledge)
                          setIsDetailDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {knowledge.notion_reference && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(knowledge.notion_reference!.page_url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Pipeline Progress */}
                  <div className="mb-4">
                    <PipelineProgress currentStatus={knowledge.status} showLabels={false} />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {knowledge.status === 'notion_referenced' && (
                      <Button
                        size="sm"
                        onClick={() => handleAnalyzeContent(knowledge.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        内容を分析
                      </Button>
                    )}
                    {knowledge.status === 'content_analyzed' && (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateArticle(knowledge.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        記事を生成
                      </Button>
                    )}
                    {knowledge.status === 'article_generated' && (
                      <Button
                        size="sm"
                        onClick={() => handlePublishArticle(knowledge.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        記事を公開
                      </Button>
                    )}
                    {knowledge.notion_reference && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncNotion(knowledge.notion_reference!.page_id)}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        同期
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add New Knowledge Source */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">ナレッジ管理</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="browser" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="browser">ブラウザ入力</TabsTrigger>
                <TabsTrigger value="notion">Notionページ</TabsTrigger>
                <TabsTrigger value="file">ローカルファイル</TabsTrigger>
              </TabsList>
              
              <TabsContent value="browser" className="mt-4">
                <div className={`gap-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}`}>
                  {/* 新規作成カード */}
                  <BrowserKnowledgeCard 
                    onSave={handleBrowserKnowledgeSave}
                  />
                  
                  {/* 既存のブラウザベースナレッジ */}
                  {browserKnowledge.map((knowledge) => (
                    <BrowserKnowledgeCard
                      key={knowledge.id}
                      knowledge={knowledge}
                      onSave={handleBrowserKnowledgeSave}
                      onDelete={handleDeleteKnowledge}
                      onAnalyze={handleAnalyzeContent}
                      onGenerateArticle={handleGenerateArticle}
                    />
                  ))}
                  
                  {browserKnowledge.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">ブラウザベースのナレッジがありません</p>
                      <p className="text-sm">
                        「新しいナレッジを追加」カードをクリックして、直接テキストやアイデアを入力してください
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="notion" className="mt-4">
                <div className="space-y-4">
                  <NotionReferenceCard onAddReference={handleAddNotionReference} />
                  
                  {/* 既存のNotionベースナレッジ */}
                  {notionKnowledge.length > 0 && (
                    <div className={`gap-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}`}>
                      {notionKnowledge.map((knowledge) => (
                        <Card key={knowledge.id} className="hover:shadow-md transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg mb-2">{knowledge.title}</CardTitle>
                                <div className="flex items-center space-x-2 mb-2">
                                  <Badge variant="outline">{knowledge.category}</Badge>
                                  <PipelineStatus status={knowledge.status} size="sm" />
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedKnowledge(knowledge)
                                    setIsDetailDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {knowledge.notion_reference && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(knowledge.notion_reference!.page_url, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <p className="text-sm text-gray-700 line-clamp-3">
                                {knowledge.content}
                              </p>
                              
                              <div className="flex space-x-2">
                                {knowledge.status === 'notion_referenced' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAnalyzeContent(knowledge.id)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                  >
                                    <Brain className="h-4 w-4 mr-2" />
                                    分析
                                  </Button>
                                )}
                                {knowledge.status === 'analyzed' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleGenerateArticle(knowledge.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    記事生成
                                  </Button>
                                )}
                                {knowledge.status === 'generated' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePublishArticle(knowledge.id)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    公開
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="mt-4">
                <div className="space-y-4">
                  <FileUploadCard onFileSelect={handleFileUpload} />
                  
                  {/* 既存のファイルベースナレッジ */}
                  {fileKnowledge.length > 0 && (
                    <div className={`gap-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}`}>
                      {fileKnowledge.map((knowledge) => (
                        <Card key={knowledge.id} className="hover:shadow-md transition-shadow">
                          <CardHeader>
                            <CardTitle className="text-lg">{knowledge.title}</CardTitle>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{knowledge.category}</Badge>
                              <PipelineStatus status={knowledge.status} size="sm" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                              {knowledge.content}
                            </p>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleAnalyzeContent(knowledge.id)}>
                                <Eye className="h-4 w-4 mr-1" />
                                分析
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeleteKnowledge(knowledge.id)}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                削除
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Notion参照済み</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{statusCounts.notion_referenced}</div>
              <p className="text-xs text-muted-foreground">参照されたページ</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">内容分析済み</CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{statusCounts.analyzed}</div>
              <p className="text-xs text-muted-foreground">AI分析完了</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">記事生成済み</CardTitle>
              <Wand2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{statusCounts.generated}</div>
              <p className="text-xs text-muted-foreground">記事作成完了</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">公開済み</CardTitle>
              <Upload className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{statusCounts.published}</div>
              <p className="text-xs text-muted-foreground">Zenn公開済み</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">総ナレッジ数</CardTitle>
              <ExternalLink className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{knowledge.length}</div>
              <p className="text-xs text-muted-foreground">全体の数</p>
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                {selectedKnowledge?.title}
                {selectedKnowledge && (
                  <PipelineStatus status={selectedKnowledge.status} size="sm" />
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedKnowledge && (
              <div className="space-y-6">
                {/* Pipeline Progress */}
                <div>
                  <h4 className="text-sm font-medium mb-3">進行状況</h4>
                  <PipelineProgress currentStatus={selectedKnowledge.status} />
                </div>

                {/* Notion Reference */}
                {selectedKnowledge.notion_reference && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Notion参照</h4>
                    <NotionReferenceCard 
                      reference={selectedKnowledge.notion_reference}
                      onSyncReference={handleSyncNotion}
                    />
                  </div>
                )}

                {/* Content Analysis */}
                {selectedKnowledge.content_analysis && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">内容分析結果</h4>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">要約</label>
                          <p className="text-sm">{selectedKnowledge.content_analysis.summary}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">キートピック</label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedKnowledge.content_analysis.key_topics.map((topic, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">推奨タイトル</label>
                          <p className="text-sm font-medium">{selectedKnowledge.content_analysis.suggested_title}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">推定記事長</label>
                          <p className="text-sm">{selectedKnowledge.content_analysis.estimated_article_length}文字</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Generated Article */}
                {selectedKnowledge.generated_article && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">生成された記事</h4>
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600">タイトル</label>
                          <p className="text-sm font-medium">{selectedKnowledge.generated_article.title}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">絵文字</label>
                          <p className="text-lg">{selectedKnowledge.generated_article.emoji}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">記事タイプ</label>
                          <Badge variant="outline">{selectedKnowledge.generated_article.type}</Badge>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">文字数</label>
                          <p className="text-sm">{selectedKnowledge.generated_article.word_count}文字</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600">内容プレビュー</label>
                          <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                            {selectedKnowledge.generated_article.content.substring(0, 500)}...
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4 border-t">
                  {selectedKnowledge.status === 'notion_referenced' && (
                    <Button
                      onClick={() => handleAnalyzeContent(selectedKnowledge.id)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      内容を分析
                    </Button>
                  )}
                  {selectedKnowledge.status === 'content_analyzed' && (
                    <Button
                      onClick={() => handleGenerateArticle(selectedKnowledge.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      記事を生成
                    </Button>
                  )}
                  {selectedKnowledge.status === 'article_generated' && (
                    <Button
                      onClick={() => handlePublishArticle(selectedKnowledge.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      記事を公開
                    </Button>
                  )}
                  {selectedKnowledge.notion_reference && (
                    <Button
                      variant="outline"
                      onClick={() => handleSyncNotion(selectedKnowledge.notion_reference!.page_id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Notion同期
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  )
} 