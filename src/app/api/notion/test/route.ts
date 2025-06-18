import { NextResponse } from 'next/server'
import { notionService } from '@/lib/notion'

export async function GET() {
  try {
    const isConnected = await notionService.testConnection()
    
    return NextResponse.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'Notion API connection successful' : 'Notion API connection failed'
    })
  } catch (error) {
    console.error('Notion connection test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        connected: false,
        error: 'Failed to test Notion connection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 