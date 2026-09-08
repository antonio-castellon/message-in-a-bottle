/** ISO 639-1 (and a few regional tags) for message language IDs. */
export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
  { code: 'am', name: 'Amharic', native: 'አማርኛ' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'az', name: 'Azerbaijani', native: 'Azərbaycan' },
  { code: 'be', name: 'Belarusian', native: 'Беларуская' },
  { code: 'bg', name: 'Bulgarian', native: 'Български' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'bs', name: 'Bosnian', native: 'Bosanski' },
  { code: 'ca', name: 'Catalan', native: 'Català' },
  { code: 'cs', name: 'Czech', native: 'Čeština' },
  { code: 'cy', name: 'Welsh', native: 'Cymraeg' },
  { code: 'da', name: 'Danish', native: 'Dansk' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'eo', name: 'Esperanto', native: 'Esperanto' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'et', name: 'Estonian', native: 'Eesti' },
  { code: 'eu', name: 'Basque', native: 'Euskara' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'fi', name: 'Finnish', native: 'Suomi' },
  { code: 'fil', name: 'Filipino', native: 'Filipino' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'ga', name: 'Irish', native: 'Gaeilge' },
  { code: 'gl', name: 'Galician', native: 'Galego' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'he', name: 'Hebrew', native: 'עברית' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'hr', name: 'Croatian', native: 'Hrvatski' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar' },
  { code: 'hy', name: 'Armenian', native: 'Հայերեն' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'is', name: 'Icelandic', native: 'Íslenska' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ka', name: 'Georgian', native: 'ქართული' },
  { code: 'kk', name: 'Kazakh', native: 'Қазақша' },
  { code: 'km', name: 'Khmer', native: 'ខ្មែរ' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'ku', name: 'Kurdish', native: 'Kurdî' },
  { code: 'lo', name: 'Lao', native: 'ລາວ' },
  { code: 'lt', name: 'Lithuanian', native: 'Lietuvių' },
  { code: 'lv', name: 'Latvian', native: 'Latviešu' },
  { code: 'mk', name: 'Macedonian', native: 'Македонски' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'mn', name: 'Mongolian', native: 'Монгол' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
  { code: 'mt', name: 'Maltese', native: 'Malti' },
  { code: 'my', name: 'Burmese', native: 'မြန်မာ' },
  { code: 'nb', name: 'Norwegian Bokmål', native: 'Norsk bokmål' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'nn', name: 'Norwegian Nynorsk', native: 'Norsk nynorsk' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'ps', name: 'Pashto', native: 'پښتو' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ro', name: 'Romanian', native: 'Română' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'si', name: 'Sinhala', native: 'සිංහල' },
  { code: 'sk', name: 'Slovak', native: 'Slovenčina' },
  { code: 'sl', name: 'Slovenian', native: 'Slovenščina' },
  { code: 'sq', name: 'Albanian', native: 'Shqip' },
  { code: 'sr', name: 'Serbian', native: 'Српски' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'tl', name: 'Tagalog', native: 'Tagalog' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'uz', name: 'Uzbek', native: 'Oʻzbek' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'xh', name: 'Xhosa', native: 'isiXhosa' },
  { code: 'yi', name: 'Yiddish', native: 'ייִדיש' },
  { code: 'yo', name: 'Yoruba', native: 'Yorùbá' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu' },
];

const byCode = new Map(LANGUAGES.map((l) => [l.code, l]));

export function isLanguageCode(value: unknown): value is string {
  return typeof value === 'string' && byCode.has(value.toLowerCase());
}

export function normalizeLanguage(value: string | undefined | null): string | null {
  if (!value) return null;
  const lower = value.toLowerCase().replace('_', '-');
  const primary = lower.split('-')[0];
  if (primary === 'no') return byCode.has('nb') ? 'nb' : null;
  if (primary === 'iw') return 'he';
  if (primary === 'in') return 'id';
  if (primary === 'fil') return byCode.has('fil') ? 'fil' : 'tl';
  if (byCode.has(lower)) return lower;
  if (byCode.has(primary)) return primary;
  return null;
}

export function languageLabel(code: string): string {
  const info = byCode.get(code.toLowerCase());
  if (!info) return code;
  return info.name === info.native ? info.name : `${info.native} · ${info.name}`;
}

export function languageNative(code: string): string {
  return byCode.get(code.toLowerCase())?.native ?? code;
}
