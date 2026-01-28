import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/ui/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { AddFlight } from '@/pages/AddFlight'
import { Login } from '@/pages/Login'
import { Students } from '@/pages/Students'
import { StudentDetail } from '@/pages/StudentDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:name" element={<StudentDetail />} />
          <Route path="/add" element={<AddFlight />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
