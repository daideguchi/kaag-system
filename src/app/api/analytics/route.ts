import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // 基本統計
    const totalKnowledge = await prisma.knowledge.count()
    
    // カテゴリ別統計
    const categoryStats = await prisma.category.findMany({
      include: {
        _count: {
          select: { knowledge: true }
        }
      }
    })

    // ソース別統計
    const sourceStats = await prisma.knowledge.groupBy({
      by: ['source_type'],
      _count: {
        source_type: true
      }
    })

    // 月別統計（過去6ヶ月）
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyStats = await prisma.knowledge.findMany({
      where: {
        created_at: {
          gte: sixMonthsAgo
        }
      },
      select: {
        created_at: true,
        source_type: true
      }
    })

    // 月別データの集計
    const monthlyData: { [key: string]: { notion: number; file: number; total: number } } = {}
    
    monthlyStats.forEach(item => {
      const month = item.created_at.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { notion: 0, file: 0, total: 0 }
      }
      monthlyData[month][item.source_type as 'notion' | 'file']++
      monthlyData[month].total++
    })

    // パフォーマンス指標
    const performanceMetrics = {
      totalKnowledge,
      avgKnowledgePerMonth: totalKnowledge / 6, // 暫定計算
      mostActiveCategory: categoryStats.reduce((prev, current) => 
        (prev._count.knowledge > current._count.knowledge) ? prev : current
      )?.name || 'なし',
      conversionRate: 0.85 // 暫定値（実際の記事生成率）
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalKnowledge,
          totalCategories: categoryStats.length,
          totalSources: sourceStats.length
        },
        categoryStats: categoryStats.map(cat => ({
          name: cat.name,
          count: cat._count.knowledge,
          percentage: Math.round((cat._count.knowledge / totalKnowledge) * 100)
        })),
        sourceStats: sourceStats.map(source => ({
          type: source.source_type,
          count: source._count.source_type,
          percentage: Math.round((source._count.source_type / totalKnowledge) * 100)
        })),
        monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
          month,
          ...data
        })).sort((a, b) => a.month.localeCompare(b.month)),
        performanceMetrics
      }
    })
  } catch (error) {
    console.error('GET /api/analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
} 