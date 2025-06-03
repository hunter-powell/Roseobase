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
      <div className='container'>
       <Routes>
         <Route path='/' element={<Home />} />
         <Route path='/genomes' element={<Genomes />} />
         <Route path='/jbrowse' element={<JBrowse/>} />
         <Route path='/blast' element={<Blast />} />
         <Route path='/contact' element={<Contact/>} />
       </Routes>
      </div>
    </div>
  )
}

export default App
