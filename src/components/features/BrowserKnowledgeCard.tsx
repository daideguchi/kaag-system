'use client'

import { useState } from 'react'
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
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Tag,
  Wand2,
  Eye,
  Star,
  Link,
  FileText,
  Calendar
} from 'lucide-react'

interface BrowserKnowledgeCardProps {
  knowledge?: {
    id: string
    title: string
    content: string
    description?: string
    urls?: string
    notes?: string
    category: string
    tags?: string
    priority: number
    is_public: boolean
    status: string
    created_at: string
    updated_at: string
  }
  onSave: (data: any) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  onGenerateArticle?: (id: string) => Promise<void>
  onAnalyze?: (id: string) => Promise<void>
  isEditing?: boolean
}

export function BrowserKnowledgeCard({ 
  knowledge, 
  onSave, 
  onDelete, 
  onGenerateArticle,
  onAnalyze,
  isEditing = false 
}: BrowserKnowledgeCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(isEditing)
  const [formData, setFormData] = useState({
    title: knowledge?.title || '',
    content: knowledge?.content || '',
    description: knowledge?.description || '',
    urls: knowledge?.urls ? JSON.parse(knowledge.urls) : [],
    notes: knowledge?.notes || '',
    category: knowledge?.category || 'tech',
    tags: knowledge?.tags ? JSON.parse(knowledge.tags) : [],
    priority: knowledge?.priority || 5,
    is_public: knowledge?.is_public || false
  })
  const [newTag, setNewTag] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const handleSave = async () => {
    try {
      await onSave({
        ...formData,
        urls: JSON.stringify(formData.urls),
        tags: JSON.stringify(formData.tags),
        source_type: 'browser'
      })
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Failed to save knowledge:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const addUrl = () => {
    if (newUrl.trim() && !formData.urls.includes(newUrl.trim())) {
      setFormData(prev => ({
        ...prev,
        urls: [...prev.urls, newUrl.trim()]
      }))
      setNewUrl('')
    }
  }

  const removeUrl = (urlToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      urls: prev.urls.filter(url => url !== urlToRemove)
    }))
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800'
    if (priority >= 6) return 'bg-orange-100 text-orange-800'
    if (priority >= 4) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'analyzed': return 'bg-blue-100 text-blue-800'
      case 'generated': return 'bg-purple-100 text-purple-800'
      case 'published': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!knowledge) {
    // 新規作成カード
    return (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogTrigger asChild>
          <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 cursor-pointer transition-colors">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Plus className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600 font-medium">新しいナレッジを追加</p>
              <p className="text-sm text-gray-500 mt-1">
                テキスト、URL、メモなどを直接入力
              </p>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新しいナレッジを作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">タイトル *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ナレッジのタイトルを入力"
              />
            </div>

            <div>
              <label className="text-sm font-medium">説明</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="短い説明を入力（省略可）"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">内容 *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="詳細な内容、メモ、考察などを入力"
                rows={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium">関連URL</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="URLを追加"
                  onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                />
                <Button onClick={addUrl} size="sm">追加</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.urls.map((url, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <Link className="h-3 w-3" />
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs truncate max-w-[120px]">
                      {url}
                    </a>
                    <button onClick={() => removeUrl(url)} className="ml-1 text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">追加メモ</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="その他のメモや補足情報"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">カテゴリ</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">テクノロジー</SelectItem>
                    <SelectItem value="business">ビジネス</SelectItem>
                    <SelectItem value="personal">個人</SelectItem>
                    <SelectItem value="other">その他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">優先度</label>
                <Select value={formData.priority.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">🔴 最高 (10)</SelectItem>
                    <SelectItem value="8">🟠 高 (8)</SelectItem>
                    <SelectItem value="5">🟡 中 (5)</SelectItem>
                    <SelectItem value="3">🟢 低 (3)</SelectItem>
                    <SelectItem value="1">⚪ 最低 (1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">タグ</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="タグを追加"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button onClick={addTag} size="sm">追加</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 text-red-500">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              />
              <label htmlFor="is_public" className="text-sm">公開設定</label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={!formData.title.trim() || !formData.content.trim()}>
                作成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // knowledgeが存在しない場合は何も表示しない
  if (!knowledge) {
    return null
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-1">{knowledge.title}</CardTitle>
            {knowledge.description && (
              <p className="text-sm text-gray-600 mb-2">{knowledge.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Badge className={getPriorityColor(knowledge.priority)}>
              <Star className="h-3 w-3 mr-1" />
              {knowledge.priority}
            </Badge>
            <Badge className={getStatusColor(knowledge.status)}>
              {knowledge.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline">{knowledge.category}</Badge>
          {knowledge.tags && JSON.parse(knowledge.tags).map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-700 line-clamp-3">
              {knowledge.content}
            </p>
          </div>

          {knowledge.urls && JSON.parse(knowledge.urls).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">関連URL</p>
              <div className="flex flex-wrap gap-1">
                {JSON.parse(knowledge.urls).slice(0, 2).map((url: string, index: number) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {new URL(url).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {new Date(knowledge.created_at).toLocaleDateString('ja-JP')}
            </div>
            {knowledge.is_public && (
              <Badge variant="outline" className="text-xs">公開</Badge>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-3 w-3 mr-1" />
              編集
            </Button>
            
            {knowledge.status === 'draft' && onAnalyze && (
              <Button size="sm" variant="outline" onClick={() => onAnalyze(knowledge.id)}>
                <Eye className="h-3 w-3 mr-1" />
                分析
              </Button>
            )}
            
            {(knowledge.status === 'analyzed' || knowledge.status === 'generated') && onGenerateArticle && (
              <Button size="sm" variant="outline" onClick={() => onGenerateArticle(knowledge.id)}>
                <Wand2 className="h-3 w-3 mr-1" />
                記事生成
              </Button>
            )}

            {onDelete && (
              <Button size="sm" variant="outline" onClick={() => onDelete(knowledge.id)}>
                <Trash2 className="h-3 w-3 mr-1" />
                削除
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* 編集ダイアログ */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ナレッジを編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* 編集フォーム（新規作成と同じ構成） */}
            <div>
              <label className="text-sm font-medium">タイトル *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ナレッジのタイトルを入力"
              />
            </div>

            <div>
              <label className="text-sm font-medium">説明</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="短い説明を入力（省略可）"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">内容 *</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="詳細な内容、メモ、考察などを入力"
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={handleSave} disabled={!formData.title.trim() || !formData.content.trim()}>
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
} 