import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    // Notionトークンの確認
    if (!process.env.NOTION_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Notion連携が設定されていません',
        code: 'NOTION_NOT_CONNECTED',
        message: 'Notionワークスペースとの連携を設定してください'
      }, { status: 400 })
    }

    if (!query) {
      return NextResponse.json({
        success: false,
        error: '検索クエリが必要です',
        code: 'MISSING_QUERY'
      }, { status: 400 })
    }

    // Notion API検索
    const response = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        query: query,
        filter: {
          property: 'object',
          value: 'page'
        },
        page_size: 20
      })
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Notionトークンが無効です',
          code: 'INVALID_TOKEN',
          message: 'Notion連携を再設定してください'
        }, { status: 401 })
      }

      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({
        success: false,
        error: 'Notion API エラー',
        code: 'NOTION_API_ERROR',
        details: errorData
      }, { status: response.status })
    }

    const data = await response.json()
    
    // 結果を整形
    const pages = data.results.map((page: any) => ({
      id: page.id,
      title: page.properties?.title?.title?.[0]?.plain_text || 
             page.properties?.Name?.title?.[0]?.plain_text || 
             'Untitled',
      url: page.url,
      last_edited_time: page.last_edited_time,
      created_time: page.created_time,
      icon: page.icon,
      cover: page.cover
    }))

    return NextResponse.json({
      success: true,
      data: {
        pages,
        total: data.results.length,
        has_more: data.has_more
      }
    })

  } catch (error) {
    console.error('Notion search error:', error)
    return NextResponse.json({
      success: false,
      error: 'Notion検索に失敗しました',
      code: 'SEARCH_ERROR',
      message: 'しばらく時間をおいて再試行してください'
    }, { status: 500 })
  }
} 