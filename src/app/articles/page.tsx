'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useArticles } from '@/hooks/useArticles'
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
import { 
  Plus, 
  Search, 
  FileText, 
  Edit,
  Trash2,
  Eye,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Wand2,
  Github,
  ExternalLink
} from 'lucide-react'

interface Article {
  id: string
  title: string
  content: string
  slug: string
  emoji?: string
  type: 'tech' | 'idea' | 'personal'
  topics: string[]
  published: boolean
  publication_scheduled_at?: string
  published_at?: string
  github_pushed: boolean
  github_sha?: string
  zenn_url?: string
  knowledge_id?: string
  created_at: string
  updated_at: string
}

export default function ArticlesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [articleList, setArticleList] = useState<Article[]>([])
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)

  // 記事生成フォーム
  const [generateForm, setGenerateForm] = useState({
    knowledge_ids: [] as string[],
    article_type: 'tech' as const,
    target_length: 'medium',
    tone: 'professional',
    include_code: true,
    auto_publish: false,
    scheduled_date: ''
  })

  const handleGenerateArticle = async () => {
    // TODO: API実装
    console.log('Generating article:', generateForm)
    setIsGenerateDialogOpen(false)
  }

  const handlePublishArticle = async (articleId: string) => {
    // TODO: API実装
    console.log('Publishing article:', articleId)
  }

  const handleScheduleArticle = async (articleId: string, date: string) => {
    // TODO: API実装
    console.log('Scheduling article:', articleId, date)
  }

  const getStatusBadge = (article: Article) => {
    if (article.published) {
      return <Badge variant="default" className="bg-green-100 text-green-800">公開済み</Badge>
    }
    if (article.publication_scheduled_at) {
      return <Badge variant="outline" className="border-blue-500 text-blue-700">予約投稿</Badge>
    }
    return <Badge variant="secondary">下書き</Badge>
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'tech': return 'bg-blue-100 text-blue-800'
      case 'idea': return 'bg-purple-100 text-purple-800'
      case 'personal': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              記事管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              AIで生成した記事の管理と投稿を行います
            </p>
          </div>
          <div className="flex space-x-3">
            <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Wand2 className="h-4 w-4 mr-2" />
                  記事生成
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>AI記事生成</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">ナレッジ選択</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="記事生成に使用するナレッジを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="knowledge1">Next.js 14の新機能について</SelectItem>
                        <SelectItem value="knowledge2">TypeScript Tips集</SelectItem>
                        <SelectItem value="knowledge3">React Hooks解説</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">記事タイプ</label>
                      <Select value={generateForm.article_type} onValueChange={(value: any) => setGenerateForm({...generateForm, article_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tech">技術記事</SelectItem>
                          <SelectItem value="idea">アイデア</SelectItem>
                          <SelectItem value="personal">個人的な記録</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">記事の長さ</label>
                      <Select value={generateForm.target_length} onValueChange={(value) => setGenerateForm({...generateForm, target_length: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">短文 (500-800文字)</SelectItem>
                          <SelectItem value="medium">中文 (1000-1500文字)</SelectItem>
                          <SelectItem value="long">長文 (2000-3000文字)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">文体・トーン</label>
                    <Select value={generateForm.tone} onValueChange={(value) => setGenerateForm({...generateForm, tone: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">プロフェッショナル</SelectItem>
                        <SelectItem value="casual">カジュアル</SelectItem>
                        <SelectItem value="friendly">フレンドリー</SelectItem>
                        <SelectItem value="technical">技術的</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="include-code"
                        checked={generateForm.include_code}
                        onChange={(e) => setGenerateForm({...generateForm, include_code: e.target.checked})}
                      />
                      <label htmlFor="include-code" className="text-sm">コードサンプルを含める</label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="auto-publish"
                        checked={generateForm.auto_publish}
                        onChange={(e) => setGenerateForm({...generateForm, auto_publish: e.target.checked})}
                      />
                      <label htmlFor="auto-publish" className="text-sm">生成後に自動公開</label>
                    </div>
                  </div>
                  
                  {generateForm.auto_publish && (
                    <div>
                      <label className="text-sm font-medium">公開予定日時</label>
                      <Input 
                        type="datetime-local"
                        value={generateForm.scheduled_date}
                        onChange={(e) => setGenerateForm({...generateForm, scheduled_date: e.target.value})}
                      />
                    </div>
                  )}
                  
                  <Button onClick={handleGenerateArticle} className="w-full">
                    <Wand2 className="h-4 w-4 mr-2" />
                    記事を生成
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              手動作成
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="記事を検索..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="ステータスで絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="scheduled">予約投稿</SelectItem>
                  <SelectItem value="published">公開済み</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="space-y-4">
          {articleList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  記事がありません
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  最初の記事を生成してZennに投稿しましょう
                </p>
                <Button onClick={() => setIsGenerateDialogOpen(true)}>
                  <Wand2 className="h-4 w-4 mr-2" />
                  記事を生成
                </Button>
              </CardContent>
            </Card>
          ) : (
            // 記事リスト表示（実装時に展開）
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-600">記事の表示機能は実装中です</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総記事数</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{articleList.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">公開済み</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">予約投稿</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">下書き</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
} 