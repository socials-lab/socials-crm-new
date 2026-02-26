const fs = require('fs');
const path = require('path');

// Will be loaded dynamically
let marked;

// Category mapping from Department to category_id
const categoryMap = {
  'Administrace': '11111111-1111-1111-1111-111111111101',
  'Finance': '11111111-1111-1111-1111-111111111102',
  'Projektový management': '11111111-1111-1111-1111-111111111103',
  'Meta Ads': '11111111-1111-1111-1111-111111111104',
  'PPC': '11111111-1111-1111-1111-111111111104', // Map to Meta Ads
  'Grafika': '11111111-1111-1111-1111-111111111105',
  'Sales': '11111111-1111-1111-1111-111111111106',
  'Pro klienty': '11111111-1111-1111-1111-111111111107',
  'HR': '11111111-1111-1111-1111-111111111108',
  'Pracovní pozice a odpovědnosti': '11111111-1111-1111-1111-111111111108', // Map to HR
  'Marketing': '11111111-1111-1111-1111-111111111109',
  'Videa': '11111111-1111-1111-1111-111111111110',
  'Komunikace': '11111111-1111-1111-1111-111111111111',
  'Produkty a služby': '11111111-1111-1111-1111-111111111112',
  'Meta ads - meetings': '11111111-1111-1111-1111-111111111113',
  'Security': '11111111-1111-1111-1111-111111111114',
  'AI': '11111111-1111-1111-1111-111111111114',
};

// Parse CSV to get SOP -> Department mapping
function parseCSV(csvPath) {
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const mapping = {};

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV line (handle quoted fields)
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    // Playbook (title) is field 0, Department is field 4
    const title = fields[0];
    const department = fields[4];

    if (title && department) {
      mapping[title] = department;
    }
  }

  return mapping;
}

// Clean markdown content and remove Notion metadata
function cleanMarkdownContent(content) {
  const lines = content.split('\n');
  let cleanedLines = [];
  let skipMetadata = true;
  let skipDuleziteInfo = false;
  let duleziteInfoEmptyCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip first line (title) - we extract it separately
    if (i === 0 && line.startsWith('# ')) {
      continue;
    }

    // Skip metadata lines at the beginning
    if (skipMetadata) {
      if (line.startsWith('Owner:') ||
          line.startsWith('Last edited time:') ||
          line.startsWith('Last edited by:') ||
          line.startsWith('Stav:') ||
          line.startsWith('Department:') ||
          line.startsWith('Created time:') ||
          line.startsWith('Value driver:') ||
          line.startsWith('Priority:') ||
          line.trim() === '') {
        continue;
      }
      skipMetadata = false;
    }

    // Skip empty "Důležité info" sections
    if (line === '## Důležité info' || line === '## Dôležité info') {
      skipDuleziteInfo = true;
      duleziteInfoEmptyCount = 0;
      continue;
    }

    if (skipDuleziteInfo) {
      const trimmed = line.trim();
      // Check for placeholder lines
      if (trimmed === '' ||
          trimmed === '🙋‍♂️ Hlavní decision maker:' ||
          trimmed === '📁 Hlavní složky:' ||
          trimmed === '🛠️ Tooly, které zde používáme:' ||
          trimmed === '🤖 Chat GPT Asistenti, které můžeme použít:' ||
          trimmed.match(/^🙋‍♂️ Hlavní decision maker:\s*@?\w*\s*$/) ||
          trimmed.match(/^📁 Hlavní složky:\s*$/) ||
          trimmed.match(/^🛠️ Tooly, které zde používáme:\s*\w*\s*$/) ||
          trimmed.match(/^🤖 Chat GPT Asistenti, které můžeme použít:\s*$/)) {
        duleziteInfoEmptyCount++;
        if (duleziteInfoEmptyCount < 10) continue;
      }

      // If we hit real content (a header or substantial text), stop skipping
      if (line.startsWith('#') || (trimmed.length > 50 && !trimmed.startsWith('🙋') && !trimmed.startsWith('📁') && !trimmed.startsWith('🛠') && !trimmed.startsWith('🤖'))) {
        skipDuleziteInfo = false;
        cleanedLines.push(line);
        continue;
      }

      // If line has some content but not a header, also stop
      if (trimmed && !trimmed.startsWith('🙋') && !trimmed.startsWith('📁') && !trimmed.startsWith('🛠') && !trimmed.startsWith('🤖')) {
        skipDuleziteInfo = false;
        cleanedLines.push(line);
        continue;
      }

      continue;
    }

    cleanedLines.push(line);
  }

  // Remove leading empty lines
  while (cleanedLines.length > 0 && cleanedLines[0].trim() === '') {
    cleanedLines.shift();
  }

  // Remove trailing empty lines
  while (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1].trim() === '') {
    cleanedLines.pop();
  }

  return cleanedLines.join('\n');
}

// Extract title from markdown
function extractTitle(content) {
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  return null;
}

// Generate search text (strip markdown/HTML)
function generateSearchText(content) {
  return content
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/>\s+/g, '')
    .replace(/[-*]\s+/g, '')
    .replace(/\d+\.\s+/g, '')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Escape string for SQL
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Main import function
async function importSOPs() {
  // Dynamically import marked (ES module)
  const markedModule = await import('marked');
  marked = markedModule.marked;

  // Configure marked for proper HTML output
  marked.setOptions({
    breaks: true,  // Convert \n to <br>
    gfm: true,     // GitHub Flavored Markdown
  });

  const sopDir = '/Users/adamrana/Downloads/Private & Shared 3/SOPs (procesy, co se jak v Socials dělá) - public/SOPs';
  const csvPath = '/Users/adamrana/Downloads/Private & Shared/SOPs (procesy, co se jak v Socials dělá) - public/SOPs 2c1f592d6ab043efaf977ef8c4733eca.csv';

  // Parse CSV for title -> department mapping
  const titleToDepartment = parseCSV(csvPath);
  console.log(`Found ${Object.keys(titleToDepartment).length} SOPs in CSV`);

  // Get all markdown files
  const files = fs.readdirSync(sopDir).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} markdown files`);

  const sops = [];
  let sortOrder = 1;

  for (const file of files) {
    const filePath = path.join(sopDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const title = extractTitle(content);
    if (!title) {
      console.log(`Skipping ${file} - no title found`);
      continue;
    }

    // Find department from CSV
    let department = null;
    for (const csvTitle of Object.keys(titleToDepartment)) {
      // Match by partial title (CSV titles might be slightly different)
      if (csvTitle.includes(title) || title.includes(csvTitle) ||
          csvTitle.toLowerCase().includes(title.toLowerCase().substring(0, 20))) {
        department = titleToDepartment[csvTitle];
        break;
      }
    }

    // Try exact match
    if (!department) {
      department = titleToDepartment[title];
    }

    if (!department) {
      // Default to Administrace for unknown
      console.log(`No department found for: ${title} - defaulting to Administrace`);
      department = 'Administrace';
    }

    // Handle multi-department entries (take first)
    if (department.includes(',')) {
      department = department.split(',')[0].trim();
    }

    const categoryId = categoryMap[department];
    if (!categoryId) {
      console.log(`No category mapping for department: ${department} (${title})`);
      continue;
    }

    // Clean markdown content
    const cleanedMarkdown = cleanMarkdownContent(content);

    // Convert markdown to HTML
    const htmlContent = marked.parse(cleanedMarkdown);

    // Generate search text from cleaned markdown
    const searchText = generateSearchText(cleanedMarkdown);

    sops.push({
      id: generateUUID(),
      category_id: categoryId,
      title: title,
      content: htmlContent,
      search_text: searchText,
      sort_order: sortOrder++,
      is_published: true,
      department: department,
    });
  }

  console.log(`\nProcessed ${sops.length} SOPs`);

  // Output SQL for import - first DELETE existing, then INSERT
  const sqlFile = '/Users/adamrana/Documents/socials/scripts/sop-import.sql';
  let sql = 'SET ROLE postgres;\n\n';
  sql += '-- Delete existing articles first\n';
  sql += 'DELETE FROM sop_articles;\n\n';

  for (const sop of sops) {
    sql += `INSERT INTO sop_articles (id, category_id, title, content, search_text, sort_order, is_published) VALUES (
'${sop.id}',
'${sop.category_id}',
'${escapeSql(sop.title)}',
'${escapeSql(sop.content)}',
'${escapeSql(sop.search_text.substring(0, 5000))}',
${sop.sort_order},
true
);\n\n`;
  }

  fs.writeFileSync(sqlFile, sql);
  console.log(`\nSQL file written to: ${sqlFile}`);

  // Also output a summary by category
  const byCategory = {};
  for (const sop of sops) {
    if (!byCategory[sop.department]) {
      byCategory[sop.department] = [];
    }
    byCategory[sop.department].push(sop.title);
  }

  console.log('\n=== SOPs by Category ===');
  for (const [dept, titles] of Object.entries(byCategory).sort()) {
    console.log(`\n${dept} (${titles.length}):`);
    titles.forEach(t => console.log(`  - ${t}`));
  }
}

importSOPs().catch(console.error);
