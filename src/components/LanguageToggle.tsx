import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = (i18n.resolvedLanguage || i18n.language || 'en').slice(0, 2)

  const langs: Array<'en' | 'pl'> = ['en', 'pl']

  return (
    <div role='group' aria-label={t('lang.label')} className='inline-flex rounded-md border border-border overflow-hidden'>
      {langs.map((lng) => {
        const active = current === lng
        return (
          <button
            key={lng}
            type='button'
            onClick={() => i18n.changeLanguage(lng)}
            aria-pressed={active}
            className={[
              'px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {t(`lang.${lng}`)}
          </button>
        )
      })}
    </div>
  )
}

export default LanguageToggle
