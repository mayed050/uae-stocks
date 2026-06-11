import { useState, useEffect } from 'react'
import type { LiveAction } from './LiveActionsFeed'

/**
 * تنبيهات إجراءات الشركات المباشرة (عرض تجريبي): قائمة ابتدائية ثابتة
 * يُحقن فيها حدث عشوائي من مغذٍّ محاكى كل 20 ثانية.
 */
export function useLiveActions(): LiveAction[] {
  const [liveActions, setLiveActions] = useState<LiveAction[]>(() => [
    {
      id: 1,
      sym: 'EMAAR',
      title: 'الجمعية العمومية لشركة إعمار العقارية توافق على توزيع أرباح نقدية استثنائية بقيمة 25 فلس للسهم لعام 2025.',
      type: 'approval',
      time: 'الآن',
      badge: 'قرار عمومية'
    },
    {
      id: 2,
      sym: 'DEWA',
      title: 'تنبيه: سهم هيئة كهرباء ومياه دبي (DEWA) يتداول اليوم بدون أحقية التوزيع النقدي البالغ 3.1 فلس.',
      type: 'date',
      time: 'منذ 40 دقيقة',
      badge: 'تاريخ استحقاق'
    },
    {
      id: 3,
      sym: 'FAB',
      title: 'بنك أبوظبي الأول يعلن إيداع كامل الأرباح السنوية الموزعة في حسابات مساهميه البنكية مباشرة.',
      type: 'payout',
      time: 'منذ ساعتين',
      badge: 'إيداع أرباح'
    },
    {
      id: 4,
      sym: 'SALIK',
      title: 'سالك تعلن عن اعتماد سياسة توزيع أرباح مرحلية مرنة للمساهمين بنسبة 100% من صافي الأرباح القابلة للتوزيع.',
      type: 'news',
      time: 'منذ 4 ساعات',
      badge: 'إفصاح مالي'
    }
  ])

  useEffect(() => {
    const feed = [
      {
        sym: 'ADNOCDIST',
        title: 'أدنوك للتوزيع تؤكد تاريخ استحقاق توزيعات النصف الثاني من العام المالي بقيمة 10.28 فلس للسهم.',
        type: 'date',
        badge: 'تأكيد تواريخ'
      },
      {
        sym: 'ADIB',
        title: 'مصرف أبوظبي الإسلامي يحصل على موافقة المصرف المركزي لتوزيع أرباح نقدية بنسبة 49% للمساهمين.',
        type: 'approval',
        badge: 'موافقة رسمية'
      },
      {
        sym: 'EAND',
        title: 'مجموعة إي آند (&e) تؤكد توزيع أرباح نقدية بقيمة 40 فلس للسهم عن النصف الثاني من العام المالي.',
        type: 'news',
        badge: 'إفصاح'
      },
      {
        sym: 'TABREED',
        title: 'عمومية تبريد الوطنية تقر توزيع أرباح نقدية بنسبة 15% وتوجه الشكر للمستثمرين على ثقتهم المستمرة.',
        type: 'approval',
        badge: 'قرار عمومية'
      },
      {
        sym: 'ALDAR',
        title: 'الدار العقارية تفصح عن خطتها التوسعية وتوزيعات نقدية قوية مستهدفة للسنوات الثلاث القادمة.',
        type: 'news',
        badge: 'إفصاح مالي'
      },
      {
        sym: 'ADNOCGAS',
        title: 'أدنوك للغاز تعلن عن إتمام إيداع التوزيعات النقدية المرحلية البالغة 7.7 فلس للسهم في حسابات مساهميها اليوم.',
        type: 'payout',
        badge: 'إيداع أرباح'
      }
    ]

    const interval = setInterval(() => {
      // اختيار حدث عشوائي من المغذّي
      const item = feed[Math.floor(Math.random() * feed.length)]
      if (!item) return
      setLiveActions(prev => {
        // منع التنبيهات المكررة المتتالية
        if (prev.some(x => x.title === item.title)) return prev

        return [
          {
            id: Date.now(),
            sym: item.sym,
            title: item.title,
            type: item.type,
            time: 'الآن',
            badge: item.badge
          },
          ...prev.map(x => x.time === 'الآن' ? { ...x, time: 'منذ قليل' } : x).slice(0, 4)
        ]
      })
    }, 20000) // تحديث كل 20 ثانية

    return () => clearInterval(interval)
  }, [])

  return liveActions
}
