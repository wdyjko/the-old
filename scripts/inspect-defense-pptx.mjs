import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const source =
  process.argv[2] ||
  "C:/Users/Lenovo/Desktop/the-old-no-deps/智慧助老服务对接平台-毕业答辩.pptx";
const artifactPath =
  "C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
const { FileBlob, PresentationFile } = await import(pathToFileURL(artifactPath).href);

function slideAt(presentation, index) {
  if (typeof presentation.slides.getItem === "function")
    return presentation.slides.getItem(index);
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

const presentation = await PresentationFile.importPptx(await FileBlob.load(source));
const count = presentation.slides.count ?? presentation.slides.length;
const records = [];
for (let i = 0; i < count; i++) {
  const slide = slideAt(presentation, i);
  const layout = await presentation.export({ slide, format: "layout" });
  const layoutText = await layout.text();
  const texts = [...new Set(collectText(JSON.parse(layoutText)))];
  records.push({ slide: i + 1, textCount: texts.length, texts });
}
const outPath = path.join(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")),
  "defense-slide-text.json"
);
await fs.writeFile(outPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ count, outPath }, null, 2));
