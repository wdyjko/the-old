import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const source =
  "C:/Users/Lenovo/Desktop/the-old-no-deps/智慧助老服务对接平台-毕业答辩.pptx";
const outDir = "C:/Users/Lenovo/Desktop/the-old-no-deps/scripts/slide-previews";
const slides = process.argv.slice(2).map(Number);
const artifactPath =
  "C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
const { FileBlob, PresentationFile } = await import(pathToFileURL(artifactPath).href);

function slideAt(presentation, index) {
  if (typeof presentation.slides.getItem === "function")
    return presentation.slides.getItem(index);
  return presentation.slides[index];
}

await fs.mkdir(outDir, { recursive: true });
const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
const count = presentation.slides.count ?? presentation.slides.length;
const targets = slides.length ? slides : Array.from({ length: count }, (_, i) => i + 1);
async function saveBlob(blob, file) {
  if (typeof blob.save === "function") return blob.save(file);
  await fs.writeFile(file, Buffer.from(await blob.arrayBuffer()));
}
for (const n of targets) {
  const slide = slideAt(presentation, n - 1);
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await saveBlob(png, path.join(outDir, `slide-${String(n).padStart(2, "0")}.png`));
}
console.log("exported", targets.length, "slides to", outDir);
