import { Link } from '@tanstack/react-router'

/** تذييل كل الصفحات: يبقى رابط الشروط متاحًا بعد إخفاء التنويه، وعلى الجوال حيث لا شريط جانبي. */
export default function SiteFooter() {
  return (
    <footer className="site-foot">
      <span>منصة معلوماتية — لا توصية بالشراء أو البيع</span>
      <Link to="/terms">الشروط وإخلاء المسؤولية</Link>
      <a href="https://github.com/mayed050/uae-stocks/issues" target="_blank" rel="noopener noreferrer">
        الإبلاغ عن خطأ في البيانات
      </a>
    </footer>
  )
}
