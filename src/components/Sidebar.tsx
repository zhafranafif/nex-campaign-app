import React from 'react'
import NexLogo from '../assets/nex-logo.jpg'
import { Power } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageButton'


const Sidebar: React.FC = () => {
  const { signOut } = useAuth()
  const { t } = useTranslation()

  const handleLogout = async () => {
    await signOut().catch((error) => {
      console.error("Error signing out:", error);
    });
  }
  return (
    <div className="w-32 h-screen bg-(--surface-container-low) border-r border-white/[0.07]">
        <nav className="flex flex-col h-full justify-between items-center py-4">
            <img src={NexLogo} alt={t("app.logoAlt")} className="w-16 h-16 rounded-2xl" />
            <div className="flex flex-col items-center gap-3">
            <LanguageSwitcher />
            <button aria-label={t("app.logout")} className="p-3 bg-(--color-primary) text-white rounded-full hover:bg-(--color-primary-hover) hover:cursor-pointer" onClick={handleLogout}>
                <Power width={24} height={24} />
            </button>
            </div>
        </nav>
    </div>
  )
}

export default Sidebar