export type ClientOptionLabelSource = {
  company_name?: string | null;
  name?: string | null;
  brand_name?: string | null;
};

const normalize = (value?: string | null): string => value?.trim() ?? '';

export function getClientOptionLabel(client: ClientOptionLabelSource): string {
  return (
    normalize(client.company_name) ||
    normalize(client.name) ||
    normalize(client.brand_name) ||
    'Klient bez názvu'
  );
}
