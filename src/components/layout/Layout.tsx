'use client'

import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore } from '@/lib/store'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { sidebarOpen } = useUIStore()

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          
          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 