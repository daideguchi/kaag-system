import { NextRequest, NextResponse } from 'next/server'
import { schedulerService } from '@/lib/scheduler'

export async function GET() {
  try {
    const schedules = await schedulerService.getSchedules()
    
    return NextResponse.json({
      success: true,
      data: schedules,
      count: schedules.length
    })
  } catch (error) {
    console.error('Get schedules error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get schedules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, cron_pattern, enabled, task_type, filters } = body
    
    if (!name || !cron_pattern || !task_type) {
      return NextResponse.json(
        { error: 'Name, cron_pattern, and task_type are required' },
        { status: 400 }
      )
    }

    const schedule = await schedulerService.createSchedule({
      name,
      description,
      cron_pattern,
      enabled: enabled ?? true,
      task_type,
      filters
    })
    
    return NextResponse.json({
      success: true,
      data: schedule
    })
  } catch (error) {
    console.error('Create schedule error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 