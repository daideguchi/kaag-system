import { useState, useEffect } from 'react'

interface AnalyticsOverview {
  totalKnowledge: number
  totalCategories: number
  totalSources: number
}

interface CategoryStat {
  name: string
  count: number
  percentage: number
}

interface SourceStat {
  type: string
  count: number
  percentage: number
}

interface MonthlyData {
  month: string
  notion: number
  file: number
  total: number
}

interface PerformanceMetrics {
  totalKnowledge: number
  avgKnowledgePerMonth: number
  mostActiveCategory: string
  conversionRate: number
}

export function useAnalytics() {
  const [overview, setOverview] = useState<AnalyticsOverview>({
    totalKnowledge: 0,
    totalCategories: 0,
    totalSources: 0
  })
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [sourceStats, setSourceStats] = useState<SourceStat[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalKnowledge: 0,
    avgKnowledgePerMonth: 0,
    mostActiveCategory: '',
    conversionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/analytics')
      const result = await response.json()

      if (result.success) {
        setOverview(result.data.overview)
        setCategoryStats(result.data.categoryStats)
        setSourceStats(result.data.sourceStats)
        setMonthlyData(result.data.monthlyData)
        setPerformanceMetrics(result.data.performanceMetrics)
      } else {
        setError(result.error || 'Failed to fetch analytics data')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('useAnalytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  return {
    overview,
    categoryStats,
    sourceStats,
    monthlyData,
    performanceMetrics,
    loading,
    error,
    refetch: fetchAnalyticsData
  }
} 