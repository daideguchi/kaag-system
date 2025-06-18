import { NextRequest, NextResponse } from 'next/server'
import { NotionAutoSyncService } from '@/lib/notion-auto-sync'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const syncService = new NotionAutoSyncService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referenceId, forceSync = false } = body

    if (!referenceId) {
      return NextResponse.json({
        success: false,
        error: 'Reference ID is required'
      }, { status: 400 })
    }

    // 参照が存在するかチェック
    const reference = await prisma.notionReference.findUnique({
      where: { id: referenceId },
      include: { knowledge: true }
    })

    if (!reference) {
      return NextResponse.json({
        success: false,
        error: 'Notion reference not found'
      }, { status: 404 })
    }

    console.log(`Manual sync requested for reference: ${referenceId}`)

    // 同期実行
    const result = await syncService.syncSingleReference(referenceId, { forceSync })

    return NextResponse.json({
      success: true,
      message: 'Manual sync completed',
      result: {
        changesDetected: result.changesDetected,
        contentChanges: result.contentChanges,
        processingTimeMs: result.syncDurationMs
      }
    })

  } catch (error) {
    console.error('Manual sync failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const referenceId = searchParams.get('referenceId')

    if (referenceId) {
      // 特定の参照の同期ログを取得
      const logs = await prisma.notionSyncLog.findMany({
        where: {
          notion_reference_id: referenceId
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 10
      })

      return NextResponse.json({
        success: true,
        logs
      })
    } else {
      // 全体の同期統計を取得
      const stats = await syncService.getSyncStats()
      
      return NextResponse.json({
        success: true,
        stats
      })
    }

  } catch (error) {
    console.error('Failed to get sync info:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 