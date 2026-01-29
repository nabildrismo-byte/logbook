import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/ui/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { AddFlight } from '@/pages/AddFlight'
import { Students } from '@/pages/Students'
import { StudentDetail } from '@/pages/StudentDetail'
import { Login } from '@/pages/Login'


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddFlight />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:name" element={<StudentDetail />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App