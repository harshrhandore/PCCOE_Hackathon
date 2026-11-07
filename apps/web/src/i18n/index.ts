import i18n from'i18next';import{initReactI18next}from'react-i18next';import ICU from'i18next-icu';
import en from'./en.json';import hi from'./hi.json';import mr from'./mr.json';
void i18n.use(ICU).use(initReactI18next).init({resources:{en:{translation:en},hi:{translation:hi},mr:{translation:mr}},lng:'en',fallbackLng:'en',keySeparator:false,interpolation:{escapeValue:false},returnNull:false});
export default i18n;
