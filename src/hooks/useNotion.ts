import { useState, useCallback } from 'react'
import { NotionPage, NotionDatabase } from '@/lib/notion'

interface UseNotionReturn {
  // State
  pages: NotionPage[]
  databases: NotionDatabase[]
  currentPage: NotionPage | null
  loading: boolean
  error: string | null
  
  // Actions
  searchPages: (query: string) => Promise<NotionPage[]>
  fetchPageFromUrl: (url: string) => Promise<NotionPage | null>
  fetchDatabases: () => Promise<void>
  getDatabases: () => Promise<NotionDatabase[]>
  getPageContent: (pageId: string) => Promise<string>
  testConnection: () => Promise<boolean>
  clearError: () => void
}

export function useNotion(): UseNotionReturn {
  const [pages, setPages] = useState<NotionPage[]>([])
  const [databases, setDatabases] = useState<NotionDatabase[]>([])
  const [currentPage, setCurrentPage] = useState<NotionPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const searchPages = useCallback(async (query: string): Promise<NotionPage[]> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/notion/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to search pages')
      }
      
      if (result.success) {
        const pagesData = result.data
        setPages(pagesData)
        return pagesData
      } else {
        throw new Error(result.error || 'Search failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Search pages error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getPageContent = useCallback(async (pageId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/notion/page/${pageId}/content`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to get page content')
      }
      
      if (result.success) {
        return result.data.content || ''
      } else {
        throw new Error(result.error || 'Failed to get content')
      }
    } catch (err) {
      console.error('Get page content error:', err)
      return ''
    }
  }, [])

  const getDatabases = useCallback(async (): Promise<NotionDatabase[]> => {
    try {
      const response = await fetch('/api/notion/databases')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch databases')
      }
      
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error || 'Fetch failed')
      }
    } catch (err) {
      console.error('Get databases error:', err)
      return []
    }
  }, [])

  const fetchPageFromUrl = useCallback(async (url: string): Promise<NotionPage | null> => {
    if (!url.trim()) return null
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notion/page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch page')
      }
      
      if (result.success) {
        setCurrentPage(result.data)
        return result.data
      } else {
        throw new Error(result.error || 'Fetch failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Fetch page error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDatabases = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notion/databases')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch databases')
      }
      
      if (result.success) {
        setDatabases(result.data)
      } else {
        throw new Error(result.error || 'Fetch failed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Fetch databases error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const testConnection = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/notion/test')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Connection test failed')
      }
      
      if (!result.connected) {
        setError(result.message || 'Connection failed')
      }
      
      return result.connected
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Connection test error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    // State
    pages,
    databases,
    currentPage,
    loading,
    error,
    
    // Actions
    searchPages,
    fetchPageFromUrl,
    fetchDatabases,
    getDatabases,
    getPageContent,
    testConnection,
    clearError,
  }
} 