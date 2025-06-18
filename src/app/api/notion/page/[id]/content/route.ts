import { NextRequest, NextResponse } from 'next/server'
import { getNotionClient } from '@/lib/notion'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pageId = params.id
    
    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'Page ID is required' },
        { status: 400 }
      )
    }

    const notion = getNotionClient()
    
    if (!notion) {
      return NextResponse.json(
        { success: false, error: 'Notion client not configured' },
        { status: 500 }
      )
    }

    // ページの内容を取得
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    })

    // ブロックをテキストに変換
    let content = ''
    for (const block of blocks.results) {
      if ('type' in block) {
        switch (block.type) {
          case 'paragraph':
            if (block.paragraph?.rich_text) {
              content += block.paragraph.rich_text.map(text => text.plain_text).join('') + '\n\n'
            }
            break
          case 'heading_1':
            if (block.heading_1?.rich_text) {
              content += '# ' + block.heading_1.rich_text.map(text => text.plain_text).join('') + '\n\n'
            }
            break
          case 'heading_2':
            if (block.heading_2?.rich_text) {
              content += '## ' + block.heading_2.rich_text.map(text => text.plain_text).join('') + '\n\n'
            }
            break
          case 'heading_3':
            if (block.heading_3?.rich_text) {
              content += '### ' + block.heading_3.rich_text.map(text => text.plain_text).join('') + '\n\n'
            }
            break
          case 'bulleted_list_item':
            if (block.bulleted_list_item?.rich_text) {
              content += '• ' + block.bulleted_list_item.rich_text.map(text => text.plain_text).join('') + '\n'
            }
            break
          case 'numbered_list_item':
            if (block.numbered_list_item?.rich_text) {
              content += '1. ' + block.numbered_list_item.rich_text.map(text => text.plain_text).join('') + '\n'
            }
            break
          case 'to_do':
            if (block.to_do?.rich_text) {
              const checked = block.to_do.checked ? '[x]' : '[ ]'
              content += checked + ' ' + block.to_do.rich_text.map(text => text.plain_text).join('') + '\n'
            }
            break
          case 'quote':
            if (block.quote?.rich_text) {
              content += '> ' + block.quote.rich_text.map(text => text.plain_text).join('') + '\n\n'
            }
            break
          case 'code':
            if (block.code?.rich_text) {
              content += '```\n' + block.code.rich_text.map(text => text.plain_text).join('') + '\n```\n\n'
            }
            break
          default:
            // その他のブロック型は無視
            break
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        pageId,
        content: content.trim(),
        blockCount: blocks.results.length
      }
    })

  } catch (error) {
    console.error('Error fetching page content:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch page content'
      },
      { status: 500 }
    )
  }
} 