import React from 'react'
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Videos from "./pages/Videos"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/videos" element={<Videos />} />
    </Routes>
  )
}
