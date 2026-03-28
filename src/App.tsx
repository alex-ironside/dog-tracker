import { useState } from 'react'
import { DogRoster } from '@/components/DogRoster'
import { CompatibilityGraph } from '@/components/CompatibilityGraph'
import { GroupBuilder } from '@/components/GroupBuilder'
import { CalendarScheduler } from '@/components/CalendarScheduler'

function App() {
  const [activeTab, setActiveTab] = useState<'dogs' | 'compatibility' | 'groups' | 'calendar'>('dogs')

  return (
    <div className='flex flex-col min-h-screen'>
      {/* Tab bar */}
      <div role='tablist' className='flex bg-slate-50 border-b border-slate-200' style={{ minHeight: '44px' }}>
        <button
          role='tab'
          aria-selected={activeTab === 'dogs'}
          onClick={() => setActiveTab('dogs')}
          className={`px-4 py-2 text-sm font-semibold ${activeTab === 'dogs' ? 'text-slate-900 border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Dogs
        </button>
        <button
          role='tab'
          aria-selected={activeTab === 'compatibility'}
          onClick={() => setActiveTab('compatibility')}
          className={`px-4 py-2 text-sm font-semibold ${activeTab === 'compatibility' ? 'text-slate-900 border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Compatibility
        </button>
        <button
          role='tab'
          aria-selected={activeTab === 'groups'}
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 text-sm font-semibold ${activeTab === 'groups' ? 'text-slate-900 border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Groups
        </button>
        <button
          role='tab'
          aria-selected={activeTab === 'calendar'}
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-sm font-semibold ${activeTab === 'calendar' ? 'text-slate-900 border-b-2 border-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Calendar
        </button>
      </div>

      {/* Tab panels */}
      <div role='tabpanel' className='flex-1'>
        {activeTab === 'dogs' ? (
          <div className='px-4 py-6 md:px-8 md:py-8'>
            <DogRoster />
          </div>
        ) : activeTab === 'compatibility' ? (
          <CompatibilityGraph />
        ) : activeTab === 'groups' ? (
          <GroupBuilder />
        ) : (
          <CalendarScheduler />
        )}
      </div>
    </div>
  )
}

export default App
