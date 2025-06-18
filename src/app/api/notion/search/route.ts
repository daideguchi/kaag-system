import { NextRequest, NextResponse } from 'next/server'
import { notionService } from '@/lib/notion'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const pages = await notionService.searchPages(query)
    
    return NextResponse.json({
      success: true,
      data: pages,
      count: pages.length
    })
  } catch (error) {
    console.error('Notion search error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search Notion pages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 