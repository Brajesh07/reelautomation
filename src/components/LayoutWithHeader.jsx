import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

const LayoutWithHeader = () => {
    return (
        <div className='min-h-screen w-full bg-[#1a1a1a] flex flex-col'>
            <Header />
            {/* pt-14 matches the fixed header height (h-14 = 56px) */}
            <main className='flex-1 pt-14 flex justify-center items-start'>
                <Outlet />
            </main>
        </div>
    )
}

export default LayoutWithHeader
