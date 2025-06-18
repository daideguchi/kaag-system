import { Octokit } from '@octokit/rest'

export interface ZennArticleMetadata {
  title: string
  emoji: string
  type: 'tech' | 'idea'
  topics: string[]
  published: boolean
}

export interface PublishResult {
  success: boolean
  url?: string
  sha?: string
  error?: string
}

export class GitHubService {
  private octokit: Octokit
  private owner: string
  private repo: string

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    })
    this.owner = process.env.GITHUB_OWNER || ''
    this.repo = process.env.GITHUB_REPO || 'zenn-articles-auto'
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)
  }

  private formatZennArticle(metadata: ZennArticleMetadata, content: string): string {
    const frontmatter = `---
title: "${metadata.title}"
emoji: "${metadata.emoji}"
type: "${metadata.type}"
topics: [${metadata.topics.map(topic => `"${topic}"`).join(', ')}]
published: ${metadata.published}
---

`
    return frontmatter + content
  }

  async publishArticle(
    metadata: ZennArticleMetadata,
    content: string,
    slug?: string
  ): Promise<PublishResult> {
    try {
      const articleSlug = slug || this.generateSlug(metadata.title)
      const fileName = `articles/${articleSlug}.md`
      const fileContent = this.formatZennArticle(metadata, content)

      // ファイルが既に存在するかチェック
      let existingFile = null
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: fileName,
        })
        existingFile = data
      } catch (error) {
        // ファイルが存在しない場合は新規作成
      }

      const commitMessage = existingFile
        ? `Update article: ${metadata.title}`
        : `Add new article: ${metadata.title}`

      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: fileName,
        message: commitMessage,
        content: Buffer.from(fileContent, 'utf8').toString('base64'),
        sha: existingFile && 'sha' in existingFile ? existingFile.sha : undefined,
      })

      return {
        success: true,
        url: `https://github.com/${this.owner}/${this.repo}/blob/main/${fileName}`,
        sha: data.content?.sha
      }
    } catch (error) {
      console.error('GitHub publish error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async updateArticle(
    fileName: string,
    metadata: ZennArticleMetadata,
    content: string
  ): Promise<PublishResult> {
    try {
      const fileContent = this.formatZennArticle(metadata, content)

      // 既存ファイルの取得
      const { data: existingFile } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fileName,
      })

      if (!('sha' in existingFile)) {
        throw new Error('File not found')
      }

      const { data } = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: fileName,
        message: `Update article: ${metadata.title}`,
        content: Buffer.from(fileContent, 'utf8').toString('base64'),
        sha: existingFile.sha,
      })

      return {
        success: true,
        url: `https://github.com/${this.owner}/${this.repo}/blob/main/${fileName}`,
        sha: data.content?.sha
      }
    } catch (error) {
      console.error('GitHub update error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async deleteArticle(fileName: string): Promise<PublishResult> {
    try {
      // 既存ファイルの取得
      const { data: existingFile } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: fileName,
      })

      if (!('sha' in existingFile)) {
        throw new Error('File not found')
      }

      await this.octokit.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: fileName,
        message: `Delete article: ${fileName}`,
        sha: existingFile.sha,
      })

      return {
        success: true
      }
    } catch (error) {
      console.error('GitHub delete error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async listArticles(): Promise<string[]> {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'articles',
      })

      if (Array.isArray(data)) {
        return data
          .filter(file => file.name.endsWith('.md'))
          .map(file => file.name)
      }

      return []
    } catch (error) {
      console.error('GitHub list error:', error)
      return []
    }
  }

  async getRepoInfo() {
    try {
      const { data } = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo,
      })

      return {
        name: data.name,
        full_name: data.full_name,
        html_url: data.html_url,
        description: data.description,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('GitHub repo info error:', error)
      return null
    }
  }
}

export const githubService = new GitHubService() 