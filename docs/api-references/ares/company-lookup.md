# Company Lookup (IČO)

Source: https://ares.gov.cz/swagger-ui/

## Base URL

`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest`

## Endpoints

The Swagger UI lists:

- `POST /ekonomicke-subjekty/vyhledat` – search by criteria

The current CRM integration uses a direct lookup by IČO:

- `GET /ekonomicke-subjekty/{ico}`

Example full URL:

`https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/{ico}`

## Response Fields (used in CRM)

- `ico`
- `obchodniJmeno` (company name)
- `dic` (VAT ID)
- `sidlo.textovaAdresa` (address)
