import { useState, useEffect } from 'react'

interface DashboardStats {
  totalKnowledge: number
  articlesThisMonth: number
  totalCategories: number
}

interface Activity {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  status: string
}

interface PerformanceData {
  date: string
  articles: number
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalKnowledge: 0,
    articlesThisMonth: 0,
    totalCategories: 0
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()

      if (result.success) {
        setStats(result.data.stats)
        setActivities(result.data.recentActivities)
        setPerformanceData(result.data.performanceData)
      } else {
        setError(result.error || 'Failed to fetch dashboard data')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('useDashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  return {
    stats,
    activities,
    performanceData,
    loading,
    error,
    refetch: fetchDashboardData
  }
} 