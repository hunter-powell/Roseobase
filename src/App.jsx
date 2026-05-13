import React from 'react'
import Navbar from './components/Navbar.jsx'
import Genomes from './pages/Genomes.jsx'
import Blast from './pages/Blast.jsx'
import JBrowse from './pages/JBrowse.jsx'
import Home from './pages/Home'
import Settings from './pages/Settings.jsx'
import { Routes, Route, useLocation } from 'react-router-dom'

const App = () => {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className='app-shell'>
      {!isHome && <Navbar />}
      <div className='app-container'>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/genomes' element={<Genomes />} />
          <Route path='/jbrowse' element={<JBrowse/>} />
          <Route path='/blast' element={<Blast />} />
          <Route path='/settings' element={<Settings />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
