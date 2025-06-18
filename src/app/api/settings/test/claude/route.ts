import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { anthropic_api_key } = await request.json()

    if (!anthropic_api_key) {
      return NextResponse.json({
        success: false,
        error: 'Claude API keyが必要です'
      })
    }

    // Claude APIに接続テスト
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropic_api_key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        error: errorData.error?.message || 'Claude API接続に失敗しました'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Claude API接続成功',
      data: {
        model: 'claude-3-haiku-20240307',
        status: 'active'
      }
    })
  } catch (error) {
    console.error('Claude connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Claude接続テストでエラーが発生しました'
    })
  }
} 