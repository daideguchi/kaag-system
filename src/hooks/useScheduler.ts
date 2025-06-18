import { useState, useEffect, useCallback } from 'react'
import { ScheduleConfig } from '@/lib/scheduler'

interface UseSchedulerReturn {
  // State
  schedules: ScheduleConfig[]
  loading: boolean
  error: string | null
  
  // Actions
  fetchSchedules: () => Promise<void>
  createSchedule: (config: Omit<ScheduleConfig, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateSchedule: (id: string, updates: Partial<ScheduleConfig>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  clearError: () => void
}

export function useScheduler(): UseSchedulerReturn {
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/schedules')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch schedules')
      }
      
      if (result.success) {
        setSchedules(result.data)
      } else {
        throw new Error(result.error || 'Fetch failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Fetch schedules error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createSchedule = useCallback(async (config: Omit<ScheduleConfig, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create schedule')
      }
      
      if (result.success) {
        setSchedules(prev => [result.data, ...prev])
      } else {
        throw new Error(result.error || 'Create failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Create schedule error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSchedule = useCallback(async (id: string, updates: Partial<ScheduleConfig>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update schedule')
      }
      
      if (result.success) {
        setSchedules(prev => 
          prev.map(schedule => 
            schedule.id === id ? result.data : schedule
          )
        )
      } else {
        throw new Error(result.error || 'Update failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Update schedule error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSchedule = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete schedule')
      }
      
      if (result.success) {
        setSchedules(prev => prev.filter(schedule => schedule.id !== id))
      } else {
        throw new Error(result.error || 'Delete failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Delete schedule error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 初期データの読み込み
  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  return {
    // State
    schedules,
    loading,
    error,
    
    // Actions
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    clearError,
  }
} 