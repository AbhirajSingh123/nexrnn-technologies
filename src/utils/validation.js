import { z } from 'zod';

const consentField = z.literal(true, {
  errorMap: () => ({ message: 'Please accept the Terms of Service and Privacy Policy to continue' }),
});

export const leadFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Enter a valid email'),
  service: z.string().min(1, 'Select a service'),
  message: z.string().max(600, 'Keep it under 600 characters').optional().or(z.literal('')),
  consent: consentField,
});

export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Enter a valid email'),
  service: z.string().min(1, 'Select a service'),
  message: z.string().min(5, 'Please add a short message'),
  consent: consentField,
});

export const serviceLeadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().optional().or(z.literal('')),
  city: z.string().min(2, 'City is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Enter a valid email'),
  message: z.string().optional().or(z.literal('')),
  consent: consentField,
});

export const courseEnrollSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  email: z.string().email('Enter a valid email'),
  college: z.string().optional().or(z.literal('')),
  paymentRefNo: z.string().optional().or(z.literal('')),
  consent: consentField,
});
