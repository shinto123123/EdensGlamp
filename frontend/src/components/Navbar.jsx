import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar(){
  return (
    <nav>
      <div className='container'>
        <Link to='/'>Home</Link>
        <Link to='/rooms'>Rooms</Link>
        <Link to='/gallery'>Gallery</Link>
        <Link to='/reserve'>Reserve</Link>
        <Link to='/login'>Login</Link>
      </div>
    </nav>
  )
}
