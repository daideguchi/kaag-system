import { useState, useEffect } from 'react'
import { KnowledgeItem } from '@/types'

interface UseKnowledgeOptions {
  category?: string
  status?: string
  search?: string
}

export function useKnowledge(options: UseKnowledgeOptions = {}) {
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKnowledge = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.category) params.append('category', options.category)
      if (options.status) params.append('status', options.status)
      if (options.search) params.append('search', options.search)

      const response = await fetch(`/api/knowledge?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setKnowledge(result.data)
      } else {
        setError(result.error || 'Failed to fetch knowledge')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('useKnowledge fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const createKnowledge = async (data: {
    title: string
    content: string
    source_type: 'notion' | 'file'
    source_url?: string
    category?: string
    tags?: string[]
    notion_reference?: {
      page_id: string
      page_title: string
      page_url: string
      auto_sync_enabled?: boolean
      sync_frequency?: string
    }
  }) => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        setKnowledge(prev => [result.data, ...prev])
        return result.data
      } else {
        throw new Error(result.error || 'Failed to create knowledge')
      }
    } catch (err) {
      console.error('createKnowledge error:', err)
      throw err
    }
  }

  const updateKnowledge = async (id: string, data: {
    title?: string
    content?: string
    category?: string
    tags?: string[]
    status?: string
  }) => {
    try {
      const response = await fetch('/api/knowledge', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data })
      })

      const result = await response.json()

      if (result.success) {
        setKnowledge(prev => 
          prev.map(item => item.id === id ? result.data : item)
        )
        return result.data
      } else {
        throw new Error(result.error || 'Failed to update knowledge')
      }
    } catch (err) {
      console.error('updateKnowledge error:', err)
      throw err
    }
  }

  const analyzeContent = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge/${id}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        setKnowledge(prev => 
          prev.map(item => item.id === id ? result.data : item)
        )
        return result.data
      } else {
        throw new Error(result.error || 'Failed to analyze content')
      }
    } catch (err) {
      console.error('analyzeContent error:', err)
      throw err
    }
  }

  const generateArticle = async (id: string, options?: any) => {
    try {
      const response = await fetch(`/api/knowledge/${id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ options })
      })

      const result = await response.json()

      if (result.success) {
        setKnowledge(prev => 
          prev.map(item => item.id === id ? result.data.knowledge : item)
        )
        return result.data
      } else {
        throw new Error(result.error || 'Failed to generate article')
      }
    } catch (err) {
      console.error('generateArticle error:', err)
      throw err
    }
  }

  const publishArticle = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge/${id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (result.success) {
        setKnowledge(prev => 
          prev.map(item => item.id === id ? result.data.knowledge : item)
        )
        return result.data
      } else {
        throw new Error(result.error || 'Failed to publish article')
      }
    } catch (err) {
      console.error('publishArticle error:', err)
      throw err
    }
  }

  const deleteKnowledge = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setKnowledge(prev => prev.filter(item => item.id !== id))
      } else {
        throw new Error(result.error || 'Failed to delete knowledge')
      }
    } catch (err) {
      console.error('deleteKnowledge error:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchKnowledge()
  }, [options.category, options.status, options.search])

  return {
    knowledge,
    loading,
    error,
    refetch: fetchKnowledge,
    createKnowledge,
    updateKnowledge,
    deleteKnowledge,
    analyzeContent,
    generateArticle,
    publishArticle
  }
} 