import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import HTMLtoDOCX from 'html-to-docx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const input = path.join(root, 'docs', 'DESIGNER-HANDOFF.md');
const output = path.join(
  process.env.USERPROFILE || process.env.HOME || root,
  'Documents',
  'ServiceHub-Designer-Handoff.docx',
);

const md = fs.readFileSync(input, 'utf8');

const htmlBody = marked.parse(md, { gfm: true });

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ServiceHub Designer Handoff</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #1a1a1a; }
    h1 { font-size: 22pt; color: #0A1020; border-bottom: 2px solid #D4A373; padding-bottom: 6px; }
    h2 { font-size: 16pt; color: #0A1020; margin-top: 18px; }
    h3 { font-size: 13pt; color: #333; margin-top: 14px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f5f0eb; font-weight: bold; }
    code { font-family: Consolas, monospace; background: #f4f4f4; padding: 1px 4px; }
    pre { background: #f4f4f4; padding: 10px; white-space: pre-wrap; font-family: Consolas, monospace; font-size: 9pt; }
    blockquote { border-left: 4px solid #D4A373; margin-left: 0; padding-left: 12px; color: #555; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    ul, ol { margin: 8px 0; }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;

const buffer = await HTMLtoDOCX(html, null, {
  title: 'ServiceHub Designer Handoff',
  creator: 'ServiceHub',
  description: 'App structure and design system handoff for designers',
  margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, buffer);

console.log(`Saved: ${output}`);
