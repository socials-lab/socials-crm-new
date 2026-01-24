/**
 * Generate Sample Contract PDF
 *
 * Usage: npx ts-node scripts/generate-sample-contract.ts
 * Output: scripts/sample-contract.pdf
 */

import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { generateContractHtml, ContractData } from './contract-template';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample test data
const sampleData: ContractData = {
  company_name: 'Test Company s.r.o.',
  billing_address: 'Testovací 123, Praha 1 110 00',
  ico: '12345678',
  dic: 'CZ12345678',
  court_name: 'Městským soudem v Praze',
  court_file_number: 'C 123456',
  signatories: [{
    name: 'Jan Novák',
    position: 'jednatel',
    email: 'jan@testcompany.cz',
  }],
  website_url: 'https://www.testcompany.cz',
  additional_emails: 'marketing@testcompany.cz',
  invoice_email: 'fakturace@testcompany.cz',
  monthly_fee: 50000,
  setup_fee: 25000,
  contract_date: '22. ledna 2026',
};

async function generatePdf() {
  console.log('🚀 Starting PDF generation...');

  // Generate HTML
  const html = generateContractHtml(sampleData);
  console.log('✅ HTML template generated');

  // Save HTML for debugging (optional)
  const htmlPath = path.join(__dirname, 'sample-contract.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`📄 HTML saved to: ${htmlPath}`);

  // Launch Puppeteer
  console.log('🌐 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set content
  await page.setContent(html, {
    waitUntil: 'networkidle0',
  });

  // Generate PDF
  const pdfPath = path.join(__dirname, 'sample-contract.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm',
    },
  });

  console.log(`✅ PDF saved to: ${pdfPath}`);

  await browser.close();
  console.log('🎉 Done!');

  // Open PDF (macOS)
  if (process.platform === 'darwin') {
    console.log('📂 Opening PDF...');
    exec(`open "${pdfPath}"`);
  }

  return pdfPath;
}

// Run
generatePdf().catch((error) => {
  console.error('❌ Error generating PDF:', error);
  process.exit(1);
});
