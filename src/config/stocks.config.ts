import type { MarketCode, Sector, StockSymbol } from "@/types";

export type { MarketCode };

export type StockConfig = {
  symbol: StockSymbol;
  nameAr: string;
  nameEn: string;
  market: MarketCode;
  sector: Sector;
  profile: string;
  officialUrls: {
    marketProfile: string;
    disclosures: string;
    dividends: string;
    investorRelations?: string;
  };
};

const DFM_DIVIDENDS = "https://www.dfm.ae/en/investing/services/dividends-distribution-summary";
const ADX_DIVIDENDS = "https://www.adx.ae/en/market-summary/cash-dividends";

export const stocksConfig: StockConfig[] = [
  {
    symbol: "DEWA",
    nameAr: "هيئة كهرباء ومياه دبي",
    nameEn: "Dubai Electricity and Water Authority PJSC",
    market: "DFM",
    sector: "المرافق",
    profile: "شركة مرافق دفاعية ترتبط إيراداتها بالطلب على الكهرباء والمياه وخدمات البنية التحتية في دبي.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=DEWA",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.dewa.gov.ae/en/investor-relations",
    },
  },
  {
    symbol: "SALIK",
    nameAr: "سالك",
    nameEn: "Salik Company PJSC",
    market: "DFM",
    sector: "النقل والخدمات المرورية",
    profile: "مشغل بوابات التعرفة المرورية في دبي مع نموذج إيرادات مرتبط بحركة المرور والتوسع التنظيمي.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=SALIK",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.salik.ae/en/investor-relations",
    },
  },
  {
    symbol: "TALABAT",
    nameAr: "طلبات القابضة",
    nameEn: "Talabat Holding PLC",
    market: "DFM",
    sector: "التجارة الرقمية",
    profile: "منصة طلب وتوصيل رقمية حديثة الإدراج، ترتبط قراءتها بالنمو التشغيلي وجودة الأرباح بعد الإدراج.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=TALABAT",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
    },
  },
  {
    symbol: "DIB",
    nameAr: "بنك دبي الإسلامي",
    nameEn: "Dubai Islamic Bank PJSC",
    market: "DFM",
    sector: "البنوك الإسلامية",
    profile: "بنك إسلامي كبير، تتأثر قراءته بنمو التمويلات وجودة الأصول وهوامش الربحية.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=DIB",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.dib.ae/about-us/investor-relations",
    },
  },
  {
    symbol: "EMIRATESNBD",
    nameAr: "بنك الإمارات دبي الوطني",
    nameEn: "Emirates NBD PJSC",
    market: "DFM",
    sector: "البنوك",
    profile: "بنك قيادي في دبي والمنطقة، يعتمد تقييمه على الربحية وجودة الائتمان وكفاءة رأس المال.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=EMIRATESNBD",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.emiratesnbd.com/en/investor-relations",
    },
  },
  {
    symbol: "DU",
    nameAr: "الإمارات للاتصالات المتكاملة",
    nameEn: "Emirates Integrated Telecommunications Company PJSC",
    market: "DFM",
    sector: "الاتصالات",
    profile: "مشغل اتصالات إماراتي دفاعي نسبيا، تتركز قراءته في نمو المشتركين والتدفقات النقدية والتوزيعات.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=DU",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.du.ae/about/investor-relations",
    },
  },
  {
    symbol: "EMPOWER",
    nameAr: "إمباور",
    nameEn: "Emirates Central Cooling Systems Corporation PJSC",
    market: "DFM",
    sector: "التبريد المركزي",
    profile: "مزود تبريد مركزي يتأثر بنمو العقار والبنية التحتية وقدرة التدفقات على دعم التوزيعات.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=EMPOWER",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.empower.ae/investor-relations/",
    },
  },
  {
    symbol: "EMAAR",
    nameAr: "إعمار العقارية",
    nameEn: "Emaar Properties PJSC",
    market: "DFM",
    sector: "العقار",
    profile: "شركة عقارية قيادية في دبي، وتظل قراءتها مرتبطة بدورة العقار والمبيعات والتدفقات النقدية.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=EMAAR",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://properties.emaar.com/en/investor-relations/",
    },
  },
  {
    symbol: "TECOM",
    nameAr: "تيكوم",
    nameEn: "TECOM Group PJSC",
    market: "DFM",
    sector: "مناطق الأعمال",
    profile: "مشغل مجمعات ومناطق أعمال، وتدور قراءته حول الإشغال والإيرادات المتكررة والتوزيعات.",
    officialUrls: {
      marketProfile: "https://www.dfm.ae/en/issuers/listed-securities/securities/company-profile-page?id=TECOM",
      disclosures: "https://www.dfm.ae/en/the-exchange/news-and-disclosures/company-disclosures",
      dividends: DFM_DIVIDENDS,
      investorRelations: "https://www.tecomgroup.ae/investor-relations",
    },
  },
  {
    symbol: "NMDCENR",
    nameAr: "إن إم دي سي للطاقة",
    nameEn: "NMDC Energy P.J.S.C",
    market: "ADX",
    sector: "الطاقة والخدمات البحرية",
    profile: "شركة مشاريع وخدمات للطاقة والبنية البحرية، وتتأثر بدورية العقود وتنفيذ المشاريع.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=NMDCENR",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=NMDCENR",
      dividends: ADX_DIVIDENDS,
    },
  },
  {
    symbol: "EAND",
    nameAr: "مجموعة إي آند",
    nameEn: "Emirates Telecommunications Group Company PJSC",
    market: "ADX",
    sector: "الاتصالات",
    profile: "مجموعة اتصالات واستثمارات رقمية إقليمية، تجمع بين التدفقات الدفاعية والتوسع الخارجي.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=EAND",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=EAND",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://eand.com/en/investors.jsp",
    },
  },
  {
    symbol: "ADNOCDIST",
    nameAr: "أدنوك للتوزيع",
    nameEn: "ADNOC Distribution",
    market: "ADX",
    sector: "الطاقة والتجزئة",
    profile: "شركة توزيع وقود وخدمات تجزئة ترتبط بانتشار الشبكة وهوامش الوقود والإنفاق الرأسمالي.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADNOCDIST",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADNOCDIST",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adnocdistribution.ae/en/investor-relations/",
    },
  },
  {
    symbol: "ADNOCGAS",
    nameAr: "أدنوك للغاز",
    nameEn: "ADNOC Gas PLC",
    market: "ADX",
    sector: "الغاز والطاقة",
    profile: "شركة غاز كبرى، وتتأثر قراءتها بأسعار الطاقة والعقود طويلة الأجل والإنفاق الرأسمالي.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADNOCGAS",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADNOCGAS",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adnocgas.ae/en/investor-relations",
    },
  },
  {
    symbol: "ADNOCDRILL",
    nameAr: "أدنوك للحفر",
    nameEn: "ADNOC Drilling Company PJSC",
    market: "ADX",
    sector: "خدمات الطاقة",
    profile: "شركة خدمات حفر مرتبطة بخطط توسع الطاقة والعقود طويلة الأجل ومستويات الإنفاق الرأسمالي.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADNOCDRILL",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADNOCDRILL",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adnocdrilling.ae/en/investor-relations",
    },
  },
  {
    symbol: "FAB",
    nameAr: "بنك أبوظبي الأول",
    nameEn: "First Abu Dhabi Bank",
    market: "ADX",
    sector: "البنوك",
    profile: "بنك قيادي في أبوظبي والمنطقة، ترتبط قراءته بالربحية ورأس المال وجودة الأصول.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=FAB",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=FAB",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.bankfab.com/en-ae/about-fab/investor-relations",
    },
  },
  {
    symbol: "ADCB",
    nameAr: "بنك أبوظبي التجاري",
    nameEn: "Abu Dhabi Commercial Bank",
    market: "ADX",
    sector: "البنوك",
    profile: "بنك تجاري إماراتي كبير، تتأثر قراءته بنمو القروض وجودة الائتمان وكفاءة رأس المال.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADCB",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADCB",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adcb.com/en/about-us/investor-relations/",
    },
  },
  {
    symbol: "ADIB",
    nameAr: "مصرف أبوظبي الإسلامي",
    nameEn: "Abu Dhabi Islamic Bank",
    market: "ADX",
    sector: "البنوك الإسلامية",
    profile: "مصرف إسلامي إماراتي تتركز قراءته في نمو التمويلات وجودة الأصول وربحية حقوق الملكية.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADIB",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADIB",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adib.ae/en/Pages/Investor-Relations.aspx",
    },
  },
  {
    symbol: "ADNIC",
    nameAr: "أبوظبي الوطنية للتأمين",
    nameEn: "Abu Dhabi National Insurance Company",
    market: "ADX",
    sector: "التأمين",
    profile: "شركة تأمين وطنية تتأثر بنتائج الاكتتاب ودورات المطالبات وعوائد الاستثمار.",
    officialUrls: {
      marketProfile: "https://www.adx.ae/en/main-market/company-profile/overview?symbols=ADNIC",
      disclosures: "https://www.adx.ae/en/main-market/company-profile/disclosures?symbols=ADNIC",
      dividends: ADX_DIVIDENDS,
      investorRelations: "https://www.adnic.ae/investor-relations",
    },
  },
];

export const stockSymbols = stocksConfig.map((stock) => stock.symbol);
