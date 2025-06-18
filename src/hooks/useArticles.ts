import { useState, useEffect } from 'react'

interface Article {
  id: string
  title: string
  content: string
  emoji: string
  type: 'tech' | 'idea'
  topics: string[]
  published: boolean
  metadata: any
  github_url?: string
  github_sha?: string
  published_at?: string
  created_at: string
  updated_at: string
  knowledge?: {
    id: string
    title: string
    category: string
  }
}

interface UseArticlesOptions {
  status?: string
  search?: string
}

export function useArticles(options: UseArticlesOptions = {}) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchArticles = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.status) params.append('status', options.status)
      if (options.search) params.append('search', options.search)

      const response = await fetch(`/api/articles?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setArticles(result.data)
      } else {
        setError(result.error || 'Failed to fetch articles')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('useArticles fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateArticle = async (id: string, data: {
    title?: string
    content?: string
    emoji?: string
    type?: 'tech' | 'idea'
    topics?: string[]
    published?: boolean
  }) => {
    try {
      const response = await fetch('/api/articles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data })
      })

      const result = await response.json()

      if (result.success) {
        setArticles(prev => 
          prev.map(item => item.id === id ? result.data : item)
        )
        return result.data
      } else {
        throw new Error(result.error || 'Failed to update article')
      }
    } catch (err) {
      console.error('updateArticle error:', err)
      throw err
    }
  }

  const deleteArticle = async (id: string) => {
    try {
      const response = await fetch(`/api/articles?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setArticles(prev => prev.filter(item => item.id !== id))
      } else {
        throw new Error(result.error || 'Failed to delete article')
      }
    } catch (err) {
      console.error('deleteArticle error:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [options.status, options.search])

  return {
    articles,
    loading,
    error,
    refetch: fetchArticles,
    updateArticle,
    deleteArticle
  }
} 