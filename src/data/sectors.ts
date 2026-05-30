/** تصنيف القطاعات — يربط عناوين قطاعات سوق دبي بقيم القطاع في بيانات الأسهم. */
import { SECTOR_MOVEMENTS } from './movements'

/** عناوين القطاعات الرسمية لسوق دبي المالي (بترتيب العرض). */
export const SECTOR_TITLES = SECTOR_MOVEMENTS.map(s => s.title)

/** يحوّل عنوان قطاع DFM إلى قائمة قيم `sector` المطابقة في بيانات الأسهم. */
export function mapDFMSectorToDb(dfmTitle: string): string[] {
  switch (dfmTitle) {
    case 'البنوك': return ['بنوك', 'خدمات مالية']
    case 'الاستثمار والخدمات المالية': return ['استثمار', 'خدمات مالية', 'استثمار / متنوع']
    case 'الصناعة': return ['صناعة / طاقة', 'بتروكيماويات']
    case 'العقارات': return ['عقار']
    case 'النقل والشحن': return ['طيران / نقل', 'نقل / خدمات', 'نقل / طاقة']
    case 'الاتصالات': return ['اتصالات']
    case 'الخدمات': return ['مرافق', 'بنية تحتية / رسوم', 'خدمات استهلاكية']
    case 'السلع': return ['تجزئة / استهلاك', 'خدمات استهلاكية']
    case 'الرعاية الصحية والتعليم': return ['رعاية / تعليم', 'رعاية صحية']
    case 'التأمين': return ['تأمين']
    case 'الأغذية': return ['تجزئة / استهلاك']
    case 'الشركات الأجنبية': return ['استثمار', 'بنوك']
    default: return [dfmTitle]
  }
}
