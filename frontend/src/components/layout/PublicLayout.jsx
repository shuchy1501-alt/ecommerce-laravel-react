import { Outlet } from 'react-router-dom'
import AnnouncementBar from './AnnouncementBar'
import Header from './Header'
import Newsletter from './Newsletter'
import PublicFooter from './PublicFooter'

export default function PublicLayout() {
  return (
    <div className="storefront flex min-h-screen flex-col bg-white text-brand-dark">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Newsletter />
      <PublicFooter />
    </div>
  )
}
