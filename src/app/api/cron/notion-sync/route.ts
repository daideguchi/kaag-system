import { NextRequest, NextResponse } from 'next/server'
import { NotionAutoSyncService } from '@/lib/notion-auto-sync'
import { ArticleGenerationQueueService } from '@/lib/article-generation-queue'

const syncService = new NotionAutoSyncService()
const queueService = new ArticleGenerationQueueService()

export async function POST(request: NextRequest) {
  try {
    console.log('Starting scheduled Notion sync...')
    
    // 認証チェック（本番環境では適切な認証を実装）
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()

    // 1. Notion同期を実行
    console.log('Step 1: Syncing Notion references...')
    await syncService.syncAllActiveReferences({
      batchSize: 20,
      maxRetries: 3
    })

    // 2. 記事生成キューを処理
    console.log('Step 2: Processing article generation queue...')
    await queueService.processQueue({
      maxConcurrent: 5,
      maxRetries: 3
    })

    // 3. 統計情報を取得
    const syncStats = await syncService.getSyncStats()
    const queueStats = await queueService.getQueueStats()

    const processingTime = Date.now() - startTime

    console.log('Scheduled sync completed successfully')
    console.log('Sync stats:', syncStats)
    console.log('Queue stats:', queueStats)

    return NextResponse.json({
      success: true,
      message: 'Scheduled sync completed successfully',
      processingTimeMs: processingTime,
      stats: {
        sync: syncStats,
        queue: queueStats
      }
    })

  } catch (error) {
    console.error('Scheduled sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // 同期統計を取得
    const syncStats = await syncService.getSyncStats()
    const queueStats = await queueService.getQueueStats()

    return NextResponse.json({
      success: true,
      stats: {
        sync: syncStats,
        queue: queueStats
      }
    })

  } catch (error) {
    console.error('Failed to get sync stats:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 