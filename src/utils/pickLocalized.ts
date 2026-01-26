import type { i18n } from "i18next";

function isEnglish(i18nInstance: i18n) {
  const lang = (i18nInstance.language ?? "vi").toLowerCase();
  return lang === "en" || lang.startsWith("en-");
}

export function pickLocalizedEng(
  i18nInstance: i18n,
  input?: { default?: string; eng?: string },
  fallback?: string
): string {
  const en = isEnglish(i18nInstance);
  return (
    (en ? input?.eng : input?.default) ??
    input?.default ??
    input?.eng ??
    fallback ??
    ""
  );
}

export function pickLocalizedEn(
  i18nInstance: i18n,
  input?: { default?: string; en?: string },
  fallback?: string
): string {
  const en = isEnglish(i18nInstance);
  return (
    (en ? input?.en : input?.default) ??
    input?.default ??
    input?.en ??
    fallback ??
    ""
  );
}
