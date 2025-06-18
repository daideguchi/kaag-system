import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { githubService } from '@/lib/github'
import { GeneratedArticle } from '@/lib/claude'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // ナレッジの取得
    const knowledge = await prisma.knowledge.findUnique({
      where: { id },
      include: {
        articles: true
      }
    })

    if (!knowledge) {
      return NextResponse.json(
        { success: false, error: 'Knowledge not found' },
        { status: 404 }
      )
    }

    // 生成された記事の確認
    if (!knowledge.generated_article) {
      return NextResponse.json(
        { success: false, error: 'Article generation required first' },
        { status: 400 }
      )
    }

    const generatedArticle = JSON.parse(knowledge.generated_article) as GeneratedArticle

    // GitHub APIで記事を公開
    const publishResult = await githubService.publishArticle(
      {
        title: generatedArticle.title,
        emoji: generatedArticle.emoji,
        type: generatedArticle.type,
        topics: generatedArticle.topics,
        published: true
      },
      generatedArticle.content
    )

    if (!publishResult.success) {
      return NextResponse.json(
        { success: false, error: publishResult.error || 'Failed to publish article' },
        { status: 500 }
      )
    }

    // 記事の公開状態を更新
    if (knowledge.articles.length > 0) {
      await prisma.article.update({
        where: { id: knowledge.articles[0].id },
        data: {
          published: true,
          github_url: publishResult.url,
          github_sha: publishResult.sha,
          published_at: new Date(),
          updated_at: new Date()
        }
      })
    }

    // ナレッジの状態を更新
    const updatedKnowledge = await prisma.knowledge.update({
      where: { id },
      data: {
        updated_at: new Date()
      },
      include: {
        // categoryはString型のフィールドのため、includeを削除
        articles: true
      }
    })

    // 公開ログを記録
    await prisma.articleLog.create({
      data: {
        article_id: knowledge.articles[0]?.id || '',
        action: 'published',
        details: JSON.stringify({
          github_url: publishResult.url,
          github_sha: publishResult.sha,
          published_at: new Date().toISOString()
        })
      }
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
          status: 'article_published',
          content_analysis: updatedKnowledge.content_analysis ? JSON.parse(updatedKnowledge.content_analysis) : null,
          generated_article: generatedArticle,
          notion_reference: updatedKnowledge.source_type === 'notion' ? {
            page_id: updatedKnowledge.id,
            page_url: updatedKnowledge.source_url || '',
            page_title: updatedKnowledge.title,
            last_synced_at: updatedKnowledge.updated_at.toISOString()
          } : undefined
        },
        publishResult: {
          url: publishResult.url,
          sha: publishResult.sha
        }
      }
    })
  } catch (error) {
    console.error('Article publish error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to publish article' },
      { status: 500 }
    )
  }
} 