const fs = require('fs');
const path = require('path');
const https = require('https');

// Supabase config
const SUPABASE_URL = 'https://bkemtvqmbpxopuasgxcq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrZW10dnFtYnB4b3B1YXNneGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODQ3NTksImV4cCI6MjA4Mzk2MDc1OX0.w84I0KkFiJZ01BxABdfE9PqSbTkiwNl6jp7SD0ut0Xg';
const BUCKET_NAME = 'sop-attachments';

const SOP_DIR = '/Users/adamrana/Downloads/Private & Shared 3/SOPs (procesy, co se jak v Socials dělá) - public/SOPs';

// Find all media files
function findMediaFiles(dir) {
  const mediaFiles = [];
  const extensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.webp'];

  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (extensions.includes(ext)) {
          // Get relative path from SOP_DIR
          const relativePath = fullPath.substring(SOP_DIR.length + 1);
          mediaFiles.push({
            fullPath,
            relativePath,
            fileName: item,
            size: stat.size,
          });
        }
      }
    }
  }

  scan(dir);
  return mediaFiles;
}

// Upload file to Supabase storage
async function uploadFile(filePath, storagePath) {
  return new Promise((resolve, reject) => {
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    const contentTypes = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    const url = new URL(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${storagePath}`);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length,
        'x-upsert': 'true',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Return public URL
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`;
          resolve({ success: true, url: publicUrl });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });

    req.write(fileBuffer);
    req.end();
  });
}

async function main() {
  console.log('Finding media files...');
  const mediaFiles = findMediaFiles(SOP_DIR);
  console.log(`Found ${mediaFiles.length} media files\n`);

  const urlMapping = {};

  for (const file of mediaFiles) {
    console.log(`Uploading: ${file.relativePath} (${(file.size / 1024).toFixed(1)} KB)`);

    // Create storage path: sop-media/[sanitized-folder]/[filename]
    const storagePath = `sop-media/${file.relativePath.replace(/[^a-zA-Z0-9._/-]/g, '_')}`;

    const result = await uploadFile(file.fullPath, storagePath);

    if (result.success) {
      console.log(`  ✓ Uploaded: ${result.url}`);

      // Store mapping from original path to new URL
      // The original path in markdown looks like: SOP%20folder/filename.png
      const encodedPath = encodeURIComponent(file.relativePath.split('/')[0]) + '/' + file.fileName;
      urlMapping[file.relativePath] = result.url;
      urlMapping[encodedPath] = result.url;
      urlMapping[file.fileName] = result.url;
    } else {
      console.log(`  ✗ Failed: ${result.error}`);
    }
  }

  // Save URL mapping for the import script
  const mappingPath = '/Users/adamrana/Documents/socials/scripts/sop-media-urls.json';
  fs.writeFileSync(mappingPath, JSON.stringify(urlMapping, null, 2));
  console.log(`\nURL mapping saved to: ${mappingPath}`);
}

main().catch(console.error);
