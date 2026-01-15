# Invoice Line Items

Source: https://www.fakturoid.cz/api/v3/invoices#attributes

## Lines in Invoice Payload

Invoice line items are sent in the `lines` array on invoice create/update.

Common line fields include:

- `name`
- `quantity`
- `unit_price`
- `vat_rate`

## VAT Pricing Notes

The API supports VAT price modes (e.g. `vat_price_mode`) that determine how unit prices are interpreted.

## Deleting a Line

To remove a line item during update, include the line with:

```
{ "id": 1234, "_destroy": true }
```
