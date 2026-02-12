-- Migration: Add court_registration column to leads table
-- Stores the commercial register entry (spisová značka) from ARES VR API
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/empndmpeyrdycjdesoxr/sql/new

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS court_registration TEXT DEFAULT NULL;
