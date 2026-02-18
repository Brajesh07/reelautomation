/**
 * Format a date to "17th Feb 2026" format
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
    const d = date.getDate()
    const m = date.toLocaleString('default', { month: 'short' })
    const y = date.getFullYear()

    const suffix = (day) => {
        if (day > 3 && day < 21) return 'th'
        switch (day % 10) {
            case 1: return "st"
            case 2: return "nd"
            case 3: return "rd"
            default: return "th"
        }
    }

    return `${d}${suffix(d)} ${m} ${y}`
}
