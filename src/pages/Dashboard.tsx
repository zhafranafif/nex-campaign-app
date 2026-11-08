import React from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../hooks/useAuth'
import OpsDashboard from './OpsDashboard'
import CreatorDashboard from './CreatorDashboard'
import { useTranslation } from 'react-i18next'

const Dashboard: React.FC = () => {
  const {role, loading} = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return <p>{t("common.loading")}</p>
  }

  return (
    <main className="flex min-h-screen bg-(--surface) text-(--on-surface)">
        <Sidebar />
        <section className="flex-1 p-8">
        {role === "ops" ? (
            <OpsDashboard/>
        ) : <CreatorDashboard/>
        }
        </section>
    </main>
  )
}

export default Dashboard
