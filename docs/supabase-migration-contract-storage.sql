-- Create storage bucket for engagement contracts
insert into storage.buckets (id, name, public)
values ('engagement-contracts', 'engagement-contracts', false);

-- Allow authenticated CRM users to upload contracts
create policy "CRM users can upload contracts"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'engagement-contracts'
  and public.is_crm_user(auth.uid())
);

-- Allow authenticated CRM users to read contracts
create policy "CRM users can read contracts"
on storage.objects for select
to authenticated
using (
  bucket_id = 'engagement-contracts'
  and public.is_crm_user(auth.uid())
);

-- Allow authenticated CRM users to delete contracts
create policy "CRM users can delete contracts"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'engagement-contracts'
  and public.is_crm_user(auth.uid())
);

-- Allow authenticated CRM users to update contracts
create policy "CRM users can update contracts"
on storage.objects for update
to authenticated
using (
  bucket_id = 'engagement-contracts'
  and public.is_crm_user(auth.uid())
);
