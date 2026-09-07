import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const workspace = "C:/Users/Lenovo/Desktop/the-old-no-deps/outputs/019e6768-3078-73d0-9233-2ba286ee6e8b/presentations/manual-density-edit";
const source = path.join(workspace, "source-manual.pptx");
const previewDir = path.join(workspace, "preview");
const layoutDir = path.join(workspace, "layout");

const artifactPath = "C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
const { FileBlob, PresentationFile } = await import(pathToFileURL(artifactPath).href);

function slideAt(presentation, index) {
  if (typeof presentation.slides.getItem === "function") return presentation.slides.getItem(index);
  return presentation.slides[index];
}

function collectText(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (typeof node.text === "string" && node.text.trim()) out.push(node.text.trim());
  if (node.text && typeof node.text === "object") {
    const raw = node.text.text || node.text.value || node.text.plainText;
    if (typeof raw === "string" && raw.trim()) out.push(raw.trim());
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => collectText(item, out));
    else if (value && typeof value === "object") collectText(value, out);
  }
  return out;
}

await fs.mkdir(previewDir, { recursive: true });
await fs.mkdir(layoutDir, { recursive: true });
const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
const count = presentation.slides.count ?? presentation.slides.length;
const records = [];
async function saveBlob(blob, file) {
  if (typeof blob.save === "function") return blob.save(file);
  const buffer = Buffer.from(await blob.arrayBuffer());
  await fs.writeFile(file, buffer);
}
for (let i = 0; i < count; i++) {
  const slide = slideAt(presentation, i);
  const n = String(i + 1).padStart(2, "0");
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await saveBlob(png, path.join(previewDir, `slide-${n}.png`));
  let layoutText = "";
  try {
    const layout = await presentation.export({ slide, format: "layout" });
    layoutText = await layout.text();
    await fs.writeFile(path.join(layoutDir, `slide-${n}.layout.json`), layoutText, "utf8");
  } catch {}
  const texts = layoutText ? [...new Set(collectText(JSON.parse(layoutText)))] : [];
  records.push({ slide: i + 1, textCount: texts.length, texts });
}
await fs.writeFile(path.join(workspace, "slide-text.json"), `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ count, previewDir, textManifest: path.join(workspace, "slide-text.json") }, null, 2));
