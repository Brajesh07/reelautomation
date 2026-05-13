import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";

const main = async () => {
  const jsonPath = process.argv[2];
  const dateStr = process.argv[3] || new Date().toISOString().split('T')[0];

  if (!jsonPath) {
    console.error("Usage: node renderAll.js <json-path> [date-string]");
    process.exit(1);
  }

  let zodiacs;
  try {
    const rawData = fs.readFileSync(jsonPath, "utf-8");
    const parsedData = JSON.parse(rawData);
    zodiacs = Array.isArray(parsedData) ? parsedData : (parsedData.zodiacs || []);
  } catch (err) {
    console.error("Failed to parse JSON input:", err);
    process.exit(1);
  }

  const outDir = path.resolve("./out");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Found ${zodiacs.length} zodiacs. Bundling project...`);
  
  const bundleLocation = await bundle({
    entryPoint: path.resolve("./remotion.index.jsx"),
    // If you have specific webpack overrides, add them here
  });

  for (const zodiac of zodiacs) {
    const compositionId = "SingleZodiacReel";
    const filename = `${zodiac.name}_${dateStr}.mp4`;
    const outputPath = path.join(outDir, filename);

    console.log(`Rendering ${zodiac.name}...`);

    try {
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: compositionId,
        inputProps: { zodiac },
      });

      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: "h264",
        outputLocation: outputPath,
        inputProps: { zodiac },
      });

      console.log(`✅ ${filename} done`);
    } catch (err) {
      console.error(`❌ Failed to render ${zodiac.name}:`, err);
    }
  }

  console.log("🎉 All renders complete");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
