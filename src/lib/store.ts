import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { KnowledgeData, ArticleData, DashboardStats } from '@/types'

interface KnowledgeState {
  knowledge: KnowledgeData[]
  selectedKnowledge: KnowledgeData | null
  loading: boolean
  error: string | null
  
  // Actions
  setKnowledge: (knowledge: KnowledgeData[]) => void
  addKnowledge: (knowledge: KnowledgeData) => void
  updateKnowledge: (id: string, knowledge: Partial<KnowledgeData>) => void
  deleteKnowledge: (id: string) => void
  setSelectedKnowledge: (knowledge: KnowledgeData | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface ArticleState {
  articles: ArticleData[]
  selectedArticle: ArticleData | null
  loading: boolean
  error: string | null
  
  // Actions
  setArticles: (articles: ArticleData[]) => void
  addArticle: (article: ArticleData) => void
  updateArticle: (id: string, article: Partial<ArticleData>) => void
  deleteArticle: (id: string) => void
  setSelectedArticle: (article: ArticleData | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface DashboardState {
  stats: DashboardStats | null
  loading: boolean
  error: string | null
  
  // Actions
  setStats: (stats: DashboardStats) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface UIState {
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  
  // Actions
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark') => void
}

// Knowledge Store
export const useKnowledgeStore = create<KnowledgeState>()(
  devtools(
    (set) => ({
      knowledge: [],
      selectedKnowledge: null,
      loading: false,
      error: null,
      
      setKnowledge: (knowledge) => set({ knowledge }),
      addKnowledge: (newKnowledge) => 
        set((state) => ({ knowledge: [...state.knowledge, newKnowledge] })),
      updateKnowledge: (id, updatedKnowledge) =>
        set((state) => ({
          knowledge: state.knowledge.map((k) =>
            k.id === id ? { ...k, ...updatedKnowledge } : k
          ),
        })),
      deleteKnowledge: (id) =>
        set((state) => ({
          knowledge: state.knowledge.filter((k) => k.id !== id),
        })),
      setSelectedKnowledge: (knowledge) => set({ selectedKnowledge: knowledge }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'knowledge-store' }
  )
)

// Article Store
export const useArticleStore = create<ArticleState>()(
  devtools(
    (set) => ({
      articles: [],
      selectedArticle: null,
      loading: false,
      error: null,
      
      setArticles: (articles) => set({ articles }),
      addArticle: (newArticle) =>
        set((state) => ({ articles: [...state.articles, newArticle] })),
      updateArticle: (id, updatedArticle) =>
        set((state) => ({
          articles: state.articles.map((a) =>
            a.id === id ? { ...a, ...updatedArticle } : a
          ),
        })),
      deleteArticle: (id) =>
        set((state) => ({
          articles: state.articles.filter((a) => a.id !== id),
        })),
      setSelectedArticle: (article) => set({ selectedArticle: article }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'article-store' }
  )
)

// Dashboard Store
export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set) => ({
      stats: null,
      loading: false,
      error: null,
      
      setStats: (stats) => set({ stats }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    { name: 'dashboard-store' }
  )
)

// UI Store
export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'light',
        
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setTheme: (theme) => set({ theme }),
      }),
      { name: 'ui-store' }
    ),
    { name: 'ui-store' }
  )
) 