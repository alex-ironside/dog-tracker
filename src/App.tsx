import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DogRoster } from '@/components/DogRoster'
import { CompatibilityGraph } from '@/components/CompatibilityGraph'
import { GroupBuilder } from '@/components/GroupBuilder'
import { CalendarScheduler } from '@/components/CalendarScheduler'
import { WalkHistory } from '@/components/WalkHistory'
import { LanguageToggle } from '@/components/LanguageToggle'

type TabId = 'dogs' | 'compatibility' | 'groups' | 'calendar' | 'history'

const TABS: { id: TabId; labelKey: string }[] = [
  { id: 'dogs', labelKey: 'nav.dogs' },
  { id: 'compatibility', labelKey: 'nav.compatibility' },
  { id: 'groups', labelKey: 'nav.groups' },
  { id: 'calendar', labelKey: 'nav.calendar' },
  { id: 'history', labelKey: 'nav.history' },
]

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dogs')
  const { t } = useTranslation()

  return (
    <div className='min-h-screen bg-background text-foreground bg-grain'>
      {/* Branded header */}
      <header className='border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40'>
        <div className='mx-auto max-w-7xl px-6 md:px-10'>
          <div className='flex items-center justify-between pt-6 pb-2'>
            <div className='flex items-baseline gap-3'>
              <span
                aria-hidden
                className='inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-display text-xl font-bold shadow-sm'
              >
                p
              </span>
              <div className='flex items-baseline gap-2'>
                <h1 className='font-display text-3xl font-semibold tracking-tight'>Pack</h1>
                <span className='hidden sm:inline text-xs uppercase tracking-[0.18em] text-muted-foreground'>
                  {t('app.tagline')}
                </span>
              </div>
            </div>
            <LanguageToggle />
          </div>

          {/* Tab bar */}
          <nav role='tablist' className='flex gap-1 -mb-px overflow-x-auto pt-4'>
            {TABS.map((tab) => {
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  role='tab'
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                    'border-b-2 -mb-[2px]',
                    active
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground hover:text-foreground border-transparent',
                  ].join(' ')}
                >
                  {t(tab.labelKey)}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Tab panels */}
      <main role='tabpanel' className='mx-auto max-w-7xl px-6 md:px-10 py-8 md:py-12'>
        {activeTab === 'dogs' && <DogRoster />}
        {activeTab === 'compatibility' && <CompatibilityGraph />}
        {activeTab === 'groups' && <GroupBuilder />}
        {activeTab === 'calendar' && <CalendarScheduler />}
        {activeTab === 'history' && <WalkHistory />}
      </main>
    </div>
  )
}

export default App
