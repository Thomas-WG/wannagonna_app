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

// Time commitment schema
const timeCommitmentSchema = z
  .object({
    daily: z.boolean(),
    weekly: z.boolean(),
    biweekly: z.boolean(),
    monthly: z.boolean(),
    occasional: z.boolean(),
    flexible: z.boolean(),
  })
  .refine(
    (obj) => {
      return Object.values(obj).some((val) => val === true);
    },
    {
      message: 'Please select at least one time commitment option',
    }
  );

// Availabilities schema
const availabilitiesSchema = z
  .object({
    weekdays: z.boolean(),
    weekends: z.boolean(),
    mornings: z.boolean(),
    afternoons: z.boolean(),
    evenings: z.boolean(),
    flexible: z.boolean(),
  })
  .refine(
    (obj) => {
      return Object.values(obj).some((val) => val === true);
    },
    {
      message: 'Please select at least one availability option',
    }
  );

// Main profile schema
export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be less than 100 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  bio: z
    .string()
    .min(1, 'Bio is required')
    .min(10, 'Bio must be at least 10 characters')
    .max(1000, 'Bio must be less than 1000 characters'),
  cause: z
    .string()
    .min(1, 'Cause is required')
    .min(10, 'Cause must be at least 10 characters')
    .max(500, 'Cause must be less than 500 characters'),
  hobbies: z
    .string()
    .min(1, 'Hobbies is required')
    .min(10, 'Hobbies must be at least 10 characters')
    .max(500, 'Hobbies must be less than 500 characters'),
  website: urlSchema,
  linkedin: urlSchema,
  facebook: urlSchema,
  instagram: urlSchema,
  country: z.string().min(1, 'Country is required'),
  languages: z
    .array(languageOptionSchema)
    .min(1, 'Please select at least one language'),
  skills: z.array(skillOptionSchema).optional().default([]),
  profilePicture: z.string().min(1, 'Profile picture is required'),
  timeCommitment: timeCommitmentSchema,
  availabilities: availabilitiesSchema,
});

