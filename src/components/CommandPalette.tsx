/**
 * لوحة البحث السريع (⌘K / Ctrl+K أو «/»): انتقال فوري إلى أي سهم أو صفحة.
 * مبنية على cmdk (Radix Dialog): تنقّل بالأسهم، تركيز محبوس، وإغلاق بـ Escape.
 */
import { useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from '@tanstack/react-router'
import { CornerDownLeft } from 'lucide-react'
import { useStocks, useUiStore } from '@/store'
import { normalizeAr } from '@/format'
import { NAV } from './nav'
import Avatar from './Avatar'

/** مطابقة متسامحة مع الهمزات والتشكيل؛ الرمز أو بداية الاسم أعلى ترتيبًا من التطابق في الوسط. */
function filter(value: string, search: string, keywords?: string[]): number {
  const q = normalizeAr(search)
  if (!q) return 1
  const hay = [value, ...(keywords ?? [])].map(normalizeAr)
  if (hay.some((h) => h.startsWith(q))) return 1
  if (q.split(/\s+/).every((t) => hay.some((h) => h.includes(t)))) return 0.5
  return 0
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))

export default function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen)
  const setOpen = useUiStore((s) => s.setPaletteOpen)
  const { stocks } = useStocks()
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!useUiStore.getState().paletteOpen)
      } else if (e.key === '/' && !isTyping(e.target) && !useUiStore.getState().paletteOpen) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="بحث سريع عن سهم أو صفحة"
      filter={filter}
      loop
      overlayClassName="cmdk-overlay"
      contentClassName="cmdk-content"
      dir="rtl"
    >
      <Command.Input className="cmdk-input" placeholder="ابحث باسم الشركة أو الرمز أو القطاع، أو اسم صفحة…" />
      <Command.List className="cmdk-list">
        <Command.Empty className="cmdk-empty">لا نتائج مطابقة.</Command.Empty>

        <Command.Group heading="الأسهم" className="cmdk-group">
          {stocks.map((s) => (
            <Command.Item
              key={s.sym}
              value={s.sym}
              keywords={[s.name, s.sector, s.ex === 'DFM' ? 'دبي' : 'أبوظبي']}
              onSelect={() => run(() => void navigate({ to: '.', search: (prev) => ({ ...prev, stock: s.sym }) }))}
              className="cmdk-item"
            >
              <Avatar sym={s.sym} size={26} />
              <span className="cmdk-main">
                <span className="cmdk-title">{s.name.split('—')[0]}</span>
                <span className="cmdk-sub">{s.sym} · {s.ex} · {s.sector}</span>
              </span>
              <span className="cmdk-meta" dir="ltr">
                {s.price?.toFixed(2) ?? '—'}
                {typeof s.change === 'number' && (
                  <span className={s.change > 0 ? 'up' : s.change < 0 ? 'down' : ''}> {s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%</span>
                )}
              </span>
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="الصفحات" className="cmdk-group">
          {NAV.map((n) => (
            <Command.Item
              key={n.v}
              value={`page:${n.v}`}
              keywords={[n.label, n.short]}
              onSelect={() => run(() => void navigate({ to: n.to }))}
              className="cmdk-item"
            >
              <span className="cmdk-pageicon"><n.icon size={16} aria-hidden /></span>
              <span className="cmdk-main"><span className="cmdk-title">{n.label}</span></span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
      <div className="cmdk-foot" aria-hidden>
        <span><kbd>↑</kbd><kbd>↓</kbd> تنقّل</span>
        <span><kbd><CornerDownLeft size={11} /></kbd> فتح</span>
        <span><kbd>Esc</kbd> إغلاق</span>
      </div>
    </Command.Dialog>
  )
}
