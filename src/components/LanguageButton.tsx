import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import enIcon from "../assets/icon/en.svg";
import thIcon from "../assets/icon/th.svg";

const LanguageButton = () => {
  const { t } = useTranslation();
  const language = i18n.language.startsWith("th") ? "th" : "en";
  const nextLanguage = language === "en" ? "th" : "en";

  return (
    <div className="flex items-center justify-center p-2 mb-5 rounded-lg bg-(--on-primary-container) border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
    <button
      type="button"
      aria-label={t("navigation.switchLanguage")}
      title={t(`navigation.switchTo.${nextLanguage}`)}
      className="rounded-lg p-1 text-xl leading-none transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-(--tertiary) focus-visible:outline-offset-2"
      onClick={() => void i18n.changeLanguage(nextLanguage)}
    >
      <img
        src={language === "en" ? thIcon : enIcon}
        alt={t(`navigation.switchTo.${nextLanguage}`)}
        className="h-6 w-6"
      />
    </button>
    </div>
  );
}

export default LanguageButton;
