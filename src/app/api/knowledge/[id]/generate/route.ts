import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { claudeService, ContentAnalysis } from '@/lib/claude'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { options } = body

    // ナレッジの取得
    const knowledge = await prisma.knowledge.findUnique({
      where: { id }
    })

    if (!knowledge) {
      return NextResponse.json(
        { success: false, error: 'Knowledge not found' },
        { status: 404 }
      )
    }

    // コンテンツ分析結果の確認
    if (!knowledge.content_analysis) {
      return NextResponse.json(
        { success: false, error: 'Content analysis required first' },
        { status: 400 }
      )
    }

    const analysis = JSON.parse(knowledge.content_analysis) as ContentAnalysis

    // Claude APIで記事生成
    const generatedArticle = await claudeService.generateArticle(
      knowledge.content,
      analysis,
      options
    )

    // 記事をデータベースに保存
    const article = await prisma.article.create({
      data: {
        title: generatedArticle.title,
        content: generatedArticle.content,
        emoji: generatedArticle.emoji,
        type: generatedArticle.type,
        topics: JSON.stringify(generatedArticle.topics),
        published: generatedArticle.published,
        metadata: JSON.stringify(generatedArticle.metadata),
        knowledge_id: knowledge.id
      }
    })

    // ナレッジの状態を更新
    const updatedKnowledge = await prisma.knowledge.update({
      where: { id },
      data: {
        generated_article: JSON.stringify(generatedArticle),
        updated_at: new Date()
      },
      // categoryはString型のフィールドのため、includeを削除
    })

    return NextResponse.json({
      success: true,
      data: {
        knowledge: {
          id: updatedKnowledge.id,
          title: updatedKnowledge.title,
          content: updatedKnowledge.content,
          source_type: updatedKnowledge.source_type,
          source_url: updatedKnowledge.source_url,
          category: updatedKnowledge.category || 'uncategorized',
          tags: updatedKnowledge.tags ? JSON.parse(updatedKnowledge.tags) : [],
          created_at: updatedKnowledge.created_at.toISOString(),
          updated_at: updatedKnowledge.updated_at.toISOString(),
          status: 'article_generated',
          content_analysis: analysis,
          generated_article: generatedArticle,
          notion_reference: updatedKnowledge.source_type === 'notion' ? {
            page_id: updatedKnowledge.id,
            page_url: updatedKnowledge.source_url || '',
            page_title: updatedKnowledge.title,
            last_synced_at: updatedKnowledge.updated_at.toISOString()
          } : undefined
        },
        article: {
          id: article.id,
          title: article.title,
          content: article.content,
          emoji: article.emoji,
          type: article.type,
          topics: JSON.parse(article.topics || '[]'),
          published: article.published,
          metadata: JSON.parse(article.metadata || '{}'),
          created_at: article.created_at.toISOString(),
          updated_at: article.updated_at.toISOString()
        }
      }
    })
  } catch (error) {
    console.error('Article generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate article' },
      { status: 500 }
    )
  }
} 