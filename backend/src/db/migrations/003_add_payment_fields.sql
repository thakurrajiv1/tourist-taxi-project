-- Migration 003: add payment gateway fields to bookings for Module 4

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS advance_amount DECIMAL(10,2);
