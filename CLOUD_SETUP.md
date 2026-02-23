# 재고앱 24시간 운영 설정 (Supabase + 로컬 내보내기)

## 1) Supabase SQL 먼저 실행
Supabase Dashboard -> SQL Editor 에서 아래 SQL 실행:

```sql
create table if not exists public.inventory_state (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.inventory_state enable row level security;

drop policy if exists inventory_state_anon_rw on public.inventory_state;
create policy inventory_state_anon_rw
on public.inventory_state
for all
to anon
using (true)
with check (true);

insert into public.inventory_state (id, state)
values ('4danji-main', '{}'::jsonb)
on conflict (id) do nothing;
```

## 2) 앱 설정 확인
`/Users/joowon/Documents/New project/inventory-app/user-config.js`

- `supabase.enabled: true`
- `projectUrl`: Supabase URL
- `anonKey`: publishable/anon key
- `stateTable`: `inventory_state`
- `stateRowId`: `4danji-main`

## 3) 앱 반영
- 웹: `npm run build:web`
- iOS: `npm run cap:sync` 후 Xcode 재실행

## 4) 동작 방식
- 입출고/현재고/바코드 상태는 Supabase에 저장되어 폰/PC에서 24시간 공유
- 회사 엑셀 내보내기는 기존처럼 맥 로컬 서버(`npm run dev:web`)에서 실행
- 내보내기 시점에 앱의 최신 출고기록을 사용

## 5) 참고
- `anon` 키는 앱에 들어가는 공개 키라 노출 가능하지만, 데이터 보호는 RLS 정책으로 제어됨
