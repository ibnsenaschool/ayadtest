// generate-manifest.js — يمسح wel/all ويولّد manifest.json
const fs = require('fs');
const path = require('path');

const exts = new Set([
  '.jpg','.jpeg','.png','.webp','.gif','.bmp',
  '.mp4','.webm','.ogg',
  '.pdf','.ppt','.pptx'
]);

function walk(dir, filelist = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.git') || entry.name === 'node_modules') continue;
      walk(full, filelist);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (exts.has(ext)) filelist.push(full);
    }
  }
  return filelist;
}

function main() {
  const root = process.cwd(); // يجب أن يكون wel/all
  const files = walk(root)
    .map(f => f.replace(root + path.sep, '').replace(/\\/g, '/'))
    .filter(f => f !== 'index.html' && f !== 'manifest.json' && f !== 'generate-manifest.js');

  const manifest = files.map(f => ({ url: f, name: f.split('/').pop() }));
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote wel/all/manifest.json with ${manifest.length} items.`);
}
main();
