import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/knowledge - ナレッジ一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (category && category !== 'all') {
      where.category_id = category
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const knowledge = await prisma.knowledge.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      }
    })

    // ステータスでフィルタ（DBに保存されていない場合のデフォルト処理）
    let filteredKnowledge = knowledge
    if (status && status !== 'all') {
      // TODO: ステータス管理をDBに追加後、ここを修正
      filteredKnowledge = knowledge.filter(k => {
        // 暫定的にsource_typeに基づいてステータスを判定
        if (k.source_type === 'notion') return status === 'notion_referenced'
        if (k.source_type === 'file') return status === 'notion_referenced'
        return true
      })
    }

    return NextResponse.json({
      success: true,
      data: filteredKnowledge.map(k => ({
        id: k.id,
        title: k.title,
        content: k.content,
        source_type: k.source_type,
        source_url: k.source_url,
        category: k.category || 'uncategorized',
        tags: k.tags ? JSON.parse(k.tags) : [],
        created_at: k.created_at.toISOString(),
        updated_at: k.updated_at.toISOString(),
        status: k.source_type === 'notion' ? 'notion_referenced' : 'notion_referenced', // 暫定
        notion_reference: k.source_type === 'notion' ? {
          page_id: k.id,
          page_url: k.source_url || '',
          page_title: k.title,
          last_synced_at: k.updated_at.toISOString()
        } : undefined
      }))
    })
  } catch (error) {
    console.error('GET /api/knowledge error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch knowledge' },
      { status: 500 }
    )
  }
}

// POST /api/knowledge - 新しいナレッジ作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, source_type, source_url, category, tags, notion_reference } = body

    // カテゴリの取得または作成
    let categoryRecord = null
    if (category && category !== 'tech') {
      categoryRecord = await prisma.category.findFirst({
        where: { name: category }
      })
      
      if (!categoryRecord) {
        categoryRecord = await prisma.category.create({
          data: {
            name: category,
            description: `Auto-created category: ${category}`
          }
        })
      }
    }

    // トランザクションでナレッジとNotion参照を作成
    const result = await prisma.$transaction(async (tx) => {
      // ナレッジ作成
      const knowledge = await tx.knowledge.create({
        data: {
          title,
          content,
          source_type,
          source_url,
          category: category || 'uncategorized',
          tags: tags ? JSON.stringify(tags) : null
        }
      })

      // Notion参照作成（source_typeがnotionの場合）
      let notionRef = null
      if (source_type === 'notion' && notion_reference) {
        // コンテンツハッシュを計算
        const crypto = await import('crypto')
        const contentHash = crypto.createHash('sha256')
          .update(title + content)
          .digest('hex')

        notionRef = await tx.notionReference.create({
          data: {
            knowledge_id: knowledge.id,
            page_id: notion_reference.page_id,
            page_title: notion_reference.page_title,
            page_url: notion_reference.page_url,
            auto_sync_enabled: notion_reference.auto_sync_enabled ?? true,
            sync_frequency: notion_reference.sync_frequency || 'daily',
            content_hash: contentHash,
            notion_updated_at: new Date()
          }
        })

        console.log(`🔄 自動同期が有効化されました: ${notion_reference.page_title} (頻度: ${notion_reference.sync_frequency || 'daily'})`)
      }

      return { knowledge, notionRef }
    })

    const { knowledge, notionRef } = result

    return NextResponse.json({
      success: true,
      data: {
        id: knowledge.id,
        title: knowledge.title,
        content: knowledge.content,
        source_type: knowledge.source_type,
        source_url: knowledge.source_url,
        category: knowledge.category || 'uncategorized',
        tags: knowledge.tags ? JSON.parse(knowledge.tags) : [],
        created_at: knowledge.created_at.toISOString(),
        updated_at: knowledge.updated_at.toISOString(),
        status: 'notion_referenced',
        notion_reference: notionRef ? {
          id: notionRef.id,
          page_id: notionRef.page_id,
          page_url: notionRef.page_url,
          page_title: notionRef.page_title,
          last_synced_at: notionRef.last_synced_at?.toISOString() || null,
          auto_sync_enabled: notionRef.auto_sync_enabled,
          sync_frequency: notionRef.sync_frequency
        } : undefined
      },
      message: source_type === 'notion' && notion_reference ? 
        `✅ Notionページ「${title}」を半永久的な自動同期対象として追加しました` : 
        'ナレッジを作成しました'
    })
  } catch (error) {
    console.error('POST /api/knowledge error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create knowledge' },
      { status: 500 }
    )
  }
}

// PUT /api/knowledge - ナレッジ更新
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, content, category, tags, status } = body

    const knowledge = await prisma.knowledge.update({
      where: { id },
      data: {
        title,
        content,
        tags: tags ? JSON.stringify(tags) : null,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: knowledge.id,
        title: knowledge.title,
        content: knowledge.content,
        source_type: knowledge.source_type,
        source_url: knowledge.source_url,
        category: knowledge.category || 'uncategorized',
        tags: knowledge.tags ? JSON.parse(knowledge.tags) : [],
        created_at: knowledge.created_at.toISOString(),
        updated_at: knowledge.updated_at.toISOString(),
        status: status || 'notion_referenced'
      }
    })
  } catch (error) {
    console.error('PUT /api/knowledge error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update knowledge' },
      { status: 500 }
    )
  }
}

// DELETE /api/knowledge - ナレッジ削除
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

    await prisma.knowledge.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Knowledge deleted successfully'
    })
  } catch (error) {
    console.error('DELETE /api/knowledge error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete knowledge' },
      { status: 500 }
    )
  }
} 