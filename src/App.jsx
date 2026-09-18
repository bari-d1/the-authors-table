import { Route, Routes } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import BookGallery from './pages/BookGallery'
import BookThread from './pages/BookThread'
import ChapterSearch from './pages/ChapterSearch'

function App() {
  return (
    <Routes>
      <Route path="/" element={<BookGallery />} />
      <Route path="/book/:bookId" element={<BookThread />} />
      <Route path="/search" element={<ChapterSearch />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  )
}

export default App
