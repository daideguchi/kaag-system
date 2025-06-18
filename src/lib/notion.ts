import { Client } from '@notionhq/client'

export interface NotionPage {
  id: string
  title: string
  content: string
  url: string
  created_time: string
  last_edited_time: string
  properties: any
}

export interface NotionDatabase {
  id: string
  title: string
  url: string
  properties: any
}

export class NotionService {
  private notion: Client
  
  constructor() {
    if (!process.env.NOTION_TOKEN) {
      console.warn('NOTION_TOKEN environment variable is not set')
      // 空のトークンでクライアントを初期化（テスト用）
      this.notion = new Client({ auth: '' })
    } else {
      this.notion = new Client({
        auth: process.env.NOTION_TOKEN,
      })
    }
  }

  async getPage(pageId: string): Promise<NotionPage | null> {
    try {
      // ページIDからハイフンを除去してクリーンアップ
      const cleanPageId = pageId.replace(/[-]/g, '')
      
      const page = await this.notion.pages.retrieve({ page_id: cleanPageId })
      const blocks = await this.notion.blocks.children.list({
        block_id: cleanPageId,
      })

      // ページタイトルの取得
      let title = 'Untitled'
      if ('properties' in page) {
        const titleProperty = Object.values(page.properties).find(
          (prop: any) => prop.type === 'title'
        ) as any
        
        if (titleProperty && titleProperty.title && titleProperty.title[0]) {
          title = titleProperty.title[0].plain_text
        }
      }

      // ブロックからコンテンツを抽出
      const content = this.extractContentFromBlocks(blocks.results)

      return {
        id: page.id,
        title,
        content,
        url: `https://notion.so/${cleanPageId}`,
        created_time: page.created_time,
        last_edited_time: page.last_edited_time,
        properties: 'properties' in page ? page.properties : {}
      }
    } catch (error) {
      console.error('Notion getPage error:', error)
      return null
    }
  }

  async getPageFromUrl(url: string): Promise<NotionPage | null> {
    try {
      // URLからページIDを抽出
      const pageId = this.extractPageIdFromUrl(url)
      if (!pageId) {
        throw new Error('Invalid Notion URL')
      }
      
      return await this.getPage(pageId)
    } catch (error) {
      console.error('Notion getPageFromUrl error:', error)
      return null
    }
  }

  async searchPages(query: string, filter?: any): Promise<NotionPage[]> {
    try {
      const response = await this.notion.search({
        query,
        filter: filter || {
          value: 'page',
          property: 'object'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        }
      })

      const pages = await Promise.all(
        response.results
          .filter((result: any) => result.object === 'page')
          .map(async (page: any) => {
            const fullPage = await this.getPage(page.id)
            return fullPage
          })
      )

      return pages.filter((page): page is NotionPage => page !== null)
    } catch (error) {
      console.error('Notion searchPages error:', error)
      return []
    }
  }

  async getDatabases(): Promise<NotionDatabase[]> {
    try {
      const response = await this.notion.search({
        filter: {
          value: 'database',
          property: 'object'
        }
      })

      return response.results
        .filter((result: any) => result.object === 'database')
        .map((db: any) => ({
          id: db.id,
          title: db.title?.[0]?.plain_text || 'Untitled Database',
          url: db.url,
          properties: db.properties
        }))
    } catch (error) {
      console.error('Notion getDatabases error:', error)
      return []
    }
  }

  async getDatabasePages(databaseId: string): Promise<NotionPage[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: databaseId,
        sorts: [
          {
            property: 'last_edited_time',
            direction: 'descending'
          }
        ]
      })

      const pages = await Promise.all(
        response.results.map(async (page: any) => {
          const fullPage = await this.getPage(page.id)
          return fullPage
        })
      )

      return pages.filter((page): page is NotionPage => page !== null)
    } catch (error) {
      console.error('Notion getDatabasePages error:', error)
      return []
    }
  }

  private extractPageIdFromUrl(url: string): string | null {
    // Notion URLからページIDを抽出
    const patterns = [
      /notion\.so\/([a-f0-9]{32})/,
      /notion\.so\/.*-([a-f0-9]{32})/,
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1].replace(/[-]/g, '')
      }
    }

    return null
  }

  private extractContentFromBlocks(blocks: any[]): string {
    let content = ''

    for (const block of blocks) {
      switch (block.type) {
        case 'paragraph':
          content += this.extractTextFromRichText(block.paragraph?.rich_text || []) + '\n\n'
          break
        case 'heading_1':
          content += '# ' + this.extractTextFromRichText(block.heading_1?.rich_text || []) + '\n\n'
          break
        case 'heading_2':
          content += '## ' + this.extractTextFromRichText(block.heading_2?.rich_text || []) + '\n\n'
          break
        case 'heading_3':
          content += '### ' + this.extractTextFromRichText(block.heading_3?.rich_text || []) + '\n\n'
          break
        case 'bulleted_list_item':
          content += '- ' + this.extractTextFromRichText(block.bulleted_list_item?.rich_text || []) + '\n'
          break
        case 'numbered_list_item':
          content += '1. ' + this.extractTextFromRichText(block.numbered_list_item?.rich_text || []) + '\n'
          break
        case 'code':
          const language = block.code?.language || ''
          const codeText = this.extractTextFromRichText(block.code?.rich_text || [])
          content += '```' + language + '\n' + codeText + '\n```\n\n'
          break
        case 'quote':
          content += '> ' + this.extractTextFromRichText(block.quote?.rich_text || []) + '\n\n'
          break
        case 'divider':
          content += '---\n\n'
          break
        case 'image':
          if (block.image?.external?.url) {
            content += `![Image](${block.image.external.url})\n\n`
          } else if (block.image?.file?.url) {
            content += `![Image](${block.image.file.url})\n\n`
          }
          break
        default:
          // その他のブロックタイプは基本的なテキスト抽出を試行
          if (block[block.type]?.rich_text) {
            content += this.extractTextFromRichText(block[block.type].rich_text) + '\n\n'
          }
      }
    }

    return content.trim()
  }

  private extractTextFromRichText(richText: any[]): string {
    return richText
      .map((text: any) => {
        let content = text.plain_text || ''
        
        // フォーマットを適用
        if (text.annotations?.bold) {
          content = `**${content}**`
        }
        if (text.annotations?.italic) {
          content = `*${content}*`
        }
        if (text.annotations?.code) {
          content = `\`${content}\``
        }
        if (text.annotations?.strikethrough) {
          content = `~~${content}~~`
        }
        if (text.href) {
          content = `[${content}](${text.href})`
        }
        
        return content
      })
      .join('')
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!process.env.NOTION_TOKEN) {
        return { success: false, error: 'NOTION_TOKEN is not configured' }
      }

      // 簡単なAPIコールでトークンをテスト
      await this.notion.users.me()
      return { success: true }
    } catch (error: any) {
      console.error('Notion connection test failed:', error)
      return { 
        success: false, 
        error: error.code === 'unauthorized' 
          ? 'Invalid Notion token. Please check your NOTION_TOKEN environment variable.' 
          : error.message || 'Unknown error'
      }
    }
  }
}

export const notionService = new NotionService() 