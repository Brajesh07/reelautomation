import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const UploadData = () => {
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const validateData = (data) => {
        if (!data.zodiacs || !Array.isArray(data.zodiacs)) {
            return 'JSON must contain a top-level "zodiacs" array.'
        }

        if (data.zodiacs.length !== 3) {
            return `Expected exactly 3 zodiacs, found ${data.zodiacs.length}.`
        }

        const requiredFields = ['name', 'vibe', 'love', 'career', 'money', 'soulMessage']

        for (let i = 0; i < data.zodiacs.length; i++) {
            const zodiac = data.zodiacs[i]
            for (const field of requiredFields) {
                if (!zodiac[field] || typeof zodiac[field] !== 'string' || zodiac[field].trim() === '') {
                    return `Zodiac #${i + 1} is missing strictly required field: "${field}" (must be a non-empty string).`
                }
            }
        }

        return null // No error
    }

    const handleFileUpload = (event) => {
        const file = event.target.files[0]
        if (!file) return

        // Reset state immediately on every new file selection
        setError('')

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setError('Please upload a valid .json file.')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            // Clear before validating in case of async timing
            setError('')
            try {
                const json = JSON.parse(e.target.result)
                const validationError = validateData(json)

                if (validationError) {
                    setError(validationError)
                } else {
                    // Valid Data
                    localStorage.setItem('customZodiacData', JSON.stringify(json))
                    setError('')
                    navigate('/frame-preview')
                }
            } catch (err) {
                setError('Invalid JSON format. Please check your file syntax.')
            }
        }
        reader.readAsText(file)
    }

    const handleReset = () => {
        localStorage.removeItem('customZodiacData')
        window.location.reload()
    }

    const downloadSample = () => {
        const sampleData = {
            "zodiacs": [
                {
                    "name": "Leo",
                    "vibe": "Radiant",
                    "love": "Passionate encounters.",
                    "career": "Leadership success.",
                    "money": "Invest wisely.",
                    "soulMessage": "Shine bright."
                },
                {
                    "name": "Virgo",
                    "vibe": "Grounded",
                    "love": "Practical love.",
                    "career": "Detail oriented.",
                    "money": "Budgeting pays.",
                    "soulMessage": "Trust process."
                },
                {
                    "name": "Libra",
                    "vibe": "Balanced",
                    "love": "Harmony is key.",
                    "career": "Diplomacy wins.",
                    "money": "Balance books.",
                    "soulMessage": "Seek peace."
                }
            ]
        }
        const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sample-zodiac.json'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className='text-white p-10 font-sans max-w-2xl mx-auto text-center'>
            <h1 className='text-3xl mb-4'>Upload Custom Zodiac Data</h1>
            <p className='leading-relaxed mb-8'>
                Upload a JSON file to override the default zodiac data for the reel.<br />
                <strong>Requirements:</strong> 3 Zodiacs with strict fields (name, vibe, love, career, money, soulMessage).
            </p>

            <div className='mb-8'>
                <button
                    onClick={downloadSample}
                    className='bg-blue-500 text-white border-none py-3 px-6 rounded cursor-pointer text-base font-bold hover:bg-blue-600 transition-colors'
                >
                    ⬇️ Download Sample JSON
                </button>
            </div>

            <div className='border-2 border-dashed border-gray-600 p-10 rounded-lg bg-white bg-opacity-5'>
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className='text-white'
                />
            </div>

            {error && (
                <div className='mt-5 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-300'>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className='mt-10 border-t border-gray-700 pt-5'>
                <h3 className='text-base text-gray-500'>Current Data Source</h3>
                <p className={`text-sm ${localStorage.getItem('customZodiacData') ? 'text-green-500' : 'text-gray-500'}`}>
                    {localStorage.getItem('customZodiacData') ? '✅ Start using Custom Data' : 'Using Default Data'}
                </p>

                {localStorage.getItem('customZodiacData') && (
                    <button
                        onClick={handleReset}
                        className='bg-red-500 text-white border-none py-2.5 px-5 rounded cursor-pointer mt-2.5 hover:bg-red-600 transition-colors'
                    >
                        Reset to Default
                    </button>
                )}
            </div>

            <div className='mt-8'>
                <a href="/reel-canvas" className='text-[#DAC477] mr-5 hover:underline'>Go to Reel Canvas</a>
                <a href="/frame-preview" className='text-[#DAC477] hover:underline'>Go to Frame Preview</a>
            </div>
        </div>
    )
}

export default UploadData
