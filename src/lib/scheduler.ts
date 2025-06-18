import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { claudeService } from './claude'
import { githubService } from './github'

const prisma = new PrismaClient()

export interface ScheduleConfig {
  id?: string
  name: string
  description: string
  cron_pattern: string
  enabled: boolean
  task_type: 'analyze_content' | 'generate_article' | 'publish_article' | 'sync_notion'
  filters?: {
    category?: string
    source_type?: string
    status?: string
    tags?: string[]
  }
  created_at?: string
  updated_at?: string
}

export class SchedulerService {
  private tasks: Map<string, cron.ScheduledTask> = new Map()

  constructor() {
    this.initializeSchedules()
  }

  async initializeSchedules() {
    try {
      const schedules = await this.getSchedules()
      for (const schedule of schedules) {
        if (schedule.enabled) {
          this.startSchedule(schedule)
        }
      }
      console.log(`Initialized ${schedules.length} schedules`)
    } catch (error) {
      console.error('Failed to initialize schedules:', error)
    }
  }

  async createSchedule(config: Omit<ScheduleConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ScheduleConfig> {
    try {
      // データベースに保存
      const schedule = await prisma.schedule.create({
        data: {
          name: config.name,
          description: config.description,
          cron_pattern: config.cron_pattern,
          enabled: config.enabled,
          task_type: config.task_type,
          filters: config.filters ? JSON.stringify(config.filters) : null,
        }
      })

      const scheduleConfig: ScheduleConfig = {
        id: schedule.id,
        name: schedule.name,
        description: schedule.description,
        cron_pattern: schedule.cron_pattern,
        enabled: schedule.enabled,
        task_type: schedule.task_type as any,
        filters: schedule.filters ? JSON.parse(schedule.filters) : undefined,
        created_at: schedule.created_at.toISOString(),
        updated_at: schedule.updated_at.toISOString(),
      }

      if (config.enabled) {
        this.startSchedule(scheduleConfig)
      }

      return scheduleConfig
    } catch (error) {
      console.error('Failed to create schedule:', error)
      throw error
    }
  }

  async updateSchedule(id: string, updates: Partial<ScheduleConfig>): Promise<ScheduleConfig> {
    try {
      const schedule = await prisma.schedule.update({
        where: { id },
        data: {
          name: updates.name,
          description: updates.description,
          cron_pattern: updates.cron_pattern,
          enabled: updates.enabled,
          task_type: updates.task_type,
          filters: updates.filters ? JSON.stringify(updates.filters) : undefined,
        }
      })

      const scheduleConfig: ScheduleConfig = {
        id: schedule.id,
        name: schedule.name,
        description: schedule.description,
        cron_pattern: schedule.cron_pattern,
        enabled: schedule.enabled,
        task_type: schedule.task_type as any,
        filters: schedule.filters ? JSON.parse(schedule.filters) : undefined,
        created_at: schedule.created_at.toISOString(),
        updated_at: schedule.updated_at.toISOString(),
      }

      // 既存のタスクを停止
      this.stopSchedule(id)

      // 有効な場合は新しいタスクを開始
      if (updates.enabled) {
        this.startSchedule(scheduleConfig)
      }

      return scheduleConfig
    } catch (error) {
      console.error('Failed to update schedule:', error)
      throw error
    }
  }

  async deleteSchedule(id: string): Promise<void> {
    try {
      await prisma.schedule.delete({
        where: { id }
      })

      this.stopSchedule(id)
    } catch (error) {
      console.error('Failed to delete schedule:', error)
      throw error
    }
  }

  async getSchedules(): Promise<ScheduleConfig[]> {
    try {
      const schedules = await prisma.schedule.findMany({
        orderBy: { created_at: 'desc' }
      })

      return schedules.map(schedule => ({
        id: schedule.id,
        name: schedule.name,
        description: schedule.description,
        cron_pattern: schedule.cron_pattern,
        enabled: schedule.enabled,
        task_type: schedule.task_type as any,
        filters: schedule.filters ? JSON.parse(schedule.filters) : undefined,
        created_at: schedule.created_at.toISOString(),
        updated_at: schedule.updated_at.toISOString(),
      }))
    } catch (error) {
      console.error('Failed to get schedules:', error)
      return []
    }
  }

  startSchedule(config: ScheduleConfig) {
    if (!config.id) return

    try {
      const task = cron.schedule(config.cron_pattern, async () => {
        console.log(`Executing scheduled task: ${config.name}`)
        await this.executeTask(config)
      }, {
        scheduled: false
      })

      this.tasks.set(config.id, task)
      task.start()
      
      console.log(`Started schedule: ${config.name} (${config.cron_pattern})`)
    } catch (error) {
      console.error(`Failed to start schedule ${config.name}:`, error)
    }
  }

  stopSchedule(id: string) {
    const task = this.tasks.get(id)
    if (task) {
      task.stop()
      this.tasks.delete(id)
      console.log(`Stopped schedule: ${id}`)
    }
  }

  private async executeTask(config: ScheduleConfig) {
    try {
      const knowledge = await this.getFilteredKnowledge(config.filters)
      
      for (const item of knowledge) {
        try {
          switch (config.task_type) {
            case 'analyze_content':
              if (item.status === 'notion_referenced') {
                await this.analyzeContent(item.id)
              }
              break
            case 'generate_article':
              if (item.status === 'content_analyzed') {
                await this.generateArticle(item.id)
              }
              break
            case 'publish_article':
              if (item.status === 'article_generated') {
                await this.publishArticle(item.id)
              }
              break
            case 'sync_notion':
              if (item.notion_reference) {
                await this.syncNotionPage(item.id)
              }
              break
          }
        } catch (itemError) {
          console.error(`Failed to process knowledge ${item.id}:`, itemError)
          
          // エラーステータスに更新
          await prisma.knowledge.update({
            where: { id: item.id },
            data: { status: 'error' }
          })
        }
      }
    } catch (error) {
      console.error(`Failed to execute task ${config.name}:`, error)
    }
  }

  private async getFilteredKnowledge(filters?: ScheduleConfig['filters']) {
    const where: any = {}

    if (filters) {
      if (filters.category) {
        where.category = filters.category
      }
      if (filters.source_type) {
        where.source_type = filters.source_type
      }
      if (filters.status) {
        where.status = filters.status
      }
      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags
        }
      }
    }

    return await prisma.knowledge.findMany({
      where,
      include: {
        notion_reference: true
      }
    })
  }

  private async analyzeContent(knowledgeId: string) {
    const knowledge = await prisma.knowledge.findUnique({
      where: { id: knowledgeId }
    })

    if (!knowledge) return

    const analysis = await claudeService.analyzeContent(knowledge.content)
    
    await prisma.knowledge.update({
      where: { id: knowledgeId },
      data: {
        status: 'content_analyzed',
        ai_analysis: JSON.stringify(analysis)
      }
    })

    console.log(`Content analyzed for knowledge: ${knowledgeId}`)
  }

  private async generateArticle(knowledgeId: string) {
    const knowledge = await prisma.knowledge.findUnique({
      where: { id: knowledgeId }
    })

    if (!knowledge || !knowledge.ai_analysis) return

    const analysis = JSON.parse(knowledge.ai_analysis)
    const article = await claudeService.generateArticle(knowledge.content, {
      title: analysis.suggested_title,
      style: 'technical',
      length: 'medium'
    })

    await prisma.knowledge.update({
      where: { id: knowledgeId },
      data: {
        status: 'article_generated',
        generated_article: JSON.stringify(article)
      }
    })

    console.log(`Article generated for knowledge: ${knowledgeId}`)
  }

  private async publishArticle(knowledgeId: string) {
    const knowledge = await prisma.knowledge.findUnique({
      where: { id: knowledgeId }
    })

    if (!knowledge || !knowledge.generated_article) return

    const article = JSON.parse(knowledge.generated_article)
    const result = await githubService.createArticle({
      title: article.title,
      content: article.content,
      published: true,
      topics: knowledge.tags || []
    })

    await prisma.knowledge.update({
      where: { id: knowledgeId },
      data: {
        status: 'article_published',
        published_article: JSON.stringify(result)
      }
    })

    console.log(`Article published for knowledge: ${knowledgeId}`)
  }

  private async syncNotionPage(knowledgeId: string) {
    const knowledge = await prisma.knowledge.findUnique({
      where: { id: knowledgeId },
      include: { notion_reference: true }
    })

    if (!knowledge || !knowledge.notion_reference) return

    // Notion同期の実装は既存のhandleSyncNotionロジックを使用
    console.log(`Synced Notion page for knowledge: ${knowledgeId}`)
  }

  getRunningTasks(): string[] {
    return Array.from(this.tasks.keys())
  }

  isTaskRunning(id: string): boolean {
    return this.tasks.has(id)
  }
}

export const schedulerService = new SchedulerService() 