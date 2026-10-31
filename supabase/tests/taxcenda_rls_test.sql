-- Regression tests for TaxCenda client-facing RLS and workflow guards.
-- Run against an ISOLATED LOCAL Supabase database after reconciling legacy
-- migration history: supabase test db
-- All test users and records are synthetic and rolled back.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET LOCAL search_path = public, extensions;
SELECT plan(10);

INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'authenticated', 'authenticated',
 'taxcenda-rls-owner@example.invalid', 'test-only-not-a-real-hash', now(), now(), now(), '{"full_name":"RLS owner"}'::jsonb),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'authenticated', 'authenticated',
 'taxcenda-rls-other@example.invalid', 'test-only-not-a-real-hash', now(), now(), now(), '{"full_name":"RLS other"}'::jsonb);

INSERT INTO public.tax_entities (id, owner_user_id, legal_name, entity_type)
VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Synthetic owner','individual'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb20','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','Synthetic other','individual');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
SET LOCAL request.jwt.claim.role = 'authenticated';
SET LOCAL request.jwt.claims = '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1","role":"authenticated"}';

SELECT results_eq(
  $$INSERT INTO public.tax_engagements
      (id, entity_id, user_id, tax_year, progress, current_step)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',2025,10,'Upload and confirm source records')
    RETURNING workflow_status$$,
  $$SELECT 'collecting'::text$$,
  'Owner can create their own collecting tax-year engagement'
);

SELECT throws_ok(
  $$INSERT INTO public.tax_engagements
      (entity_id,user_id,tax_year,workflow_status,progress)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',2024,'accepted',100)$$,
  'P0001', NULL,
  'Owner cannot forge an IRS-accepted engagement on insert'
);

SELECT throws_ok(
  $$INSERT INTO public.tax_engagements (entity_id,user_id,tax_year)
    VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb20',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',2024)$$,
  '42501', NULL, 'Owner cannot create an engagement for a different taxpayer'
);

SELECT results_eq(
  $$INSERT INTO public.income_expenses
      (id,user_id,entity_id,engagement_id,tax_year,type,category,amount,
       transaction_date,business_use_percentage,review_status,created_source)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
      2025,'expense','Software',25.00,'2025-05-01',0,'unreviewed','manual')
    RETURNING review_status$$,
  $$SELECT 'unreviewed'::text$$,
  'Owner can create an unreviewed entry linked to their tax year with 0 percent business use'
);

SELECT throws_ok(
  $$INSERT INTO public.income_expenses
      (user_id,tax_year,type,category,amount,transaction_date,review_status)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      2025,'expense','Unlinked',12.00,'2025-05-02','unreviewed')$$,
  '42501', NULL, 'Owner cannot bypass workflow gates using a null engagement'
);

SELECT throws_ok(
  $$INSERT INTO public.income_expenses
      (user_id,entity_id,engagement_id,tax_year,type,category,amount,transaction_date,review_status)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
      2025,'expense','Already approved',12.00,'2025-05-02','approved')$$,
  '42501', NULL, 'Owner cannot approve their own financial entry'
);

SELECT throws_ok(
  $$UPDATE public.income_expenses SET review_status='approved'
    WHERE id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12'$$,
  '42501', NULL, 'Owner cannot promote an unreviewed entry to approved'
);

SELECT throws_ok(
  $$INSERT INTO public.income_expenses
      (user_id,entity_id,engagement_id,tax_year,type,category,amount,transaction_date,review_status)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
      2024,'expense','Wrong tax year',12.00,'2024-05-02','unreviewed')$$,
  '42501', NULL, 'Owner cannot attach a different tax-year label to an engagement'
);

SELECT throws_ok(
  $$INSERT INTO public.fixed_assets
      (engagement_id,entity_id,user_id,description,placed_in_service_date,cost,status)
    VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'Synthetic laptop','2025-03-01',1000.00,'approved')$$,
  '42501', NULL, 'Owner cannot create a pre-approved asset treatment'
);

SELECT is_empty(
  $$SELECT id FROM public.tax_entities
    WHERE id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb20'$$,
  'Owner cannot read a different taxpayers tax entity'
);

SELECT * FROM finish();
ROLLBACK;
