/** ثوابت واجهة مشتركة — مصدر وحيد للحقيقة بدل التكرار عبر الصفحات. */

/** النص المعروض حين تكون القيمة غير متوفرة وتحتاج تحققاً من المصدر الرسمي. */
export const NA = 'يلزم التحقق'

/** لوحة الألوان الموحّدة للرسوم البيانية والأساطير. */
export const PALETTE = ['#3aa0ff', '#7c5cff', '#21c98b', '#ffb020', '#ff5a72', '#36c5d8', '#e26bd0', '#9bd13a']

/** تنسيق صندوق التلميح (tooltip) الموحّد لمكوّنات recharts. */
export const TIP_STYLE = {
  background: 'var(--panel-solid)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  color: 'var(--txt)',
  fontSize: 13,
} as const
