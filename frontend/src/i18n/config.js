import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import th from "./th.json";

const resources = {
  th: {
    translation: th,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "th",
  fallbackLng: "th",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
