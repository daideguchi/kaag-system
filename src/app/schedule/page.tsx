'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  Calendar, 
  Clock,
  Play,
  Pause,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Settings,
  RefreshCw
} from 'lucide-react'
import { useScheduler } from '@/hooks/useScheduler'
import { ScheduleConfig } from '@/lib/scheduler'

export default function SchedulePage() {
  const { schedules, loading, error, createSchedule, updateSchedule, deleteSchedule, clearError } = useScheduler()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleConfig | null>(null)

  // 新規スケジュール追加フォーム
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    description: '',
    task_type: 'analyze_content' as const,
    cron_pattern: '0 9 * * *',
    enabled: true,
    filters: {
      category: '',
      source_type: '',
      status: '',
      tags: [] as string[]
    }
  })

  const handleAddSchedule = async () => {
    try {
      await createSchedule({
        name: newSchedule.name,
        description: newSchedule.description,
        task_type: newSchedule.task_type,
        cron_pattern: newSchedule.cron_pattern,
        enabled: newSchedule.enabled,
        filters: Object.keys(newSchedule.filters).some(key => {
          const value = newSchedule.filters[key as keyof typeof newSchedule.filters]
          return Array.isArray(value) ? value.length > 0 : value
        }) ? newSchedule.filters : undefined
      })
      
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create schedule:', error)
    }
  }

  const handleToggleSchedule = async (schedule: ScheduleConfig) => {
    try {
      await updateSchedule(schedule.id!, { enabled: !schedule.enabled })
    } catch (error) {
      console.error('Failed to toggle schedule:', error)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm('このスケジュールを削除しますか？')) {
      try {
        await deleteSchedule(scheduleId)
      } catch (error) {
        console.error('Failed to delete schedule:', error)
      }
    }
  }

  const resetForm = () => {
    setNewSchedule({
      name: '',
      description: '',
      task_type: 'analyze_content',
      cron_pattern: '0 9 * * *',
      enabled: true,
      filters: {
        category: '',
        source_type: '',
        status: '',
        tags: []
      }
    })
  }

  const getTaskTypeLabel = (taskType: string) => {
    const labels: {[key: string]: string} = {
      'analyze_content': 'コンテンツ分析',
      'generate_article': '記事生成',
      'publish_article': '記事公開',
      'sync_notion': 'Notion同期'
    }
    return labels[taskType] || taskType
  }

  const getStatusBadge = (schedule: ScheduleConfig) => {
    if (schedule.enabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800">有効</Badge>
    }
    return <Badge variant="secondary">無効</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未実行'
    const date = new Date(dateString)
    return date.toLocaleString('ja-JP')
  }

  const getCronPresets = () => [
    { label: '毎日 9:00', value: '0 9 * * *' },
    { label: '毎日 12:00', value: '0 12 * * *' },
    { label: '毎日 18:00', value: '0 18 * * *' },
    { label: '平日 9:00', value: '0 9 * * 1-5' },
    { label: '毎週月曜 9:00', value: '0 9 * * 1' },
    { label: '毎月1日 9:00', value: '0 9 1 * *' },
    { label: '毎時間', value: '0 * * * *' },
    { label: '30分毎', value: '*/30 * * * *' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              スケジュール管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              記事の自動生成・投稿スケジュールを管理します
            </p>
          </div>
          <div className="flex space-x-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  スケジュール追加
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>新しいスケジュールを追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">スケジュール名</label>
                    <Input
                      value={newSchedule.name}
                      onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                      placeholder="例: 毎日朝の記事投稿"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">頻度</label>
                    <Select value={newSchedule.frequency} onValueChange={(value) => setNewSchedule({...newSchedule, frequency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">毎日</SelectItem>
                        <SelectItem value="weekly">毎週</SelectItem>
                        <SelectItem value="monthly">毎月</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">時刻</label>
                    <Input
                      type="time"
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                    />
                  </div>
                  
                  {newSchedule.frequency === 'weekly' && (
                    <div>
                      <label className="text-sm font-medium">曜日</label>
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => {
                          const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
                          const dayKey = dayKeys[index]
                          const isSelected = newSchedule.days.includes(dayKey)
                          
                          return (
                            <Button
                              key={day}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const newDays = isSelected 
                                  ? newSchedule.days.filter(d => d !== dayKey)
                                  : [...newSchedule.days, dayKey]
                                setNewSchedule({...newSchedule, days: newDays})
                              }}
                            >
                              {day}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium">タイムゾーン</label>
                    <Select value={newSchedule.timezone} onValueChange={(value) => setNewSchedule({...newSchedule, timezone: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Cron式:</strong> {formatCronExpression(newSchedule.frequency, newSchedule.time, newSchedule.days)}
                    </p>
                  </div>
                  
                  <Button onClick={handleAddSchedule} className="w-full">
                    スケジュールを追加
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Active Schedules */}
        <div className="space-y-4">
          {scheduleList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  スケジュールがありません
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  最初のスケジュールを追加して自動投稿を始めましょう
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  スケジュールを追加
                </Button>
              </CardContent>
            </Card>
          ) : (
            // スケジュールリスト表示（実装時に展開）
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <p className="text-gray-600">スケジュールの表示機能は実装中です</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                クイック設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">毎日朝9時投稿</p>
                  <p className="text-sm text-gray-600">平日の朝に技術記事を自動投稿</p>
                </div>
                <Button size="sm">設定</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">週末まとめ投稿</p>
                  <p className="text-sm text-gray-600">日曜日に週のまとめ記事を投稿</p>
                </div>
                <Button size="sm" variant="outline">設定</Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">月次レポート</p>
                  <p className="text-sm text-gray-600">月初に活動レポートを投稿</p>
                </div>
                <Button size="sm" variant="outline">設定</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                次回実行予定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">毎日の記事生成</p>
                  <p className="text-xs text-gray-600">明日 9:00 AM</p>
                </div>
                <Badge variant="outline">アクティブ</Badge>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">週末まとめ</p>
                  <p className="text-xs text-gray-600">日曜日 8:00 PM</p>
                </div>
                <Badge variant="secondary">待機中</Badge>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">月次レポート</p>
                  <p className="text-xs text-gray-600">来月1日 10:00 AM</p>
                </div>
                <Badge variant="outline">予定</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総スケジュール数</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduleList.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">アクティブ</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日の実行</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">エラー</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
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