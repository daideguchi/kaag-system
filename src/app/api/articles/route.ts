import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/articles - 記事一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (status && status !== 'all') {
      if (status === 'published') {
        where.published = true
      } else if (status === 'draft') {
        where.published = false
      }
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        knowledge: true // categoryはString型のフィールドのため、includeを削除
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: articles.map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        emoji: article.emoji,
        type: article.type,
        topics: article.topics ? JSON.parse(article.topics) : [],
        published: article.published,
        metadata: article.metadata ? JSON.parse(article.metadata) : {},
        github_url: article.github_url,
        github_sha: article.github_sha,
        published_at: article.published_at?.toISOString(),
        created_at: article.created_at.toISOString(),
        updated_at: article.updated_at.toISOString(),
        knowledge: article.knowledge ? {
          id: article.knowledge.id,
          title: article.knowledge.title,
          category: article.knowledge.category || 'uncategorized'
        } : null
      }))
    })
  } catch (error) {
    console.error('GET /api/articles error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

// PUT /api/articles - 記事更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, content, emoji, type, topics, published } = body

    const article = await prisma.article.update({
      where: { id },
      data: {
        title,
        content,
        emoji,
        type,
        topics: topics ? JSON.stringify(topics) : null,
        published,
        updated_at: new Date()
      },
      include: {
        knowledge: true // categoryはString型のフィールドのため、includeを削除
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: article.id,
        title: article.title,
        content: article.content,
        emoji: article.emoji,
        type: article.type,
        topics: article.topics ? JSON.parse(article.topics) : [],
        published: article.published,
        metadata: article.metadata ? JSON.parse(article.metadata) : {},
        github_url: article.github_url,
        github_sha: article.github_sha,
        published_at: article.published_at?.toISOString(),
        created_at: article.created_at.toISOString(),
        updated_at: article.updated_at.toISOString(),
        knowledge: article.knowledge ? {
          id: article.knowledge.id,
          title: article.knowledge.title,
          category: article.knowledge.category || 'uncategorized'
        } : null
      }
    })
  } catch (error) {
    console.error('PUT /api/articles error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

// DELETE /api/articles - 記事削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      )
    }

    await prisma.article.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/articles error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete article' },
      { status: 500 }
    )
  }
} 