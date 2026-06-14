// إعدادات Supabase للنظام المحاسبي السحابي
// مفتاح publishable/anon فقط، لا تستخدم service_role أو secret key هنا.
window.KING_SUPABASE_CONFIG = {
  url: "https://eqqepbamaxqpsvbsihpb.supabase.co",
  anonKey: "sb_publishable_2JSulQ-u683PDSWA8SiV0A_qw_nMgMh",
  companyId: "main",
  table: "king_accounting_state"
};
// توافق مع النسخ السابقة التي تقرأ المتغيرات مباشرة
window.KING_SUPABASE_URL = window.KING_SUPABASE_CONFIG.url;
window.KING_SUPABASE_ANON_KEY = window.KING_SUPABASE_CONFIG.anonKey;
