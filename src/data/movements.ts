/**
 * بيانات حركة السوق اليومية — ملف مشترك لتجنب التكرار بين Overview و Screener
 * هذه البيانات ثابتة تمثل آخر حركة تداول متاحة لكل سهم.
 */

export interface MovementStock {
  name: string
  sym: string
  price: string
  change: string
  pct: string
  up?: boolean
  flat?: boolean
}

export interface SectorMovement {
  title: string
  stocks: MovementStock[]
}

// ===== حركة سوق دبي المالي (DFM) مصنّفةً قطاعياً =====
export const SECTOR_MOVEMENTS: SectorMovement[] = [
  {
    title: 'البنوك',
    stocks: [
      { name: 'الإمارات دبي الوطني', sym: 'EMIRATESNBD', price: '10.15', pct: '-0.49%', change: '-0.05', up: false },
      { name: 'بنك دبي الإسلامي', sym: 'DIB', price: '5.12', pct: '+0.39%', change: '+0.02', up: true },
      { name: 'بنك دبي التجاري', sym: 'CBD', price: '5.25', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف عجمان', sym: 'AJMANBANK', price: '1.50', pct: '-0.66%', change: '-0.01', up: false },
      { name: 'جي اف اتش', sym: 'GFH', price: '0.29', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف السلام - السودان', sym: 'SALAMSUDAN', price: '1.10', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف السلام - البحرين', sym: 'SALAM_BAH', price: '0.90', pct: '-1.10%', change: '-0.01', up: false },
      { name: 'بنك المشرق', sym: 'MASHREQ', price: '202.00', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'مصرف الشارقة الإسلامي', sym: 'SIB', price: '1.85', pct: '+0.54%', change: '+0.01', up: true },
      { name: 'أملاك للتمويل', sym: 'AMLAK', price: '0.81', pct: '+2.53%', change: '+0.02', up: true },
      { name: 'دار التكافل', sym: 'DARTAKAFUL', price: '0.75', pct: '-1.32%', change: '-0.01', up: false },
      { name: 'تمويل', sym: 'TAMWEEL', price: '1.20', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'الاستثمار والخدمات المالية',
    stocks: [
      { name: 'دبي للاستثمار', sym: 'DIC', price: '2.20', pct: '+0.45%', change: '+0.01', up: true },
      { name: 'شعاع القابضة', sym: 'SHUAA', price: '0.95', pct: '-2.06%', change: '-0.02', up: false },
      { name: 'سوق دبي المالي', sym: 'DFM', price: '1.34', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'اكتتاب', sym: 'EKTTITAB', price: '0.25', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'المدينة', sym: 'ALMADINA', price: '0.45', pct: '+2.27%', change: '+0.01', up: true },
      { name: 'بيت التمويل الخليجي', sym: 'GFH2', price: '0.29', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'الخليجية للاستثمار', sym: 'GGICO', price: '0.35', pct: '-2.78%', change: '-0.01', up: false },
      { name: 'الصكوك الوطنية', sym: 'NATIONALBONDS', price: '1.00', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'الأنصاري للخدمات المالية', sym: 'ALANSARI', price: '1.07', pct: '+0.93%', change: '+0.01', up: true }
    ]
  },
  {
    title: 'الصناعة',
    stocks: [
      { name: 'الوطنية للأسمنت', sym: 'NCC', price: '2.50', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'أسمنت الخليج', sym: 'GCEM', price: '0.70', pct: '-1.41%', change: '-0.01', up: false },
      { name: 'الجبس الوطنية', sym: 'NGR', price: '1.80', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'أسمنت الاتحاد', sym: 'UCC', price: '1.15', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'العقارات',
    stocks: [
      { name: 'إعمار العقارية', sym: 'EMAAR', price: '11.78', pct: '+0.73%', change: '+0.06', up: true },
      { name: 'إعمار للتطوير', sym: 'EMAARDEV', price: '8.00', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'تيكوم', sym: 'TECOM', price: '3.30', pct: '+0.30%', change: '+0.01', up: true },
      { name: 'ديار للتطوير', sym: 'DEYAAR', price: '0.70', pct: '+0.57%', change: '+0.00', up: true },
      { name: 'الاتحاد العقارية', sym: 'UPP', price: '0.35', pct: '-2.78%', change: '-0.01', up: false },
      { name: 'دريك آند سكل', sym: 'DSI', price: '0.36', pct: '+1.41%', change: '+0.00', up: true },
      { name: 'منازل', sym: 'MANAZEL', price: '0.35', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'إشراق', sym: 'ESHRAQ', price: '0.40', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'النقل والشحن',
    stocks: [
      { name: 'العربية للطيران', sym: 'AIRARABIA', price: '2.45', pct: '+0.41%', change: '+0.01', up: true },
      { name: 'تاكسي دبي', sym: 'DTC', price: '2.58', pct: '+0.39%', change: '+0.01', up: true },
      { name: 'أرامكس', sym: 'ARAMEX', price: '2.30', pct: '-0.86%', change: '-0.02', up: false },
      { name: 'الخليج للملاحة', sym: 'GULFNAV', price: '5.92', pct: '-1.50%', change: '-0.09', up: false }
    ]
  },
  {
    title: 'الاتصالات',
    stocks: [
      { name: 'دو', sym: 'DU', price: '11.20', pct: '+0.45%', change: '+0.05', up: true }
    ]
  },
  {
    title: 'الخدمات والمرافق',
    stocks: [
      { name: 'كهرباء ومياه دبي', sym: 'DEWA', price: '2.61', pct: '+0.38%', change: '+0.01', up: true },
      { name: 'إمباور', sym: 'EMPOWER', price: '1.59', pct: '+0.63%', change: '+0.01', up: true },
      { name: 'سالك', sym: 'SALIK', price: '5.35', pct: '-0.54%', change: '-0.03', up: false },
      { name: 'باركن', sym: 'PARKINS', price: '3.02', pct: '+0.33%', change: '+0.01', up: true },
      { name: 'تبريد', sym: 'TABREED', price: '3.30', pct: '+0.61%', change: '+0.02', up: true }
    ]
  },
  {
    title: 'التجزئة والاستهلاك',
    stocks: [
      { name: 'سبينس', sym: 'SPINNEYS', price: '1.55', pct: '+0.65%', change: '+0.01', up: true },
      { name: 'طلبات', sym: 'TALABAT', price: '1.10', pct: '-0.90%', change: '-0.01', up: false }
    ]
  },
  {
    title: 'الرعاية الصحية والتعليم',
    stocks: [
      { name: 'أمانات القابضة', sym: 'AMANAT', price: '1.07', pct: '+0.94%', change: '+0.01', up: true },
      { name: 'تعليم', sym: 'TAALEEM', price: '3.50', pct: '0.00%', change: '+0.00', flat: true }
    ]
  },
  {
    title: 'التأمين',
    stocks: [
      { name: 'دبي الوطنية للتأمين', sym: 'DNIR', price: '4.20', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'سلامة', sym: 'SALAMA', price: '0.45', pct: '0.00%', change: '+0.00', flat: true },
      { name: 'الصقر للتأمين', sym: 'ASIC', price: '1.50', pct: '0.00%', change: '+0.00', flat: true }
    ]
  }
]

// ===== حركة سوق أبوظبي (ADX) =====
export const ADX_MOVEMENTS: MovementStock[] = [
  { name: 'بنك أبوظبي الأول', sym: 'FAB', price: '14.50', change: '-0.15', pct: '-1.02%', up: false },
  { name: 'بنك أبوظبي التجاري', sym: 'ADCB', price: '8.92', change: '+0.02', pct: '+0.22%', up: true },
  { name: 'مصرف أبوظبي الإسلامي', sym: 'ADIB', price: '11.50', change: '+0.10', pct: '+0.88%', up: true },
  { name: 'أبوظبي الوطنية للتأمين', sym: 'ADNIC', price: '7.00', change: '+0.00', pct: '+0.00%', flat: true },
  { name: 'إي آند', sym: 'EAND', price: '18.20', change: '+0.15', pct: '+0.83%', up: true },
  { name: 'أدنوك للغاز', sym: 'ADNOCGAS', price: '3.31', change: '+0.01', pct: '+0.30%', up: true },
  { name: 'أدنوك للتوزيع', sym: 'ADNOCDIST', price: '3.88', change: '-0.02', pct: '-0.51%', up: false },
  { name: 'أدنوك للحفر', sym: 'ADNOCDRILL', price: '4.80', change: '+0.03', pct: '+0.63%', up: true },
  { name: 'أدنوك للإمداد', sym: 'ADNOCLS', price: '5.12', change: '+0.05', pct: '+0.99%', up: true },
  { name: 'أبوظبي الوطنية للطاقة', sym: 'TAQA', price: '3.25', change: '-0.01', pct: '-0.31%', up: false },
  { name: 'الدار العقارية', sym: 'ALDAR', price: '7.80', change: '+0.05', pct: '+0.64%', up: true },
  { name: 'ألفا ظبي', sym: 'ALPHADHABI', price: '18.50', change: '+0.10', pct: '+0.54%', up: true },
  { name: 'الشركة العالمية القابضة', sym: 'IHC', price: '414.00', change: '+1.50', pct: '+0.36%', up: true },
  { name: 'إن إم دي سي إنرجي', sym: 'NMDCENR', price: '2.85', change: '+0.00', pct: '+0.00%', flat: true },
  { name: 'شركة بروج', sym: 'BOROUGE', price: '2.45', change: '-0.01', pct: '-0.41%', up: false },
  { name: 'الواحة كابيتال', sym: 'WAHAT', price: '1.48', change: '+0.01', pct: '+0.68%', up: true },
  { name: 'دانة غاز', sym: 'DANA', price: '0.69', change: '+0.00', pct: '+0.00%', flat: true },
  { name: 'برجيل القابضة', sym: 'BURJEEL', price: '2.50', change: '+0.00', pct: '+0.00%', flat: true },
  { name: 'مجموعة فينكس', sym: 'PHOENIX', price: '1.32', change: '+0.01', pct: '+0.76%', up: true },
]
