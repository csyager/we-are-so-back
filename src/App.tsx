import { useState, useEffect } from 'react';

import Canvas from './components/Canvas.tsx';
import Login from './components/Login.tsx';

import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [gameId, setGameId] = useState<String|null>(null);
  const [userId, setUserId] = useState<String|null>(null);

  useEffect(() => {
    setGameId(localStorage.getItem('gameId'));
    setUserId(localStorage.getItem('userId'));
  }, [])


  return (
    <>
      <h1>We're so back.</h1>
      
      <div className="container canvas-container">
        {gameId !== null && <Canvas />}
        {gameId === null && <Login />}
      </div>
    </>
  )
}

export default App
