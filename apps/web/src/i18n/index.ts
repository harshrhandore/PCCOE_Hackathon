import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ICU from "i18next-icu";
import en from "./en.json";
void i18n
  .use(ICU)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: "en",
    fallbackLng: "en",
    keySeparator: false,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
export default i18n;

export async function loadLanguage(lang: string) {
  if (i18n.hasResourceBundle(lang, "translation")) return;
  if (lang !== "hi" && lang !== "mr") return;
  const resource = await (lang === "hi"
    ? import("./hi.json")
    : import("./mr.json"));
  i18n.addResourceBundle(lang, "translation", resource.default, true, true);
}
