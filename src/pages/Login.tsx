import { useState, type SubmitEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageButton";

type LoginLocationState = {
  from?: {
    pathname?: string;
  };
};

const Login = () => {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    await signIn(email, password).then(() => {
      const state = location.state as LoginLocationState;
      const redirectPath = state?.from?.pathname || "/";
      toast.success(t("auth.loginSuccess"));
      navigate(redirectPath, { replace: true });
    }).catch((error) => {
      console.error("Error signing in:", error);
      toast.error(t("auth.loginError"));
    }).finally(() => {
      setSubmitting(false);
    });
  };

  return (
    <main className="relative grid min-h-svh place-items-center bg-(--surface) p-4 sm:p-6">
      <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
        <LanguageSwitcher />
      </div>
      <section
        className="w-full max-w-md rounded-3xl border border-white/[0.07] bg-(--surface-container-low) p-5 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
      >
        <h1
          className="m-0 font-(--font-headline) text-3xl leading-8 tracking-[-0.015em] text-(--on-surface)"
        >
          {t("auth.welcome")}
        </h1>
        <p className="mb-6 mt-1.5 text-sm leading-5 text-(--on-surface-variant)">
          {t("auth.description")}
        </p>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2.5">
            <label
              htmlFor="email"
              className="text-[13px] font-semibold leading-4.5 tracking-[0.02em] text-(--on-surface)"
            >
              {t("auth.email")}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              autoComplete="email"
              required
              className="min-h-11 w-full rounded-xl border border-white/10 bg-(--color-input) px-3 py-2 text-sm leading-5 text-(--on-surface) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-primary) focus:ring-4 focus:ring-(--accent-bg)"
            />
          </div>

          <div className="grid gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="text-[13px] font-semibold leading-4.5 tracking-[0.02em] text-(--on-surface)"
              >
                {t("auth.password")}
              </label>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="min-h-11 w-full rounded-xl border border-white/10 bg-(--color-input) px-3 py-2 text-sm leading-5 text-(--on-surface) outline-none focus:border-(--color-primary) focus:ring-4 focus:ring-(--accent-bg)"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 rounded-full border-0 bg-linear-to-r from-(--color-primary) to-[#e01e5a] px-5 font-inherit text-sm font-semibold text-white shadow-[0_0_24px_-4px_rgba(255,46,99,0.35)] transition-transform hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-(--tertiary) focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t("auth.signingIn") : t("auth.login")}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Login;
