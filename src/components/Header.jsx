import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navLinks = [
    { label: 'Design', to: '/design' },
    { label: 'Frame Preview', to: '/frame-preview' },
]

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false)

    const linkClass = ({ isActive }) =>
        `text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded-md ${isActive
            ? 'text-[#DAC477] bg-[#DAC477]/10'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`

    return (
        <header className='fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/10'>
            <div className='max-w-screen-xl mx-auto px-5 h-14 flex items-center justify-between'>

                {/* Logo / Title */}
                <NavLink to="/" className='text-[#DAC477] font-bold text-lg tracking-wide select-none hover:opacity-80 transition-opacity'>
                    StarryVibes
                </NavLink>

                {/* Desktop Nav */}
                <nav className='hidden md:flex items-center gap-1'>
                    {navLinks.map(link => (
                        <NavLink key={link.to} to={link.to} className={linkClass}>
                            {link.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Mobile Hamburger */}
                <button
                    className='md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-white/5 transition-colors'
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label='Toggle menu'
                >
                    <span className={`block h-0.5 w-5 bg-gray-400 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                    <span className={`block h-0.5 w-5 bg-gray-400 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                    <span className={`block h-0.5 w-5 bg-gray-400 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                </button>
            </div>

            {/* Mobile Dropdown */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
                <nav className='flex flex-col px-5 pb-4 gap-1 border-t border-white/10 pt-3'>
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={linkClass}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </header>
    )
}

export default Header
