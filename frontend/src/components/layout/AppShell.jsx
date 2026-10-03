import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bone">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
        <Navbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
