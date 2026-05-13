const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load data.json
const dataPath = path.join(__dirname, '../../public/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const outDir = path.join(__dirname, '../../out');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log(`Found ${data.zodiacs.length} zodiacs. Starting batch render...\n`);

data.zodiacs.forEach((zodiac) => {
  const sanitizedName = zodiac.name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const filename = `${sanitizedName}.mp4`;
  const outputPath = path.join(outDir, filename);
  
  // Create props object for the individual zodiac
  const inputProps = JSON.stringify({ zodiac });

  console.log(`-----------------------------------------`);
  console.log(`Rendering ${zodiac.name}...`);
  
  try {
    // Run remotion render command
    // We run it from the root directory
    execSync(
      `npx remotion render remotion.index.jsx SingleZodiacReel ${outputPath} --props='${inputProps.replace(/'/g, "'\\''")}'`,
      { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '../../')
      }
    );
    console.log(`\nDone → out/${filename}\n`);
  } catch (error) {
    console.error(`\nFailed to render ${zodiac.name}\n`);
  }
});

console.log(`-----------------------------------------`);
console.log(`Batch render complete! Files are in the 'out/' directory.`);
