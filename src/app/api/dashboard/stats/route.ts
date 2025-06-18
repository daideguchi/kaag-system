import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // 基本統計の取得
    const totalKnowledge = await prisma.knowledge.count()
    const totalCategories = await prisma.category.count()
    
    // 今月の記事数（暫定的に全記事数を返す）
    const articlesThisMonth = totalKnowledge // TODO: 実際の記事生成機能実装後に修正

    // 最近のアクティビティ（最新10件のナレッジ）
    const recentActivities = await prisma.knowledge.findMany({
      take: 10,
      orderBy: {
        created_at: 'desc'
      }
    })

    // パフォーマンス統計（暫定データ）
    const performanceData = [
      { date: '2024-01', articles: Math.floor(totalKnowledge / 12) },
      { date: '2024-02', articles: Math.floor(totalKnowledge / 10) },
      { date: '2024-03', articles: Math.floor(totalKnowledge / 8) },
      { date: '2024-04', articles: Math.floor(totalKnowledge / 6) },
      { date: '2024-05', articles: Math.floor(totalKnowledge / 4) },
      { date: '2024-06', articles: Math.floor(totalKnowledge / 2) },
    ]

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalKnowledge,
          articlesThisMonth,
          totalCategories
        },
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          type: activity.source_type === 'notion' ? 'notion_sync' : 'file_upload',
          title: activity.title,
          description: `${activity.source_type === 'notion' ? 'Notion' : 'ファイル'}からナレッジを追加`,
          timestamp: activity.created_at.toISOString(),
          status: 'completed'
        })),
        performanceData
      }
    })
  } catch (error) {
    console.error('GET /api/dashboard/stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
} 