-- ============================================================================
-- SIFTO PRODUCTION DATABASE SCHEMA (PostgreSQL / Supabase)
-- Run this script in your Supabase SQL Editor to create your tables
-- ============================================================================

-- 1. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_code TEXT UNIQUE NOT NULL,
  otp TEXT NOT NULL,
  customer_name TEXT DEFAULT 'Sifto',
  service_name TEXT NOT NULL,
  frequency TEXT DEFAULT 'One-Time',
  hours INTEGER NOT NULL DEFAULT 1,
  total_inr INTEGER NOT NULL,
  discount_inr INTEGER DEFAULT 0,
  assigned_pro TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  address TEXT NOT NULL,
  slot_label TEXT NOT NULL,
  note TEXT DEFAULT '',
  stage INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Custom Chores Table
CREATE TABLE IF NOT EXISTS public.custom_chores (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT '🪴',
  name TEXT NOT NULL,
  price_per_hour INTEGER NOT NULL DEFAULT 159,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Saved Addresses Table
CREATE TABLE IF NOT EXISTS public.saved_addresses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label TEXT NOT NULL,
  full_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row-Level Security (RLS) with starter policy for testing
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read and insert for demo"
  ON public.bookings FOR ALL
  USING (true)
  WITH CHECK (true);
