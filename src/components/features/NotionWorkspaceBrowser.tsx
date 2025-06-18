'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  FileText, 
  Folder, 
  ChevronRight, 
  Clock, 
  User,
  Calendar,
  Loader2,
  RefreshCw
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

interface NotionWorkspaceBrowserProps {
  onPageSelect: (page: NotionPage) => void
}

export function NotionWorkspaceBrowser({ onPageSelect }: NotionWorkspaceBrowserProps) {
  const [databases, setDatabases] = useState<NotionDatabase[]>([])
  const [pages, setPages] = useState<NotionPage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)

  const { getDatabases, searchPages, testConnection } = useNotion()

  useEffect(() => {
    loadWorkspaceData()
  }, [])

  const loadWorkspaceData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 接続テスト
      await testConnection()
      
      // データベース一覧を取得
      const dbList = await getDatabases()
      setDatabases(dbList)
      
      // 最近のページを取得
      const recentPages = await searchPages('')
      setPages(recentPages.slice(0, 10))
      
    } catch (err) {
      setError('ワークスペースの読み込みに失敗しました')
      console.error('Workspace loading error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getIcon = (item: NotionPage | NotionDatabase) => {
    if (item.icon) return item.icon
    if ('database_id' in item) return <FileText className="h-4 w-4" />
    return <Database className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>ワークスペースを読み込み中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 mb-2">{error}</p>
        <Button onClick={loadWorkspaceData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          再読み込み
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* データベース一覧 */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Database className="h-5 w-5" />
          データベース
        </h3>
        <div className="grid gap-3">
          {databases.map((database) => (
            <Card key={database.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon(database)}
                    <div>
                      <h4 className="font-medium">{database.title}</h4>
                      {database.description && (
                        <p className="text-sm text-gray-600">{database.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(database.created_time)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 最近のページ */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          最近のページ
        </h3>
        <div className="grid gap-3">
          {pages.map((page) => (
            <Card 
              key={page.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onPageSelect(page)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getIcon(page)}
                    <div>
                      <h4 className="font-medium">{page.title}</h4>
                      {page.parent_title && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Folder className="h-3 w-3" />
                          {page.parent_title}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    選択
                  </Button>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(page.last_edited_time)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 