/** قسم تتبع الهدف المالي الشهري للمستثمر مع شريط التقدم وتلميح سد الفجوة. */
export default function GoalTracker({
  goal,
  setGoal,
  monthlyAverage,
  weightedYield,
}: {
  goal: number
  setGoal: (g: number) => void
  monthlyAverage: number
  weightedYield: number
}) {
  // نسبة تحقيق الهدف المالي
  const progressPercent = Math.min(100, Math.round((monthlyAverage / goal) * 100))

  return (
    <div className="panel p-panel-mb">
      <h3 className="panel-h">🎯 مستهدف التوزيعات الشهري</h3>
      <div className="p-goal-row">
        <div className="p-goal-col">
          <p className="p-goal-label">
            نسبة تحقيق المستهدف المالي الشهري:
          </p>
          <div className="p-progress-bar">
            <div className="p-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="p-goal-meta">
            <span>{Math.round(monthlyAverage).toLocaleString('en-US')} درهم / شهرياً</span>
            <span>{progressPercent}% من الهدف ({goal.toLocaleString('en-US')} درهم)</span>
          </div>
        </div>
        <div className="p-goal-input-group">
          <span className="lbl">حدد هدفك الشهري:</span>
          <input
            type="number"
            className="p-input"
            value={goal || ''}
            onChange={(e) => setGoal(Math.max(0, parseFloat(e.target.value) || 0))}
          />
          <span className="unit">درهم</span>
        </div>
      </div>
      {progressPercent < 100 ? (
        <div className="p-goal-hint">
          💡 لسد الفجوة وتحقيق هدفك ({goal - Math.round(monthlyAverage)} درهم إضافي شهرياً)، تحتاج إلى استثمار ما يقارب <b>{Math.round(((goal - monthlyAverage) * 12) / (weightedYield > 0 ? weightedYield / 100 : 0.05)).toLocaleString('en-US')} درهم</b> في أسهم ذات عائد متوسط {weightedYield > 0 ? weightedYield.toFixed(1) : '5'}%.
        </div>
      ) : (
        <div className="p-goal-hint done">
          🎉 تهانينا! لقد تجاوزت أرباح محفظتك الشهرية مستهدفك المالي المخطط له!
        </div>
      )}
    </div>
  )
}
