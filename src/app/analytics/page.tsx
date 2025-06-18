'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Calendar,
  Clock,
  Zap,
  DollarSign,
  Users,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const { overview, categoryStats, sourceStats, monthlyData, performanceMetrics, loading, error } = useAnalytics()
  
  // 実際のデータ（初期値）
  const stats = {
    totalArticles: overview.totalKnowledge,
    publishedArticles: overview.totalKnowledge,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    apiUsage: 0,
    apiLimit: 10000,
    avgGenerationTime: performanceMetrics.avgKnowledgePerMonth,
    successRate: performanceMetrics.conversionRate * 100
  }

  const recentArticlePerformance: any[] = []

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              アナリティクス
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              記事のパフォーマンスとシステムの使用状況を分析します
            </p>
          </div>
          <div className="flex space-x-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">過去7日</SelectItem>
                <SelectItem value="30d">過去30日</SelectItem>
                <SelectItem value="90d">過去90日</SelectItem>
                <SelectItem value="1y">過去1年</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              更新
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              エクスポート
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="articles">記事分析</TabsTrigger>
            <TabsTrigger value="performance">パフォーマンス</TabsTrigger>
            <TabsTrigger value="api">API使用量</TabsTrigger>
          </TabsList>

          {/* 概要タブ */}
          <TabsContent value="overview">
            <div className="space-y-6">
              {/* メイン統計 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総記事数</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalArticles}</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総ビュー数</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+25% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総いいね数</CardTitle>
                    <Heart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+18% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">総コメント数</CardTitle>
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalComments}</div>
                    <p className="text-xs text-muted-foreground">+8% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* カテゴリ別統計 */}
              <Card>
                <CardHeader>
                  <CardTitle>カテゴリ別記事数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryStats.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p>カテゴリ別データがありません</p>
                      </div>
                    ) : (
                      categoryStats.map((category) => (
                        <div key={category.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>{category.name}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">{category.count}記事</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${category.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{category.percentage}%</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 月別トレンド */}
              <Card>
                <CardHeader>
                  <CardTitle>月別記事投稿数</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-center space-x-2">
                    <div className="text-center text-gray-500">
                      <div className="text-sm mb-2">グラフ表示機能は実装予定です</div>
                      <BarChart3 className="h-12 w-12 mx-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 記事分析タブ */}
          <TabsContent value="articles">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>記事パフォーマンス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentArticlePerformance.map((article, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium">{article.title}</h3>
                          <p className="text-sm text-gray-600">公開日: {article.publishedAt}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{article.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Heart className="h-4 w-4 text-red-400" />
                            <span className="text-sm">{article.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4 text-blue-400" />
                            <span className="text-sm">{article.comments}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>人気記事トップ5</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentArticlePerformance.slice(0, 5).map((article, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{article.title}</p>
                            <p className="text-xs text-gray-600">{article.views.toLocaleString()} views</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>エンゲージメント率</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">いいね率</span>
                        <span className="text-sm font-medium">8.0%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">コメント率</span>
                        <span className="text-sm font-medium">2.9%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">シェア率</span>
                        <span className="text-sm font-medium">1.5%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">平均読了時間</span>
                        <span className="text-sm font-medium">3分25秒</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* パフォーマンスタブ */}
          <TabsContent value="performance">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">平均生成時間</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgGenerationTime}秒</div>
                    <p className="text-xs text-muted-foreground">-5% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">成功率</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.successRate}%</div>
                    <p className="text-xs text-muted-foreground">+2% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">システム稼働率</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">99.8%</div>
                    <p className="text-xs text-muted-foreground">+0.1% from last month</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>システムステータス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Claude API</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>GitHub API</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>データベース</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>スケジューラー</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">正常</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API使用量タブ */}
          <TabsContent value="api">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">API使用量</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.apiUsage.toLocaleString()} / {stats.apiLimit.toLocaleString()}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(stats.apiUsage / stats.apiLimit) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {((stats.apiUsage / stats.apiLimit) * 100).toFixed(1)}% 使用済み
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">推定コスト</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$24.50</div>
                    <p className="text-xs text-muted-foreground">今月の使用料金</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>日別API使用量</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-end justify-center space-x-2">
                    <div className="text-center text-gray-500">
                      <div className="text-sm mb-2">グラフ表示機能は実装予定です</div>
                      <BarChart3 className="h-12 w-12 mx-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API使用量の詳細</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>記事生成</span>
                      <span className="font-medium">6,200 requests</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>タイトル生成</span>
                      <span className="font-medium">1,850 requests</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>要約生成</span>
                      <span className="font-medium">700 requests</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="font-medium">合計</span>
                      <span className="font-bold">{stats.apiUsage.toLocaleString()} requests</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
} 