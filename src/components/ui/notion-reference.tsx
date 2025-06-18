import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react'
import type { NotionReference } from '@/types'
import { useNotion } from '@/hooks/useNotion'

interface NotionReferenceProps {
  reference?: NotionReference
  onAddReference?: (url: string, notionPage?: any) => void
  onSyncReference?: (pageId: string) => void
  loading?: boolean
}

export function NotionReferenceCard({ 
  reference, 
  onAddReference, 
  onSyncReference,
  loading = false 
}: NotionReferenceProps) {
  const [notionUrl, setNotionUrl] = useState('')
  const { fetchPageFromUrl, loading: notionLoading, error: notionError } = useNotion()

  const handleAddReference = async () => {
    if (notionUrl.trim() && onAddReference) {
      try {
        const notionPage = await fetchPageFromUrl(notionUrl.trim())
        if (notionPage) {
          onAddReference(notionUrl.trim(), notionPage)
          setNotionUrl('')
        }
      } catch (error) {
        console.error('Failed to fetch Notion page:', error)
      }
    }
  }

  const handleSync = () => {
    if (reference?.page_id && onSyncReference) {
      onSyncReference(reference.page_id)
    }
  }

  const isValidNotionUrl = (url: string) => {
    return url.includes('notion.so') || url.includes('notion.site')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未同期'
    return new Date(dateString).toLocaleString('ja-JP')
  }

  const getSyncStatus = () => {
    if (!reference) return null
    
    const lastSynced = reference.last_synced_at ? new Date(reference.last_synced_at) : null
    const notionUpdated = reference.notion_updated_at ? new Date(reference.notion_updated_at) : null
    
    if (!lastSynced) {
      return { status: 'never', label: '未同期', color: 'bg-gray-100 text-gray-800' }
    }
    
    if (notionUpdated && lastSynced < notionUpdated) {
      return { status: 'outdated', label: '更新が必要', color: 'bg-yellow-100 text-yellow-800' }
    }
    
    return { status: 'synced', label: '同期済み', color: 'bg-green-100 text-green-800' }
  }

  if (!reference) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <ExternalLink className="h-5 w-5 mr-2" />
            Notionページを参照
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Notion ページURL</label>
            <div className="flex space-x-2 mt-1">
              <Input
                value={notionUrl}
                onChange={(e) => setNotionUrl(e.target.value)}
                placeholder="https://notion.so/your-page-id"
                className={!isValidNotionUrl(notionUrl) && notionUrl ? 'border-red-300' : ''}
              />
              <Button 
                onClick={handleAddReference}
                disabled={!notionUrl.trim() || !isValidNotionUrl(notionUrl) || loading || notionLoading}
              >
                {(loading || notionLoading) ? <RefreshCw className="h-4 w-4 animate-spin" /> : '参照'}
              </Button>
            </div>
            {notionUrl && !isValidNotionUrl(notionUrl) && (
              <p className="text-xs text-red-600 mt-1">
                有効なNotionページURLを入力してください
              </p>
            )}
            {notionError && (
              <p className="text-xs text-red-600 mt-1">
                {notionError}
              </p>
            )}
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>使い方:</strong> NotionページのURLを入力すると、そのページの内容を取得してナレッジとして管理できます。
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const syncStatus = getSyncStatus()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center">
            <ExternalLink className="h-5 w-5 mr-2" />
            Notion参照
          </div>
          {syncStatus && (
            <Badge className={syncStatus.color}>
              {syncStatus.status === 'never' && <Clock className="h-3 w-3 mr-1" />}
              {syncStatus.status === 'outdated' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {syncStatus.status === 'synced' && <CheckCircle className="h-3 w-3 mr-1" />}
              {syncStatus.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600">ページタイトル</label>
          <p className="text-sm font-medium">{reference.page_title}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-600">ページURL</label>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-blue-600 truncate flex-1">{reference.page_url}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(reference.page_url, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-medium text-gray-600">最終同期</label>
            <p>{formatDate(reference.last_synced_at)}</p>
          </div>
          <div>
            <label className="font-medium text-gray-600">Notion更新日</label>
            <p>{formatDate(reference.notion_updated_at)}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            再同期
          </Button>
          
          {syncStatus?.status === 'outdated' && (
            <Button 
              size="sm" 
              onClick={handleSync}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              更新を取得
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 