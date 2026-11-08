import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTranslation } from "react-i18next";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) {
    return <p>{t("common.loading")}</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
