import React from 'react'
import Navbar from './components/Navbar.jsx'
import Genomes from './pages/Genomes.jsx'
import Blast from './pages/Blast.jsx'
import Contact from './pages/Contact.jsx'
import JBrowse from './pages/JBrowse.jsx'
import Home from './pages/Home'
import { Routes, Route } from 'react-router-dom'

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/Genomes' element={<Genomes />} />
        <Route path='/JBrowse' element={<JBrowse/>} />
        <Route path='/Blast' element={<Blast />} />
        <Route path='/Contact' element={<Contact/>} />

      </Routes>
    </div>
  )
}

export default App
