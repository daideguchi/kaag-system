// Database types
export type KnowledgeSourceType = 'text' | 'url' | 'file' | 'directory' | 'google_drive' | 'notion' | 'browser'
export type ArticleType = 'tech' | 'idea' | 'personal'
export type ArticleStatus = 'draft' | 'published' | 'scheduled'
export type LogAction = 'created' | 'updated' | 'published' | 'github_pushed'
export type LogStatus = 'success' | 'error' | 'pending'

// API types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Knowledge types
export interface KnowledgeData {
  id: string
  title: string
  content: string
  source_type: 'notion' | 'file' | 'text' | 'url' | 'browser'
  source_url?: string
  category: string
  tags?: string
  status: KnowledgeStatus
  ai_analysis?: string
  generated_article?: string
  published_article?: string
  
  // ブラウザベース入力用フィールド
  description?: string
  urls?: string
  notes?: string
  priority: number
  is_public: boolean
  
  created_at: string
  updated_at: string
  notion_reference?: NotionReference
}

// Article types
export interface ArticleData {
  id?: string
  title: string
  content: string
  slug: string
  emoji?: string
  type: ArticleType
  topics?: string[]
  published: boolean
  publication_scheduled_at?: Date
  knowledge_id?: string
}

// Claude API types
export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
  id: string
  model: string
  role: 'assistant'
  stop_reason: string
  stop_sequence: null
  type: 'message'
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

// GitHub API types
export interface GitHubFileContent {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  content: string
  encoding: string
}

export interface GitHubCreateFileResponse {
  content: GitHubFileContent
  commit: {
    sha: string
    node_id: string
    url: string
    html_url: string
    author: {
      name: string
      email: string
      date: string
    }
    committer: {
      name: string
      email: string
      date: string
    }
    tree: {
      sha: string
      url: string
    }
    message: string
    parents: Array<{
      sha: string
      url: string
      html_url: string
    }>
  }
}

// UI types
export interface DashboardStats {
  totalKnowledge: number
  totalArticles: number
  publishedArticles: number
  scheduledArticles: number
  todayArticles: number
}

// Form types
export interface KnowledgeFormData {
  title: string
  content: string
  source_type: KnowledgeSourceType
  source_url?: string
  category_id?: string
  tags: string[]
}

export interface ArticleFormData {
  title: string
  content: string
  emoji?: string
  type: ArticleType
  topics: string[]
  published: boolean
  publication_scheduled_at?: string
}

// Notion Knowledge Pipeline Types
export type KnowledgeStatus = 
  | 'draft'
  | 'notion_referenced' 
  | 'analyzed' 
  | 'generated' 
  | 'published'
  | 'error'

export interface NotionReference {
  page_id: string
  page_url: string
  page_title: string
  last_synced_at?: string
  notion_updated_at?: string
}

export interface ContentAnalysis {
  summary: string
  key_topics: string[]
  suggested_title: string
  estimated_article_length: number
  analysis_completed_at: string
}

export interface GeneratedArticle {
  title: string
  content: string
  emoji?: string
  type: 'tech' | 'idea' | 'personal'
  topics: string[]
  generated_at: string
  word_count: number
}

// ブラウザナレッジ作成データ型
export interface BrowserKnowledgeCreateData {
  title: string
  content: string
  description?: string
  urls?: string[]
  notes?: string
  category: string
  tags?: string[]
  priority: number
  is_public: boolean
}

// ブラウザナレッジ更新データ型
export interface BrowserKnowledgeUpdateData extends Partial<BrowserKnowledgeCreateData> {
  id?: string
} 