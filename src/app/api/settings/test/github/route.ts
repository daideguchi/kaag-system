import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { github_token, github_owner, github_repo } = await request.json()

    if (!github_token) {
      return NextResponse.json({
        success: false,
        error: 'GitHub tokenが必要です'
      })
    }

    // GitHub APIでユーザー情報を取得
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${github_token}`,
        'User-Agent': 'kaag-system'
      }
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.json()
      return NextResponse.json({
        success: false,
        error: errorData.message || 'GitHub API接続に失敗しました'
      })
    }

    const userData = await userResponse.json()

    // リポジトリが指定されている場合、リポジトリへのアクセスもテスト
    let repoAccess = null
    if (github_owner && github_repo) {
      const repoResponse = await fetch(`https://api.github.com/repos/${github_owner}/${github_repo}`, {
        headers: {
          'Authorization': `token ${github_token}`,
          'User-Agent': 'kaag-system'
        }
      })
      
      repoAccess = {
        exists: repoResponse.ok,
        hasWriteAccess: repoResponse.ok // 簡易チェック
      }
    }

    return NextResponse.json({
      success: true,
      message: `GitHub接続成功 - ${userData.login}`,
      data: {
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        public_repos: userData.public_repos,
        repoAccess
      }
    })
  } catch (error) {
    console.error('GitHub connection test error:', error)
    return NextResponse.json({
      success: false,
      error: 'GitHub接続テストでエラーが発生しました'
    })
  }
} 