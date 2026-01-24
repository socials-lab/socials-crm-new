# Contract Template Placeholders

Template file: `smlouva-template.html`

## Client Information Placeholders

| Placeholder | Description | CRM Field |
|-------------|-------------|-----------|
| `NÁZEV FIRMY` | Company name | `company_name` |
| `SÍDLO FIRMY` | Company address | `billing_street`, `billing_city`, `billing_zip` |
| `ČÍSLO IČO` | Company registration number | `ico` |
| `ČÍSLO DIČ` | VAT number | `dic` |
| `NÁZEV SOUDU` | Court name (from ARES) | - |
| `ČÍSLO ZNAČKY` | Company registration number at court | - |
| `JMÉNO JEDNATELE` | Director/representative name | `contact_name` |
| `EMAIL JEDNATELE` | Director's email | `contact_email` |

## Additional Placeholders

| Placeholder | Description | CRM Field |
|-------------|-------------|-----------|
| `URL WEBU` | Client's website URL | `website_url` or from services |
| `EMAIL KOLEGŮ` | Additional contact emails | `additional_emails` |
| `MAIL FAKTURY` | Invoice email | `invoice_email` |
| `PAUŠÁL` | Monthly retainer fee (Kč bez DPH) | `monthly_fee` or from services |
| `JEDNORÁZOVÁ ODMĚNA` | One-time setup fee (Kč bez DPH) | `setup_fee` or from services |
| `PRODUKTY` | List of services | `services[]` |
| `DATUM UZAVŘENÍ` | Contract date | auto-generated |

## Signature Placeholders

The template uses `___________________________` lines for signatures, not text placeholders.

For DigiSign integration, we need to either:
1. Replace `___________________________` with DigiSign placeholders (`PODPIS1`, `PODPIS2`)
2. Or use coordinate-based tag placement in DigiSign

**Signature locations (end of document):**
- `Daniel Bauer, jednatel` - Socials representative (PODPIS1)
- `JMÉNO JEDNATELE , jednatel` - Client representative (PODPIS2)

## Implementation Notes

1. All placeholders are plain Czech text (not `{{variable}}` format)
2. HTML file has Google Docs styling - will need cleanup for Puppeteer
3. Some data (NÁZEV SOUDU, ČÍSLO ZNAČKY) may need ARES API lookup
4. Prices need formatting with thousand separators
5. Date format: Czech format (e.g., "22. ledna 2026")

## Sample Replacement Map

```typescript
const replacements = {
  'NÁZEV FIRMY': lead.company_name,
  'SÍDLO FIRMY': `${lead.billing_street}, ${lead.billing_city} ${lead.billing_zip}`,
  'ČÍSLO IČO': lead.ico,
  'ČÍSLO DIČ': lead.dic || 'neuvedeno',
  'NÁZEV SOUDU': aresData.court_name || 'příslušného soudu',
  'ČÍSLO ZNAČKY': aresData.file_number || '-',
  'JMÉNO JEDNATELE': lead.contact_name,
  'EMAIL JEDNATELE': lead.contact_email,
  'URL WEBU': lead.website_url,
  'EMAIL KOLEGŮ': lead.additional_emails || lead.contact_email,
  'MAIL FAKTURY': lead.invoice_email || lead.contact_email,
  'PAUŠÁL': formatCurrency(lead.monthly_fee),
  'JEDNORÁZOVÁ ODMĚNA': formatCurrency(lead.setup_fee),
  'DATUM UZAVŘENÍ': formatCzechDate(new Date()),
};
```
