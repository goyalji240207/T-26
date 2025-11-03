import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import GoogleLogin from './GoogleLogin.jsx'


function App() {
  

  return (
    <>
      <h1 className='font-bold text-5xl my-2'>Techkriti' 26</h1>
      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:cursor-pointer">Login</button>
      <GoogleLogin />
    </>
  )
}

export default App;
