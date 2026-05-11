import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { ar } from './ar';
import { en } from './en';
import { fr } from './fr';

function flatten(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    } else if (v !== undefined) {
      out[key] = String(v);
    }
  }
  return out;
}

const I18N_NAMESPACES = [
  'common',
  'home',
  'addMemo',
  'review',
  'memoList',
  'memoActions',
  'noter',
  'testScreen',
  'studyNotes',
  'lessons',
  'sharingScreen',
  'settings',
  'login',
  'quran',
  'onboarding',
  'tabs',
  'tools',
] as const;

/** Expose `namespace.key` as `key` when unambiguous (legacy flat t('totalMemos'), etc.) */
function withNamespaceRootAliases(flat: Record<string, string>): Record<string, string> {
  const out = { ...flat };
  for (const ns of I18N_NAMESPACES) {
    const p = `${ns}.`;
    for (const [k, v] of Object.entries(out)) {
      if (k.startsWith(p)) {
        const short = k.slice(p.length);
        if (!short.includes('.') && !(short in out)) out[short] = v;
      }
    }
  }
  return out;
}

/** Flat keys preserved for older call sites (e.g. t('save')) */
const legacyAr: Record<string, string> = {
  ok: 'حسنا',
  settings: 'الإعدادات',
  totalMemos: 'مجموع المحفوظات',
  noReview: 'لا يوجد للمراجعة',
  tapToReview: 'اضغط للمراجعة',
  chainTitle: 'ربط المحفوظ بسلسلة',
  deleteTitle: 'حذف المحفوظ',
  faceLabel: 'وجه الكتاب - اضغط مطولا للخيارات',
  spineLabel: 'رف الكتب - اضغط مطولا للخيارات',
  allDoneSub: 'انتهت مراجعة اليوم. تفقّد غداً.',
  createMatn: 'إنشاء متن',
  saveVerse: 'حفظ البيت',
  noMatns: 'لا توجد متون',
  explained: 'مشروح',
  hasAudio: 'يوجد تسجيل',
};

const legacyEn: Record<string, string> = {
  ok: 'OK',
  settings: 'Settings',
  totalMemos: 'Total Memos',
  noReview: 'Nothing to review',
  tapToReview: 'Tap to review',
  chainTitle: 'Link Memo to a Chain',
  deleteTitle: 'Delete Memo',
  faceLabel: 'Cover view - long press for options',
  spineLabel: 'Bookshelf - long press for options',
  allDoneSub: "Today's review is done. Check back tomorrow.",
  createMatn: 'Create Matn',
  saveVerse: 'Save Verse',
  noMatns: 'No matns',
  explained: 'Explained',
  hasAudio: 'Has audio',
};

const legacyFr: Record<string, string> = {
  ok: 'OK',
  settings: 'Paramètres',
  totalMemos: 'Total des Mémos',
  noReview: 'Rien à réviser',
  tapToReview: 'Appuyer pour réviser',
  chainTitle: 'Lier le Mémo à une Chaîne',
  deleteTitle: 'Supprimer le Mémo',
  faceLabel: 'Vue de couverture - appui long pour options',
  spineLabel: 'Étagère - appui long pour options',
  allDoneSub: 'Révision terminée. À demain.',
  createMatn: 'Créer Matn',
  saveVerse: 'Enregistrer le Vers',
  noMatns: 'Pas de matns',
  explained: 'Expliqué',
  hasAudio: "Contient de l'audio",
};

const structuredAr = withNamespaceRootAliases(
  flatten(JSON.parse(JSON.stringify(ar)) as Record<string, unknown>)
);
const structuredEn = withNamespaceRootAliases(
  flatten(JSON.parse(JSON.stringify(en)) as Record<string, unknown>)
);
const structuredFr = withNamespaceRootAliases(
  flatten(JSON.parse(JSON.stringify(fr)) as Record<string, unknown>)
);

const resources = {
  ar: {
    translation: {
      ...legacyAr,
      ...structuredAr,
      'stages.learning': ar.memoList.stages.learning,
      'stages.reviewing': ar.memoList.stages.reviewing,
      'stages.mastered': ar.memoList.stages.mastered,
    },
  },
  en: {
    translation: {
      ...legacyEn,
      ...structuredEn,
      'stages.learning': en.memoList.stages.learning,
      'stages.reviewing': en.memoList.stages.reviewing,
      'stages.mastered': en.memoList.stages.mastered,
    },
  },
  fr: {
    translation: {
      ...legacyFr,
      ...structuredFr,
      'stages.learning': fr.memoList.stages.learning,
      'stages.reviewing': fr.memoList.stages.reviewing,
      'stages.mastered': fr.memoList.stages.mastered,
    },
  },
};

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'ar';
const initialLng = ['ar', 'en', 'fr'].includes(deviceLocale) ? deviceLocale : 'ar';

i18n.use(initReactI18next).init({
  resources,
  lng: initialLng,
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
