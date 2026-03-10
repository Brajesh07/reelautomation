/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'garamond': ['Garamond', 'serif'],
            },
            colors: {
                'custom-gold': '#DAC477',
            },
        },
    },
    plugins: [],
}

