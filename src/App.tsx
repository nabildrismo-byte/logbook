import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/ui/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { AddFlight } from '@/pages/AddFlight'
import { Students } from '@/pages/Students'
import { StudentDetail } from '@/pages/StudentDetail'
import { FlightMeter } from './pages/FlightMeter'
import { CourseTracker } from './pages/CourseTracker'
import { Instructors } from './pages/Instructors'
import { Login } from '@/pages/Login'
import { MyFlights } from './pages/MyFlights'
import { AdminValidations } from './pages/AdminValidations'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddFlight />} />
          <Route path="/students" element={<Students />} />
          <Route path="/my-flights" element={<MyFlights />} />
          <Route path="/validations" element={<AdminValidations />} />
          <Route path="/tracker" element={<CourseTracker />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/students/:name" element={<StudentDetail />} />
          <Route path="/meter" element={<FlightMeter />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App