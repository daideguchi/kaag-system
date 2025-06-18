import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const NOTION_CLIENT_ID = process.env.NOTION_CLIENT_ID
const NOTION_CLIENT_SECRET = process.env.NOTION_CLIENT_SECRET
const NOTION_REDIRECT_URI = process.env.NOTION_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/notion/callback`

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // エラーチェック
    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=${encodeURIComponent(error)}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=invalid_callback`)
    }

    // stateの検証
    const storedState = request.cookies.get('notion_oauth_state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=invalid_state`)
    }

    if (!NOTION_CLIENT_ID || !NOTION_CLIENT_SECRET) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=oauth_config_missing`)
    }

    // アクセストークンを取得
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${NOTION_CLIENT_ID}:${NOTION_CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: NOTION_REDIRECT_URI
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      console.error('Token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json()
    
    // ワークスペース情報を取得
    const workspaceResponse = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Notion-Version': '2022-06-28'
      }
    })

    if (!workspaceResponse.ok) {
      console.error('Workspace info fetch failed')
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=workspace_info_failed`)
    }

    const workspaceData = await workspaceResponse.json()

    // データベースに保存
    try {
      await prisma.notionIntegration.upsert({
        where: {
          workspace_id: tokenData.workspace_id
        },
        update: {
          access_token: tokenData.access_token,
          workspace_name: tokenData.workspace_name,
          workspace_icon: tokenData.workspace_icon,
          bot_id: tokenData.bot_id,
          owner_type: tokenData.owner?.type || 'user',
          owner_id: tokenData.owner?.user?.id,
          owner_name: tokenData.owner?.user?.name,
          owner_avatar_url: tokenData.owner?.user?.avatar_url,
          is_active: true,
          last_used_at: new Date(),
          updated_at: new Date()
        },
        create: {
          access_token: tokenData.access_token,
          workspace_id: tokenData.workspace_id,
          workspace_name: tokenData.workspace_name,
          workspace_icon: tokenData.workspace_icon,
          bot_id: tokenData.bot_id,
          owner_type: tokenData.owner?.type || 'user',
          owner_id: tokenData.owner?.user?.id,
          owner_name: tokenData.owner?.user?.name,
          owner_avatar_url: tokenData.owner?.user?.avatar_url,
          is_active: true,
          last_used_at: new Date()
        }
      })

      // 成功時のリダイレクト（stateクッキーをクリア）
      const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?success=notion_connected`)
      response.cookies.delete('notion_oauth_state')
      
      return response
    } catch (dbError) {
      console.error('Database save error:', dbError)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=database_save_failed`)
    }

  } catch (error) {
    console.error('Notion OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=callback_processing_failed`)
  }
} 