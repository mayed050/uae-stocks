// حارس حجم الصفحة الأولى (يعمل بعد البناء في CI): مكتبتا الرسم (≈ 170KB مضغوطة) يجب ألّا تُحمَّلا
// مع الصفحة الأولى، بل تُجلبان عند عرض أول مخطط. انظر priority في vite.config.ts وcomponents/lazy.ts.
import { readFileSync } from 'node:fs'

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8')
const initial = [...html.matchAll(/(?:src|href)="[^"]*\/assets\/([^"/]+\.js)"/g)].map((m) => m[1])
const heavy = initial.filter((f) => /^(charts|price-chart)-/.test(f))

if (!initial.length) {
  console.error('لم يُعثر على حِزم في dist/index.html — هل نُفّذ البناء؟')
  process.exit(1)
}
if (heavy.length) {
  console.error(`مكتبات الرسم عادت إلى التحميل الأولي: ${heavy.join('، ')}`)
  process.exit(1)
}
console.log(`التحميل الأولي سليم (${initial.length} حِزم، بلا مكتبات رسم): ${initial.join('، ')}`)
