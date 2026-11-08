import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en  from "./resource/en/en.json";
import th from "./resource/th/th.json";


i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en
            },
            th: {
                translation: th
            }
        },
        fallbackLng: "en",
        supportedLngs: ["en", "th"],
        interpolation: {
            escapeValue: false,
        },
        defaultNS: "translation",
    });

export default i18n;