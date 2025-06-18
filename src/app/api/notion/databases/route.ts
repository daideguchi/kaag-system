import { NextRequest, NextResponse } from 'next/server'
import { NotionService } from '@/lib/notion'

export async function GET(request: NextRequest) {
  try {
    const notionService = new NotionService()
    
    // 接続テストを先に実行
    const connectionTest = await notionService.testConnection()
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: connectionTest.error,
        data: []
      }, { status: 401 })
    }

    const databases = await notionService.getDatabases()
    
    return NextResponse.json({
      success: true,
      data: databases
    })
  } catch (error: any) {
    console.error('API Error - /api/notion/databases:', error)
    
    return NextResponse.json({
      success: false,
      error: error.code === 'unauthorized' 
        ? 'Notion APIトークンが無効です。設定を確認してください。'
        : 'データベース取得中にエラーが発生しました。',
      data: []
    }, { status: error.status || 500 })
  }
} 