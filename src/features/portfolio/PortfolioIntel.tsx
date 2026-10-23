import { Cpu, Target, Check, Coffee, Zap, Car, Plane, House, Sparkles, type LucideIcon } from 'lucide-react'

/** أيقونة كل هدف حياتي حسب معرّفه. */
const MILESTONE_ICON: Record<string, LucideIcon> = { coffee: Coffee, bills: Zap, fuel: Car, travel: Plane, rent: House }

export interface AdvisorOutput {
  title: string
  text: string
  rating: string
}

export interface LifestyleMilestone {
  id: string
  name: string
  desc: string
  pct: number
  unlocked: boolean
}

/** لوحة ذكاء المحفظة: مستشار «الفارابي» المحلي + خريطة أهداف الحياة المغطاة بالأرباح. */
export default function PortfolioIntel({
  advisorOutput,
  milestones,
}: {
  advisorOutput: AdvisorOutput
  milestones: LifestyleMilestone[]
}) {
  return (
    <div className="intel-grid">
      {/* 1. الفارابي: مستشار الاستثمار الذكي */}
      <div className="ai-advisor-card">
        <div className="ai-advisor-header">
          <span className="ai-pulse-dot" />
          <span>{advisorOutput.title}</span>
          <span style={{ fontSize: '11px', background: 'rgba(255,176,32,0.1)', padding: '2px 8px', borderRadius: '6px', marginInlineStart: 'auto', border: '1px solid rgba(255,176,32,0.25)' }}>
            {advisorOutput.rating}
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--txt)', lineHeight: '1.55', fontWeight: 600 }}>
          {advisorOutput.text}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--muted2)', marginTop: '16px', borderTop: '1px dashed var(--line)', paddingTop: '8px' }}>
          <span><Cpu size={11} className="ico" aria-hidden /> تشغيل محلي فوري</span>
          <span>تحليل التنويع القطاعي والعائد</span>
        </div>
      </div>

      {/* 2. خريطة أهداف الحياة المغطاة */}
      <div className="roadmap-card">
        <h3 className="panel-h" style={{ margin: '0 0 14px 0', borderBottom: '1px solid var(--line)', paddingBottom: '8px', fontSize: '14.5px', color: 'var(--good)' }}>
          <Target size={16} className="ico" aria-hidden /> أهداف الحياة المغطاة بأرباح محفظتك
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {milestones.map((m) => {
            const Icon = MILESTONE_ICON[m.id] ?? Sparkles
            return (
            <div
              key={m.id}
              className={`roadmap-item ${m.unlocked ? 'unlocked' : ''}`}
              title={m.desc}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                <Icon size={16} className="ico" color={m.unlocked ? 'var(--good)' : 'var(--muted)'} aria-hidden />
                <span style={{ fontWeight: 800, fontSize: '12.5px', color: m.unlocked ? 'var(--good)' : 'var(--txt)' }}>
                  {m.name}
                </span>
                <span style={{
                  fontSize: '10px',
                  padding: '1px 7px',
                  borderRadius: '5px',
                  background: m.unlocked ? 'rgba(33, 201, 139, 0.1)' : 'var(--line)',
                  color: m.unlocked ? 'var(--good)' : 'var(--muted2)',
                  fontWeight: 800,
                  marginInlineStart: 'auto'
                }}>
                  {m.unlocked ? <><Check size={11} className="ico" aria-hidden /> مغطى</> : `${m.pct}%`}
                </span>
              </div>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
