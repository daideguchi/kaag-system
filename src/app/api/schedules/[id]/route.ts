import { NextRequest, NextResponse } from 'next/server'
import { schedulerService } from '@/lib/scheduler'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const schedule = await schedulerService.updateSchedule(id, body)
    
    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    console.error('Update schedule error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    await schedulerService.deleteSchedule(id)
    
    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully'
    })
  } catch (error) {
    console.error('Delete schedule error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 