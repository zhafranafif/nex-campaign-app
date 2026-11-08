import React from 'react'
import NexLogo from '../assets/nex-logo.jpg'
import { Power } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'


const Sidebar: React.FC = () => {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut().catch((error) => {
      console.error("Error signing out:", error);
    });
  }
  return (
    <div className="w-32 h-screen bg-(--surface-container-low) border-r border-white/[0.07]">
        <nav className="flex flex-col h-full justify-between items-center py-4">
            <img src={NexLogo} alt="Nex Logo" className="w-16 h-16 rounded-2xl" />
            <button className="p-3 bg-(--color-primary) text-white rounded-full hover:bg-(--color-primary-hover) hover:cursor-pointer" onClick={handleLogout}>
                <Power width={24} height={24} />
            </button>
        </nav>
    </div>
  )
}

export default Sidebar