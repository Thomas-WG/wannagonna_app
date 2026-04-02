import { z } from 'zod';
import { normalizeUrl } from '@/utils/urlUtils';

// Custom URL validation that normalizes the URL
const urlSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true; // Empty is valid (optional)
      const normalized = normalizeUrl(val);
      // Basic URL validation - check if it looks like a valid URL after normalization
      try {
        new URL(normalized);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'Please enter a valid URL',
    }
  )
  .transform((val) => {
    if (!val || val.trim() === '') return '';
    return normalizeUrl(val);
  });

// Language option schema (from react-select)
const languageOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

// Skill option schema (from react-select)
const skillOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

/** Empty or whitespace-only is valid; otherwise content must be at least `min` chars (after trim). */
const optionalStringMinWhenFilled = (min, max, { maxMessage, minMessage }) =>
  z
    .string()
    .max(max, maxMessage)
    .refine((val) => val.trim() === '' || val.trim().length >= min, {
      message: minMessage,
    });

// Time commitment — all booleans; no "at least one" rule so users can save partial progress
const time_commitment_schema = z.object({
  daily: z.boolean(),
  weekly: z.boolean(),
  biweekly: z.boolean(),
  monthly: z.boolean(),
  occasional: z.boolean(),
  flexible: z.boolean(),
});

// Availabilities — same as time_commitment
const availabilitiesSchema = z.object({
  weekdays: z.boolean(),
  weekends: z.boolean(),
  mornings: z.boolean(),
  afternoons: z.boolean(),
  evenings: z.boolean(),
  flexible: z.boolean(),
});

// Main profile schema — permissive save; "complete profile" / badge uses isProfileComplete in profileHelpers
export const profileSchema = z.object({
  display_name: z
    .string()
    .max(100, 'Display name must be less than 100 characters')
    .refine((val) => val.trim().length >= 1, {
      message: 'Display name is required',
    })
    .refine((val) => val.trim().length >= 2, {
      message: 'Display name must be at least 2 characters',
    }),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  bio: optionalStringMinWhenFilled(10, 1000, {
    maxMessage: 'Bio must be less than 1000 characters',
    minMessage: 'Bio must be at least 10 characters',
  }),
  cause: optionalStringMinWhenFilled(10, 500, {
    maxMessage: 'Cause must be less than 500 characters',
    minMessage: 'Cause must be at least 10 characters',
  }),
  hobbies: optionalStringMinWhenFilled(10, 500, {
    maxMessage: 'Hobbies must be less than 500 characters',
    minMessage: 'Hobbies must be at least 10 characters',
  }),
  website: urlSchema,
  linkedin: urlSchema,
  facebook: urlSchema,
  instagram: urlSchema,
  country: z.string(),
  languages: z.array(languageOptionSchema).default([]),
  skills: z.array(skillOptionSchema).optional().default([]),
  profile_picture: z.string(),
  time_commitment: time_commitment_schema,
  availabilities: availabilitiesSchema,
});

