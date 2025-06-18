import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { repoName, description, isPrivate = false } = await request.json()

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'GitHub token が設定されていません'
      }, { status: 500 })
    }

    if (!repoName) {
      return NextResponse.json({
        success: false,
        error: 'リポジトリ名が必要です'
      }, { status: 400 })
    }

    // GitHub APIでリポジトリを作成
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'kaag-system'
      },
      body: JSON.stringify({
        name: repoName,
        description: description || `Zenn記事管理リポジトリ - ${repoName}`,
        private: isPrivate,
        auto_init: true,
        gitignore_template: 'Node'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      
      if (response.status === 422 && errorData.errors?.some((e: any) => e.code === 'already_exists')) {
        return NextResponse.json({
          success: false,
          error: 'このリポジトリ名は既に存在します'
        }, { status: 409 })
      }

      console.error('GitHub repo creation failed:', errorData)
      return NextResponse.json({
        success: false,
        error: errorData.message || 'リポジトリの作成に失敗しました'
      }, { status: response.status })
    }

    const repoData = await response.json()

    // Zenn用の初期ファイルを作成
    await createZennInitialFiles(repoData.full_name)

    return NextResponse.json({
      success: true,
      data: {
        name: repoData.name,
        full_name: repoData.full_name,
        html_url: repoData.html_url,
        clone_url: repoData.clone_url,
        ssh_url: repoData.ssh_url,
        private: repoData.private
      }
    })
  } catch (error) {
    console.error('Repository creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'リポジトリ作成中にエラーが発生しました'
    }, { status: 500 })
  }
}

async function createZennInitialFiles(repoFullName: string) {
  try {
    const files = [
      {
        path: 'articles/.gitkeep',
        content: '',
        message: 'Add articles directory'
      },
      {
        path: 'books/.gitkeep', 
        content: '',
        message: 'Add books directory'
      },
      {
        path: 'README.md',
        content: `# Zenn Articles Repository

このリポジトリは[Zenn](https://zenn.dev/)の記事管理用です。

## 構成

- \`articles/\`: 記事ファイル（.md）
- \`books/\`: 本ファイル（.md）

## 自動生成について

このリポジトリの記事は[KAAG System](https://github.com/${process.env.GITHUB_OWNER}/kaag-system)により自動生成されています。

## Zennとの連携

このリポジトリをZennと連携することで、記事の自動公開が可能になります。

詳細は[Zennの公式ドキュメント](https://zenn.dev/zenn/articles/connect-to-github)を参照してください。
`,
        message: 'Add README'
      }
    ]

    for (const file of files) {
      await fetch(`https://api.github.com/repos/${repoFullName}/contents/${file.path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'kaag-system'
        },
        body: JSON.stringify({
          message: file.message,
          content: Buffer.from(file.content).toString('base64')
        })
      })
    }
  } catch (error) {
    console.error('Failed to create initial files:', error)
    // エラーが発生してもリポジトリ作成は成功とする
  }
} 