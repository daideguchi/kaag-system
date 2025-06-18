import { NextRequest, NextResponse } from 'next/server'

// Notion OAuth設定
const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/notion/callback`

export async function GET(request: NextRequest) {
  try {
    if (!NOTION_CLIENT_ID) {
      return NextResponse.json({
        success: false,
        error: 'Notion OAuth設定が不完全です'
      }, { status: 500 })
    }

    // OAuth認証URLを生成
    const state = generateRandomState()
    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize')
    
    authUrl.searchParams.set('client_id', NOTION_CLIENT_ID)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('owner', 'user')
    authUrl.searchParams.set('redirect_uri', NOTION_REDIRECT_URI)
    authUrl.searchParams.set('state', state)

    // stateをセッションに保存（簡易実装）
    const response = NextResponse.redirect(authUrl.toString())
    response.cookies.set('notion_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 600 // 10分
    })

    return response
  } catch (error) {
    console.error('Notion OAuth initiation error:', error)
    return NextResponse.json({
      success: false,
      error: 'OAuth認証の開始に失敗しました'
    }, { status: 500 })
  }
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
} 