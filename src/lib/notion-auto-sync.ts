import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import { NotionAPI } from './notion'

const prisma = new PrismaClient()

export interface NotionSyncOptions {
  forceSync?: boolean
  batchSize?: number
  maxRetries?: number
}

export interface ContentChange {
  type: 'title' | 'content' | 'properties'
  oldValue: string
  newValue: string
  timestamp: string
}

export interface SyncResult {
  success: boolean
  changesDetected: boolean
  contentChanges?: ContentChange[]
  error?: string
  syncDurationMs: number
}

export class NotionAutoSyncService {
  private notionAPI: NotionAPI

  constructor() {
    this.notionAPI = new NotionAPI()
  }

  /**
   * 全てのアクティブなNotion参照を同期
   */
  async syncAllActiveReferences(options: NotionSyncOptions = {}): Promise<void> {
    const { batchSize = 10, maxRetries = 3 } = options

    // 自動同期が有効なNotion参照を取得
    const activeReferences = await prisma.notionReference.findMany({
      where: {
        auto_sync_enabled: true
      },
      include: {
        knowledge: true
      },
      orderBy: {
        last_synced_at: 'asc' // 最も古いものから同期
      },
      take: batchSize
    })

    console.log(`Found ${activeReferences.length} active Notion references to sync`)

    // 並列処理でバッチ同期
    const syncPromises = activeReferences.map(async (reference) => {
      let retryCount = 0
      
      while (retryCount < maxRetries) {
        try {
          await this.syncSingleReference(reference.id, options)
          break
        } catch (error) {
          retryCount++
          console.error(`Sync failed for reference ${reference.id}, retry ${retryCount}/${maxRetries}:`, error)
          
          if (retryCount >= maxRetries) {
            // 最大リトライ回数に達した場合はログに記録
            await this.logSyncResult(reference.id, {
              success: false,
              changesDetected: false,
              error: `Max retries exceeded: ${error}`,
              syncDurationMs: 0
            }, 'scheduled')
          }
          
          // 指数バックオフ
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        }
      }
    })

    await Promise.all(syncPromises)
  }

  /**
   * 単一のNotion参照を同期
   */
  async syncSingleReference(referenceId: string, options: NotionSyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now()
    
    try {
      const reference = await prisma.notionReference.findUnique({
        where: { id: referenceId },
        include: { knowledge: true }
      })

      if (!reference) {
        throw new Error(`Notion reference not found: ${referenceId}`)
      }

      // Notion APIから最新のページ情報を取得
      const notionPage = await this.notionAPI.getPageContent(reference.page_id)
      
      // コンテンツハッシュを計算
      const currentContentHash = this.calculateContentHash(notionPage)
      
      // 変更検出
      const changesDetected = this.detectChanges(reference, notionPage, currentContentHash)
      
      if (!changesDetected && !options.forceSync) {
        const syncResult: SyncResult = {
          success: true,
          changesDetected: false,
          syncDurationMs: Date.now() - startTime
        }
        
        await this.logSyncResult(referenceId, syncResult, 'scheduled')
        return syncResult
      }

      // 変更内容を分析
      const contentChanges = this.analyzeContentChanges(reference, notionPage)
      
      // 重複チェック
      const isDuplicate = await this.checkForDuplicateContent(currentContentHash, reference.knowledge_id)
      
      if (isDuplicate) {
        console.log(`Duplicate content detected for reference ${referenceId}, skipping...`)
        
        const syncResult: SyncResult = {
          success: true,
          changesDetected: false,
          syncDurationMs: Date.now() - startTime
        }
        
        await this.logSyncResult(referenceId, syncResult, 'scheduled')
        return syncResult
      }

      // ナレッジを更新
      await prisma.knowledge.update({
        where: { id: reference.knowledge_id },
        data: {
          title: notionPage.title,
          content: notionPage.content,
          updated_at: new Date()
        }
      })

      // Notion参照を更新
      await prisma.notionReference.update({
        where: { id: referenceId },
        data: {
          last_synced_at: new Date(),
          notion_updated_at: new Date(notionPage.last_edited_time),
          content_hash: currentContentHash,
          last_content_hash: reference.content_hash || currentContentHash
        }
      })

      // 記事生成キューに追加
      await this.addToArticleGenerationQueue(reference.knowledge_id)

      const syncResult: SyncResult = {
        success: true,
        changesDetected: true,
        contentChanges,
        syncDurationMs: Date.now() - startTime
      }

      await this.logSyncResult(referenceId, syncResult, 'scheduled')
      return syncResult

    } catch (error) {
      const syncResult: SyncResult = {
        success: false,
        changesDetected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncDurationMs: Date.now() - startTime
      }

      await this.logSyncResult(referenceId, syncResult, 'scheduled')
      throw error
    }
  }

  /**
   * コンテンツハッシュを計算
   */
  private calculateContentHash(notionPage: any): string {
    const content = JSON.stringify({
      title: notionPage.title,
      content: notionPage.content,
      last_edited_time: notionPage.last_edited_time
    })
    
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * 変更を検出
   */
  private detectChanges(reference: any, notionPage: any, currentContentHash: string): boolean {
    // ハッシュベースの変更検出
    if (reference.content_hash && reference.content_hash === currentContentHash) {
      return false
    }

    // 最終更新時刻ベースの変更検出
    if (reference.notion_updated_at) {
      const lastSyncTime = new Date(reference.notion_updated_at)
      const notionUpdateTime = new Date(notionPage.last_edited_time)
      
      return notionUpdateTime > lastSyncTime
    }

    return true
  }

  /**
   * コンテンツ変更を分析
   */
  private analyzeContentChanges(reference: any, notionPage: any): ContentChange[] {
    const changes: ContentChange[] = []
    
    // タイトルの変更
    if (reference.page_title !== notionPage.title) {
      changes.push({
        type: 'title',
        oldValue: reference.page_title,
        newValue: notionPage.title,
        timestamp: new Date().toISOString()
      })
    }

    // コンテンツの変更（簡単な比較）
    if (reference.knowledge.content !== notionPage.content) {
      changes.push({
        type: 'content',
        oldValue: reference.knowledge.content.substring(0, 100) + '...',
        newValue: notionPage.content.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      })
    }

    return changes
  }

  /**
   * 重複コンテンツをチェック
   */
  private async checkForDuplicateContent(contentHash: string, excludeKnowledgeId: string): Promise<boolean> {
    // 同じハッシュを持つ他のナレッジが存在するかチェック
    const existingReference = await prisma.notionReference.findFirst({
      where: {
        content_hash: contentHash,
        knowledge_id: {
          not: excludeKnowledgeId
        }
      }
    })

    if (existingReference) {
      // 重複を記録
      await prisma.articleDuplication.create({
        data: {
          original_article_id: existingReference.knowledge_id,
          duplicate_content_hash: contentHash,
          similarity_score: 1.0, // 完全一致
          detected_at: new Date()
        }
      })

      return true
    }

    return false
  }

  /**
   * 記事生成キューに追加
   */
  private async addToArticleGenerationQueue(knowledgeId: string): Promise<void> {
    // 既存のキューエントリをチェック
    const existingQueue = await prisma.articleGenerationQueue.findFirst({
      where: {
        knowledge_id: knowledgeId,
        status: {
          in: ['pending', 'processing']
        }
      }
    })

    if (existingQueue) {
      console.log(`Knowledge ${knowledgeId} is already in generation queue`)
      return
    }

    // 新しいキューエントリを作成
    await prisma.articleGenerationQueue.create({
      data: {
        knowledge_id: knowledgeId,
        priority: 5, // デフォルト優先度
        scheduled_at: new Date(Date.now() + 5 * 60 * 1000), // 5分後に実行
        status: 'pending'
      }
    })

    console.log(`Added knowledge ${knowledgeId} to article generation queue`)
  }

  /**
   * 同期結果をログに記録
   */
  private async logSyncResult(
    referenceId: string, 
    result: SyncResult, 
    syncType: 'scheduled' | 'manual' | 'webhook'
  ): Promise<void> {
    await prisma.notionSyncLog.create({
      data: {
        notion_reference_id: referenceId,
        sync_type: syncType,
        status: result.success ? 'success' : 'error',
        changes_detected: result.changesDetected,
        content_changes: result.contentChanges ? JSON.stringify(result.contentChanges) : null,
        error_message: result.error,
        sync_duration_ms: result.syncDurationMs
      }
    })
  }

  /**
   * 同期頻度に基づいて同期が必要かチェック
   */
  async shouldSync(referenceId: string): Promise<boolean> {
    const reference = await prisma.notionReference.findUnique({
      where: { id: referenceId }
    })

    if (!reference || !reference.auto_sync_enabled) {
      return false
    }

    if (!reference.last_synced_at) {
      return true // 初回同期
    }

    const now = new Date()
    const lastSync = new Date(reference.last_synced_at)
    const timeDiff = now.getTime() - lastSync.getTime()

    switch (reference.sync_frequency) {
      case 'hourly':
        return timeDiff > 60 * 60 * 1000 // 1時間
      case 'daily':
        return timeDiff > 24 * 60 * 60 * 1000 // 24時間
      case 'weekly':
        return timeDiff > 7 * 24 * 60 * 60 * 1000 // 7日
      default:
        return timeDiff > 24 * 60 * 60 * 1000 // デフォルトは日次
    }
  }

  /**
   * 同期統計を取得
   */
  async getSyncStats(days: number = 7): Promise<any> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    
    const stats = await prisma.notionSyncLog.groupBy({
      by: ['status'],
      where: {
        created_at: {
          gte: since
        }
      },
      _count: {
        status: true
      }
    })

    const totalSyncs = stats.reduce((sum, stat) => sum + stat._count.status, 0)
    const successfulSyncs = stats.find(s => s.status === 'success')?._count.status || 0
    const failedSyncs = stats.find(s => s.status === 'error')?._count.status || 0

    return {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
      period: `${days} days`
    }
  }
} 