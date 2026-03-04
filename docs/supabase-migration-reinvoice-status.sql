-- Migration: Add client reinvoice tracking to extra_works
-- Run this in Supabase SQL Editor

CREATE TYPE client_reinvoice_status AS ENUM ('expected', 'reinvoiced', 'not_expected');

ALTER TABLE extra_works 
  ADD COLUMN client_reinvoice_status client_reinvoice_status DEFAULT 'expected',
  ADD COLUMN client_invoice_note text;
