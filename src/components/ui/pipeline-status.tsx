import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Brain, 
  Wand2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react'
import type { KnowledgeStatus } from '@/types'

interface PipelineStatusProps {
  status: KnowledgeStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showLabel?: boolean
}

const statusConfig = {
  notion_referenced: {
    label: 'Notion参照済み',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileText,
    description: 'Notionページが参照されました'
  },
  content_analyzed: {
    label: '内容分析済み',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Brain,
    description: 'AIが内容を理解・分析しました'
  },
  article_generated: {
    label: '記事生成済み',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Wand2,
    description: 'Zenn記事が生成されました'
  },
  article_published: {
    label: '公開済み',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle,
    description: '記事が公開されました'
  },
  error: {
    label: 'エラー',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    description: 'エラーが発生しました'
  }
}

export function PipelineStatus({ 
  status, 
  size = 'md', 
  showIcon = true, 
  showLabel = true 
}: PipelineStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${sizeClasses[size]} flex items-center gap-1.5`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{config.label}</span>}
    </Badge>
  )
}

interface PipelineProgressProps {
  currentStatus: KnowledgeStatus
  showLabels?: boolean
}

export function PipelineProgress({ currentStatus, showLabels = true }: PipelineProgressProps) {
  const steps: KnowledgeStatus[] = [
    'notion_referenced',
    'content_analyzed', 
    'article_generated',
    'article_published'
  ]

  const getCurrentStepIndex = () => {
    if (currentStatus === 'error') return -1
    return steps.indexOf(currentStatus)
  }

  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="flex items-center space-x-2">
      {steps.map((step, index) => {
        const config = statusConfig[step]
        const Icon = config.icon
        const isCompleted = index <= currentStepIndex
        const isCurrent = index === currentStepIndex
        const isError = currentStatus === 'error'

        return (
          <div key={step} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors
              ${isCompleted && !isError 
                ? 'bg-green-100 border-green-500 text-green-700' 
                : isError && isCurrent
                ? 'bg-red-100 border-red-500 text-red-700'
                : 'bg-gray-100 border-gray-300 text-gray-500'
              }
            `}>
              <Icon className="h-4 w-4" />
            </div>
            
            {showLabels && (
              <div className="ml-2 min-w-0">
                <p className={`text-xs font-medium ${
                  isCompleted && !isError ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {config.label}
                </p>
              </div>
            )}
            
            {index < steps.length - 1 && (
              <div className={`
                w-8 h-0.5 mx-2 transition-colors
                ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'}
              `} />
            )}
          </div>
        )
      })}
      
      {currentStatus === 'error' && (
        <div className="flex items-center ml-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 bg-red-100 border-red-500 text-red-700">
            <AlertCircle className="h-4 w-4" />
          </div>
          {showLabels && (
            <div className="ml-2">
              <p className="text-xs font-medium text-red-700">エラー</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 