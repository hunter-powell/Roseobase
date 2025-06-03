import React from 'react'
import { NavLink } from  'react-router-dom'

const Navbar = () => {
  return (
    <div className='navbar'> 
      <ul>
        <NavLink to='/'><li>Home</li></NavLink>
        <NavLink to='/genomes'><li>Genomes Available</li></NavLink>
        <NavLink to='/blast'><li>NCBI Blast</li></NavLink>
        <NavLink to='/jbrowse'><li>JBrowse</li></NavLink>
        <NavLink to='/contact'><li>Contact Us</li></NavLink>
      </ul>
    </div>
  )
}

export default Navbar

