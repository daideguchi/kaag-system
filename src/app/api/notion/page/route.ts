import { NextRequest, NextResponse } from 'next/server'
import { notionService } from '@/lib/notion'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const page = await notionService.getPageFromUrl(url)
    
    if (!page) {
      return NextResponse.json({ error: 'Page not found or invalid URL' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: page
    })
  } catch (error) {
    console.error('Notion page fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Notion page',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 