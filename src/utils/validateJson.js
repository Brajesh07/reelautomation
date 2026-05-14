export function validateJson(data) {
  let arrayToValidate = data;

  // Handle wrapped structure like { "zodiacs": [...] }
  if (!Array.isArray(data) && data && typeof data === 'object' && Array.isArray(data.zodiacs)) {
    arrayToValidate = data.zodiacs;
  }

  if (!Array.isArray(arrayToValidate)) {
    return { valid: false, error: 'Input must be an array of objects or contain a "zodiacs" array.' };
  }

  if (arrayToValidate.length === 0 || arrayToValidate.length > 12) {
    return { valid: false, error: 'Array must contain 1 to 12 objects.' };
  }

  const requiredFields = ['name', 'vibe', 'love', 'career', 'money', 'soulMessage'];

  for (let i = 0; i < arrayToValidate.length; i++) {
    const zodiac = arrayToValidate[i];
    for (const field of requiredFields) {
      if (!zodiac[field] || typeof zodiac[field] !== 'string' || zodiac[field].trim() === '') {
        return { valid: false, error: `Item at index ${i} is missing or has an invalid field: "${field}".` };
      }
    }
  }

  return { valid: true, data: arrayToValidate };
}