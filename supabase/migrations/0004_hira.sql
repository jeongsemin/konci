-- Hospitals imported from the HIRA (건강보험심사평가원) public data.
-- Existing rows (from Naver search) keep working: they get source = 'naver' and the new columns stay null.

alter table public.hospitals
  add column source text not null default 'naver' check (source in ('hira', 'naver')),
  add column hira_id text unique,              -- ykiho: HIRA's encrypted, stable institution id
  add column sido text,
  add column sgg text,
  add column type_code text,                   -- clCd (e.g. 31 = 의원)
  add column homepage text,                    -- http(s) only; checked at import
  add column est_date date,
  add column doctor_count integer,
  add column derm_listed boolean not null default false,   -- 피부과 appears among its listed departments
  add column derm_specialists integer,         -- 피부과 전문의 count, from the detail API (null = not fetched yet)
  add column synced_at timestamptz,            -- last time the list data was refreshed from HIRA
  add column detail_synced_at timestamptz;     -- last time the detail data was fetched

create index hospitals_sido_sgg_idx on public.hospitals (sido, sgg);
create index hospitals_derm_listed_idx on public.hospitals (derm_listed) where derm_listed;
