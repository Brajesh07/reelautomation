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

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            setError('Please upload a valid .json file.')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
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

    return (
        <div style={{
            color: 'white',
            padding: '40px',
            fontFamily: 'sans-serif',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center'
        }}>
            <h1 style={{ color: '#DAC477' }}>Upload Custom Zodiac Data</h1>
            <p style={{ lineHeight: '1.6', marginBottom: '30px' }}>
                Upload a JSON file to override the default zodiac data for the reel.<br />
                <strong>Requirements:</strong> 3 Zodiacs with strict fields (name, vibe, love, career, money, soulMessage).
            </p>

            <div style={{
                border: '2px dashed #444',
                padding: '40px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)'
            }}>
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    style={{ color: 'white' }}
                />
            </div>

            {error && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: 'rgba(255, 68, 68, 0.2)',
                    border: '1px solid #ff4444',
                    borderRadius: '5px',
                    color: '#ffaaaa'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div style={{ marginTop: '40px', borderTop: '1px solid #333', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '16px', color: '#888' }}>Current Data Source</h3>
                <p style={{ fontSize: '14px', color: localStorage.getItem('customZodiacData') ? '#4caf50' : '#888' }}>
                    {localStorage.getItem('customZodiacData') ? '✅ Start using Custom Data' : 'Using Default Data'}
                </p>

                {localStorage.getItem('customZodiacData') && (
                    <button
                        onClick={handleReset}
                        style={{
                            background: '#ff4444',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        Reset to Default
                    </button>
                )}
            </div>

            <div style={{ marginTop: '30px' }}>
                <a href="/" style={{ color: '#DAC477', marginRight: '20px' }}>Go to Reel Canvas</a>
                <a href="/frame-preview" style={{ color: '#DAC477' }}>Go to Frame Preview</a>
            </div>
        </div>
    )
}

export default UploadData
