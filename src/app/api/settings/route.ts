import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const ENV_PATH = path.join(process.cwd(), '.env')

interface APISettings {
  notion_token: string
  anthropic_api_key: string
  github_token: string
  github_owner: string
  github_repo: string
}

interface ConnectionStatus {
  notion: boolean | null
  claude: boolean | null
  github: boolean | null
}

// 環境変数からの設定読み込み
function loadCurrentSettings(): APISettings {
  return {
    notion_token: process.env.NOTION_TOKEN || '',
    anthropic_api_key: process.env.ANTHROPIC_API_KEY || '',
    github_token: process.env.GITHUB_TOKEN || '',
    github_owner: process.env.GITHUB_OWNER || '',
    github_repo: process.env.GITHUB_REPO || 'zenn-articles-auto'
  }
}

// .envファイルの更新
function updateEnvFile(settings: APISettings) {
  try {
    let envContent = ''
    
    // 既存の.envファイルを読み込み
    if (fs.existsSync(ENV_PATH)) {
      envContent = fs.readFileSync(ENV_PATH, 'utf8')
    }

    // 設定値を更新
    const updates = {
      NOTION_TOKEN: settings.notion_token,
      ANTHROPIC_API_KEY: settings.anthropic_api_key,
      GITHUB_TOKEN: settings.github_token,
      GITHUB_OWNER: settings.github_owner,
      GITHUB_REPO: settings.github_repo
    }

    // 各設定値を更新または追加
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm')
      const newLine = `${key}="${value}"`
      
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, newLine)
      } else {
        envContent += `\n${newLine}`
      }
    })

    // ファイルに書き込み
    fs.writeFileSync(ENV_PATH, envContent.trim() + '\n')
    
    return true
  } catch (error) {
    console.error('Failed to update .env file:', error)
    return false
  }
}

// 接続状況の簡単なテスト
async function testConnections(): Promise<ConnectionStatus> {
  const status: ConnectionStatus = {
    notion: null,
    claude: null,
    github: null
  }

  // Notion接続テスト
  if (process.env.NOTION_TOKEN) {
    try {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28'
        }
      })
      status.notion = response.ok
    } catch {
      status.notion = false
    }
  }

  // Claude接続テスト
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        })
      })
      status.claude = response.ok || response.status === 400 // 400も有効なレスポンス
    } catch {
      status.claude = false
    }
  }

  // GitHub接続テスト
  if (process.env.GITHUB_TOKEN) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'kaag-system'
        }
      })
      status.github = response.ok
    } catch {
      status.github = false
    }
  }

  return status
}

export async function GET() {
  try {
    const settings = loadCurrentSettings()
    const connectionStatus = await testConnections()

    return NextResponse.json({
      success: true,
      settings,
      connectionStatus
    })
  } catch (error) {
    console.error('Failed to load settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const settings: APISettings = await request.json()

    // .envファイルを更新
    const success = updateEnvFile(settings)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to update environment variables' },
        { status: 500 }
      )
    }

    // 環境変数を更新（リロードが必要）
    process.env.NOTION_TOKEN = settings.notion_token
    process.env.ANTHROPIC_API_KEY = settings.anthropic_api_key
    process.env.GITHUB_TOKEN = settings.github_token
    process.env.GITHUB_OWNER = settings.github_owner
    process.env.GITHUB_REPO = settings.github_repo

    return NextResponse.json({
      success: true,
      message: '設定が保存されました'
    })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    )
  }
} 