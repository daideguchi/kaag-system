import { PrismaClient } from '@prisma/client'
import { ClaudeAPI } from './claude'
import { GitHubAPI } from './github'
import crypto from 'crypto'

const prisma = new PrismaClient()

export interface ArticleGenerationOptions {
  maxConcurrent?: number
  maxRetries?: number
  duplicateThreshold?: number
}

export interface GenerationResult {
  success: boolean
  articleId?: string
  error?: string
  isDuplicate?: boolean
  processingTimeMs: number
}

export class ArticleGenerationQueueService {
  private claudeAPI: ClaudeAPI
  private githubAPI: GitHubAPI
  private processing: Set<string> = new Set()

  constructor() {
    this.claudeAPI = new ClaudeAPI()
    this.githubAPI = new GitHubAPI()
  }

  /**
   * キューを処理
   */
  async processQueue(options: ArticleGenerationOptions = {}): Promise<void> {
    const { maxConcurrent = 3, maxRetries = 3 } = options

    // 処理待ちのキューエントリを取得
    const queueEntries = await prisma.articleGenerationQueue.findMany({
      where: {
        status: 'pending',
        scheduled_at: {
          lte: new Date()
        },
        retry_count: {
          lt: maxRetries
        }
      },
      include: {
        knowledge: {
          include: {
            notion_reference: true
          }
        }
      },
      orderBy: [
        { priority: 'asc' }, // 優先度順
        { created_at: 'asc' } // 作成日時順
      ],
      take: maxConcurrent
    })

    if (queueEntries.length === 0) {
      console.log('No pending queue entries found')
      return
    }

    console.log(`Processing ${queueEntries.length} queue entries`)

    // 並列処理
    const processingPromises = queueEntries.map(async (entry) => {
      if (this.processing.has(entry.id)) {
        return // 既に処理中
      }

      this.processing.add(entry.id)
      
      try {
        await this.processQueueEntry(entry)
      } catch (error) {
        console.error(`Failed to process queue entry ${entry.id}:`, error)
      } finally {
        this.processing.delete(entry.id)
      }
    })

    await Promise.all(processingPromises)
  }

  /**
   * 単一のキューエントリを処理
   */
  private async processQueueEntry(entry: any): Promise<GenerationResult> {
    const startTime = Date.now()

    try {
      // ステータス更新: 処理中
      await prisma.articleGenerationQueue.update({
        where: { id: entry.id },
        data: {
          status: 'processing',
          started_at: new Date()
        }
      })

      const knowledge = entry.knowledge

      // 1. 重複チェック
      const duplicateCheck = await this.checkForDuplicateArticle(knowledge)
      if (duplicateCheck.isDuplicate) {
        await this.markAsCompleted(entry.id, {
          success: true,
          isDuplicate: true,
          processingTimeMs: Date.now() - startTime
        })

        return {
          success: true,
          isDuplicate: true,
          processingTimeMs: Date.now() - startTime
        }
      }

      // 2. 記事生成
      const article = await this.generateArticle(knowledge)

      // 3. 記事をデータベースに保存
      const savedArticle = await prisma.article.create({
        data: {
          title: article.title,
          content: article.content,
          slug: this.generateSlug(article.title),
          emoji: article.emoji || '📝',
          type: article.type || 'tech',
          topics: JSON.stringify(article.topics || []),
          knowledge_id: knowledge.id,
          published: false
        }
      })

      // 4. GitHub連携（Zenn記事として）
      await this.publishToGitHub(savedArticle)

      // 5. 完了マーク
      await this.markAsCompleted(entry.id, {
        success: true,
        articleId: savedArticle.id,
        processingTimeMs: Date.now() - startTime
      })

      // 6. ログ記録
      await prisma.articleLog.create({
        data: {
          article_id: savedArticle.id,
          action: 'created',
          status: 'success',
          message: 'Article generated and published automatically',
          metadata: JSON.stringify({
            queue_entry_id: entry.id,
            processing_time_ms: Date.now() - startTime,
            notion_page_id: knowledge.notion_reference?.page_id
          })
        }
      })

      console.log(`Successfully generated article: ${savedArticle.title}`)

      return {
        success: true,
        articleId: savedArticle.id,
        processingTimeMs: Date.now() - startTime
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // リトライ処理
      const newRetryCount = entry.retry_count + 1
      const maxRetries = entry.max_retries || 3

      if (newRetryCount < maxRetries) {
        // リトライスケジュール（指数バックオフ）
        const nextRetryAt = new Date(Date.now() + Math.pow(2, newRetryCount) * 60 * 1000)
        
        await prisma.articleGenerationQueue.update({
          where: { id: entry.id },
          data: {
            status: 'pending',
            retry_count: newRetryCount,
            scheduled_at: nextRetryAt,
            error_message: errorMessage
          }
        })

        console.log(`Scheduled retry ${newRetryCount}/${maxRetries} for queue entry ${entry.id}`)
      } else {
        // 最大リトライ回数に達した場合は失敗マーク
        await prisma.articleGenerationQueue.update({
          where: { id: entry.id },
          data: {
            status: 'failed',
            completed_at: new Date(),
            error_message: errorMessage
          }
        })

        console.error(`Queue entry ${entry.id} failed after ${maxRetries} retries: ${errorMessage}`)
      }

      return {
        success: false,
        error: errorMessage,
        processingTimeMs: Date.now() - startTime
      }
    }
  }

  /**
   * 重複記事をチェック
   */
  private async checkForDuplicateArticle(knowledge: any): Promise<{ isDuplicate: boolean, similarArticle?: any }> {
    // コンテンツハッシュベースの重複チェック
    const contentHash = crypto.createHash('sha256')
      .update(knowledge.title + knowledge.content)
      .digest('hex')

    // 既存の記事から類似度の高いものを検索
    const existingArticles = await prisma.article.findMany({
      where: {
        id: {
          not: knowledge.id
        }
      },
      include: {
        knowledge: true
      }
    })

    for (const article of existingArticles) {
      if (!article.knowledge) continue

      const existingHash = crypto.createHash('sha256')
        .update(article.knowledge.title + article.knowledge.content)
        .digest('hex')

      // 完全一致の場合
      if (contentHash === existingHash) {
        await prisma.articleDuplication.create({
          data: {
            original_article_id: article.id,
            duplicate_content_hash: contentHash,
            similarity_score: 1.0,
            detected_at: new Date()
          }
        })

        return { isDuplicate: true, similarArticle: article }
      }

      // 簡単な類似度チェック（タイトルベース）
      const titleSimilarity = this.calculateTitleSimilarity(knowledge.title, article.knowledge.title)
      if (titleSimilarity > 0.8) {
        await prisma.articleDuplication.create({
          data: {
            original_article_id: article.id,
            duplicate_content_hash: contentHash,
            similarity_score: titleSimilarity,
            detected_at: new Date()
          }
        })

        return { isDuplicate: true, similarArticle: article }
      }
    }

    return { isDuplicate: false }
  }

  /**
   * タイトルの類似度を計算（簡易版）
   */
  private calculateTitleSimilarity(title1: string, title2: string): number {
    const words1 = title1.toLowerCase().split(/\s+/)
    const words2 = title2.toLowerCase().split(/\s+/)
    
    const commonWords = words1.filter(word => words2.includes(word))
    const totalWords = new Set([...words1, ...words2]).size
    
    return commonWords.length / totalWords
  }

  /**
   * 記事を生成
   */
  private async generateArticle(knowledge: any): Promise<any> {
    const prompt = `
以下のナレッジから技術記事を生成してください。

タイトル: ${knowledge.title}
内容: ${knowledge.content}
カテゴリ: ${knowledge.category}

以下の形式でZenn記事として出力してください：
- タイトル: SEOを意識した魅力的なタイトル
- 絵文字: 内容に適した絵文字
- 記事タイプ: tech, idea, personal のいずれか
- トピック: 関連するトピックタグの配列
- 本文: Markdown形式で読みやすい記事

重要：
- 読者にとって価値のある実用的な内容にしてください
- コードサンプルがある場合は適切にフォーマットしてください
- 見出し構造を適切に使用してください
- 最後に参考リンクや関連情報があれば追加してください
`

    const response = await this.claudeAPI.generateContent(prompt)
    
    // レスポンスをパース（簡易版）
    const lines = response.split('\n')
    let title = knowledge.title
    let emoji = '📝'
    let type = 'tech'
    let topics: string[] = []
    let content = response

    // タイトル抽出
    const titleMatch = response.match(/タイトル[：:]\s*(.+)/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
    }

    // 絵文字抽出
    const emojiMatch = response.match(/絵文字[：:]\s*(.+)/i)
    if (emojiMatch) {
      emoji = emojiMatch[1].trim()
    }

    // タイプ抽出
    const typeMatch = response.match(/記事タイプ[：:]\s*(tech|idea|personal)/i)
    if (typeMatch) {
      type = typeMatch[1].trim()
    }

    // トピック抽出
    const topicMatch = response.match(/トピック[：:]\s*\[(.+)\]/i)
    if (topicMatch) {
      topics = topicMatch[1].split(',').map(t => t.trim().replace(/"/g, ''))
    }

    return {
      title,
      emoji,
      type,
      topics,
      content: this.cleanupContent(content)
    }
  }

  /**
   * コンテンツをクリーンアップ
   */
  private cleanupContent(content: string): string {
    // メタデータ行を除去
    const lines = content.split('\n')
    const contentLines = lines.filter(line => {
      return !line.match(/^(タイトル|絵文字|記事タイプ|トピック)[：:]/i)
    })
    
    return contentLines.join('\n').trim()
  }

  /**
   * スラッグを生成
   */
  private generateSlug(title: string): string {
    const timestamp = Date.now().toString(36)
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
    
    return `${cleanTitle}-${timestamp}`
  }

  /**
   * GitHubに公開
   */
  private async publishToGitHub(article: any): Promise<void> {
    const frontmatter = `---
title: "${article.title}"
emoji: "${article.emoji}"
type: "${article.type}"
topics: ${JSON.stringify(JSON.parse(article.topics || '[]'))}
published: false
---

`

    const fullContent = frontmatter + article.content

    try {
      const result = await this.githubAPI.createFile({
        path: `articles/${article.slug}.md`,
        content: fullContent,
        message: `Add article: ${article.title}`
      })

      // 記事を更新してGitHub情報を保存
      await prisma.article.update({
        where: { id: article.id },
        data: {
          github_pushed: true,
          github_sha: result.sha,
          published_at: new Date()
        }
      })

      console.log(`Published article to GitHub: ${article.title}`)
    } catch (error) {
      console.error(`Failed to publish to GitHub: ${error}`)
      throw error
    }
  }

  /**
   * キューエントリを完了マーク
   */
  private async markAsCompleted(entryId: string, result: GenerationResult): Promise<void> {
    await prisma.articleGenerationQueue.update({
      where: { id: entryId },
      data: {
        status: 'completed',
        completed_at: new Date(),
        error_message: result.error || null
      }
    })
  }

  /**
   * キューの統計を取得
   */
  async getQueueStats(): Promise<any> {
    const stats = await prisma.articleGenerationQueue.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    const totalEntries = stats.reduce((sum, stat) => sum + stat._count.status, 0)
    const pendingEntries = stats.find(s => s.status === 'pending')?._count.status || 0
    const processingEntries = stats.find(s => s.status === 'processing')?._count.status || 0
    const completedEntries = stats.find(s => s.status === 'completed')?._count.status || 0
    const failedEntries = stats.find(s => s.status === 'failed')?._count.status || 0

    return {
      total: totalEntries,
      pending: pendingEntries,
      processing: processingEntries,
      completed: completedEntries,
      failed: failedEntries,
      successRate: totalEntries > 0 ? ((completedEntries / totalEntries) * 100) : 0
    }
  }

  /**
   * 失敗したエントリを再試行
   */
  async retryFailedEntries(): Promise<void> {
    const failedEntries = await prisma.articleGenerationQueue.findMany({
      where: {
        status: 'failed'
      }
    })

    for (const entry of failedEntries) {
      await prisma.articleGenerationQueue.update({
        where: { id: entry.id },
        data: {
          status: 'pending',
          retry_count: 0,
          scheduled_at: new Date(),
          error_message: null
        }
      })
    }

    console.log(`Rescheduled ${failedEntries.length} failed entries for retry`)
  }
} 