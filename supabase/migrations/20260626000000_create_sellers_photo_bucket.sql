-- Create the bucket
insert into storage.buckets (id, name, public)
values ('sellers-photo', 'sellers-photo', true)
on conflict (id) do nothing;

-- Set up RLS policies for the sellers-photo bucket
create policy "Sellers-photo Public Access"
on storage.objects for select
to public
using (bucket_id = 'sellers-photo');

create policy "Sellers-photo Allow upload"
on storage.objects for insert
to public
with check (bucket_id = 'sellers-photo');

create policy "Sellers-photo Allow update"
on storage.objects for update
to public
using (bucket_id = 'sellers-photo')
with check (bucket_id = 'sellers-photo');

create policy "Sellers-photo Allow delete"
on storage.objects for delete
to public
using (bucket_id = 'sellers-photo');
