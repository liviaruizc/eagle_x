-- Ensure person.auth_user_id can store Supabase auth user ids (UUIDs).
-- Root cause for 22P02: column was bigint while app writes UUID string values.

begin;

do $$
declare
    current_type text;
begin
    select data_type
      into current_type
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'person'
       and column_name = 'auth_user_id';

    if current_type is null then
        raise exception 'Column public.person.auth_user_id does not exist';
    end if;

    if current_type <> 'uuid' then
        alter table public.person
            alter column auth_user_id drop default,
            alter column auth_user_id type uuid using null;
    end if;
end $$;

commit;
