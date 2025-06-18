import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ContentAnalysis {
  summary: string
  key_topics: string[]
  suggested_title: string
  estimated_article_length: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  target_audience: string
  recommended_structure: string[]
}

export interface GeneratedArticle {
  title: string
  emoji: string
  type: 'tech' | 'idea'
  topics: string[]
  published: boolean
  content: string
  metadata: {
    estimated_reading_time: number
    word_count: number
    difficulty: string
  }
}

export class ClaudeService {
  private static instance: ClaudeService
  
  static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService()
    }
    return ClaudeService.instance
  }

  async analyzeContent(content: string, title?: string): Promise<ContentAnalysis> {
    try {
      const prompt = `
以下のナレッジコンテンツを分析して、技術記事作成のための情報を抽出してください。

タイトル: ${title || '未設定'}
コンテンツ:
${content}

以下の形式でJSON形式で回答してください：
{
  "summary": "コンテンツの要約（200文字程度）",
  "key_topics": ["キートピック1", "キートピック2", "キートピック3"],
  "suggested_title": "推奨記事タイトル",
  "estimated_article_length": 文字数（数値）,
  "difficulty_level": "beginner|intermediate|advanced",
  "target_audience": "対象読者層の説明",
  "recommended_structure": ["章構成1", "章構成2", "章構成3"]
}
`

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
      const analysis = JSON.parse(responseText) as ContentAnalysis
      
      return analysis
    } catch (error) {
      console.error('Content analysis error:', error)
      throw new Error('コンテンツ分析に失敗しました')
    }
  }

  async generateArticle(
    content: string, 
    analysis: ContentAnalysis,
    options?: {
      style?: 'formal' | 'casual' | 'technical'
      includeCodeExamples?: boolean
      targetLength?: number
    }
  ): Promise<GeneratedArticle> {
    try {
      const style = options?.style || 'casual'
      const includeCode = options?.includeCodeExamples || true
      const targetLength = options?.targetLength || analysis.estimated_article_length

      const prompt = `
以下の情報を基に、Zenn向けの技術記事を生成してください。

元のコンテンツ:
${content}

分析結果:
- 要約: ${analysis.summary}
- キートピック: ${analysis.key_topics.join(', ')}
- 推奨タイトル: ${analysis.suggested_title}
- 難易度: ${analysis.difficulty_level}
- 対象読者: ${analysis.target_audience}

記事要件:
- スタイル: ${style}
- 目標文字数: ${targetLength}文字
- コード例を含む: ${includeCode ? 'はい' : 'いいえ'}
- 構成: ${analysis.recommended_structure.join(' → ')}

以下の形式でJSON形式で回答してください：
{
  "title": "記事タイトル",
  "emoji": "記事の絵文字（1文字）",
  "type": "tech",
  "topics": ["タグ1", "タグ2", "タグ3"],
  "published": false,
  "content": "# 記事タイトル\\n\\n記事の本文をMarkdown形式で...",
  "metadata": {
    "estimated_reading_time": 読了時間（分）,
    "word_count": 文字数,
    "difficulty": "難易度"
  }
}

記事は以下の構造で作成してください：
1. 導入（問題提起・記事の目的）
2. 本文（技術的な説明、実装例など）
3. まとめ（学習のポイント、次のステップ）

Zennの記事として適切な形式で、読みやすく実用的な内容にしてください。
`

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
      const article = JSON.parse(responseText) as GeneratedArticle
      
      return article
    } catch (error) {
      console.error('Article generation error:', error)
      throw new Error('記事生成に失敗しました')
    }
  }

  async improveArticle(content: string, feedback: string): Promise<string> {
    try {
      const prompt = `
以下の記事を改善してください。

現在の記事:
${content}

改善要求:
${feedback}

改善された記事をMarkdown形式で返してください。
`

      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      return response.content[0].type === 'text' ? response.content[0].text : ''
    } catch (error) {
      console.error('Article improvement error:', error)
      throw new Error('記事改善に失敗しました')
    }
  }

  async generateTitle(content: string, existingTitles: string[] = []): Promise<string[]> {
    try {
      const prompt = `
以下のコンテンツに対して、魅力的な記事タイトルを5つ提案してください。

コンテンツ:
${content}

既存タイトル（重複を避ける）:
${existingTitles.join('\n')}

要件:
- Zennで注目を集めやすいタイトル
- 技術的な内容が明確
- 読者の興味を引く
- 30文字以内

タイトルのみを配列形式で返してください：
["タイトル1", "タイトル2", "タイトル3", "タイトル4", "タイトル5"]
`

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const responseText = response.content[0].type === 'text' ? response.content[0].text : ''
      return JSON.parse(responseText) as string[]
    } catch (error) {
      console.error('Title generation error:', error)
      throw new Error('タイトル生成に失敗しました')
    }
  }
}

export const claudeService = ClaudeService.getInstance() 