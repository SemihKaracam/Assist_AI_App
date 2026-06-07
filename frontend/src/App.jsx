import { useState } from 'react'
import './App.css'
import HomePage from './pages/HomePage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='bg-red-600 text-black'>
      <HomePage />
    </div>
  )
}

export default App
