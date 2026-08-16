import { z } from 'zod';

export const leadFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Enter a valid email'),
  service: z.string().min(1, 'Select a service'),
  message: z.string().max(600, 'Keep it under 600 characters').optional().or(z.literal('')),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Enter a valid email'),
  service: z.string().min(1, 'Select a service'),
  message: z.string().min(5, 'Please add a short message'),
});
