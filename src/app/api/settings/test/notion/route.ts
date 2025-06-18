import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { notion_token } = await request.json()

    if (!notion_token) {
      return NextResponse.json({
        success: false,
        error: 'Notion tokenが必要です'
      })
    }

    // Notion APIに接続テスト
    const response = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${notion_token}`,
        'Notion-Version': '2022-06-28'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        error: errorData.message || 'Notion API接続に失敗しました'
      })
    }

    const userData = await response.json()
    
    return NextResponse.json({
      success: true,
      message: `Notion接続成功 - ${userData.name || 'ユーザー'}`,
      data: {
        name: userData.name,
        avatar_url: userData.avatar_url,
        type: userData.type
      }
    })
  } catch (error) {
    console.error('Notion connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Notion接続テストでエラーが発生しました'
    })
  }
} 