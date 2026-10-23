/**
 * اشتراك في تقويم توزيعات يتحدّث تلقائيًا (انظر feeds.ts): Google، أو Apple/Outlook عبر webcal،
 * أو نسخ الرابط لأي تطبيق آخر. بلا sym: تقويم السوق كاملًا (بلا تنبيهات)؛ مع sym: تقويم السهم بتنبيهاته.
 */
import { useState } from 'react'
import { CalendarSync, Check, Copy } from 'lucide-react'
import { feedPath } from '@/feeds'

function feedUrls(path: string) {
  const https = new URL(import.meta.env.BASE_URL + path, window.location.href).href
  const webcal = https.replace(/^https?:/, 'webcal:')
  return { https, webcal, google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}` }
}

export default function CalendarSubscribe({ sym }: { sym?: string }) {
  const urls = feedUrls(feedPath(sym))
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const who = sym ? `توزيعات ${sym}` : 'توزيعات السوق كاملًا'

  async function copy() {
    try {
      await navigator.clipboard.writeText(urls.https)
      setCopied('ok')
    } catch {
      setCopied('fail') // المتصفح منع الحافظة: يُعرض الرابط لنسخه يدويًا
    }
  }

  return (
    <div className="cal-sub" role="group" aria-label={`اشتراك في تقويم ${who}`}>
      <span className="cal-sub-label">
        <CalendarSync size={14} className="ico" aria-hidden /> اشترك في تقويم {who} — يتحدّث تلقائيًا:
      </span>
      <a className="chip" href={urls.google} target="_blank" rel="noopener noreferrer" aria-label={`اشتراك في تقويم ${who} عبر Google`}>
        Google
      </a>
      <a className="chip" href={urls.webcal} aria-label={`اشتراك في تقويم ${who} عبر Apple / Outlook`}>
        Apple / Outlook
      </a>
      <button className="chip" onClick={() => void copy()} aria-label={`نسخ رابط تقويم ${who}`}>
        {copied === 'ok' ? <Check size={14} className="ico" aria-hidden /> : <Copy size={14} className="ico" aria-hidden />}
        {copied === 'ok' ? ' نُسخ الرابط' : ' نسخ الرابط'}
      </button>
      {copied === 'fail' && <code className="cal-sub-url" dir="ltr">{urls.https}</code>}
      <span className="sr-only" aria-live="polite">{copied === 'ok' ? 'نُسخ رابط التقويم' : ''}</span>
    </div>
  )
}
