import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { claudeService } from '@/lib/claude'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

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

    // Claude APIでコンテンツ分析
    const analysis = await claudeService.analyzeContent(
      knowledge.content,
      knowledge.title
    )

    // 分析結果をデータベースに保存
    const updatedKnowledge = await prisma.knowledge.update({
      where: { id },
      data: {
        content_analysis: JSON.stringify(analysis),
        updated_at: new Date()
      },
      // categoryはString型のフィールドのため、includeを削除
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedKnowledge.id,
        title: updatedKnowledge.title,
        content: updatedKnowledge.content,
        source_type: updatedKnowledge.source_type,
        source_url: updatedKnowledge.source_url,
        category: updatedKnowledge.category || 'uncategorized',
        tags: updatedKnowledge.tags ? JSON.parse(updatedKnowledge.tags) : [],
        created_at: updatedKnowledge.created_at.toISOString(),
        updated_at: updatedKnowledge.updated_at.toISOString(),
        status: 'content_analyzed',
        content_analysis: analysis,
        notion_reference: updatedKnowledge.source_type === 'notion' ? {
          page_id: updatedKnowledge.id,
          page_url: updatedKnowledge.source_url || '',
          page_title: updatedKnowledge.title,
          last_synced_at: updatedKnowledge.updated_at.toISOString()
        } : undefined
      }
    })
  } catch (error) {
    console.error('Content analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze content' },
      { status: 500 }
    )
  }
} 