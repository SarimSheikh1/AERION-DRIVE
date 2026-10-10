import { z } from "zod";
const text = (min, max) => z.string().trim().min(min).max(max);
const safeUrl = z
  .string()
  .max(500)
  .refine(
    (value) => value.startsWith("/images/") || /^https:\/\//.test(value),
    "Use a local /images/ path or HTTPS URL",
  );
export const mediaSchema = z.object({
  url: safeUrl,
  alt: text(3, 180),
  category: text(2, 40),
});
export const vehicleSchema = z.object({
  id: text(1, 80),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
  name: text(2, 80),
  category: text(2, 80),
  description: text(10, 3000),
  tagline: text(2, 150),
  price: z.number().nonnegative(),
  range: z.number().nonnegative(),
  topSpeed: z.number().positive(),
  acceleration: z.number().positive(),
  power: z.number().positive(),
  battery: z.number().positive(),
  seats: z.number().int().min(1).max(9),
  drivetrain: text(2, 40),
  colors: z
    .array(
      z.object({
        name: text(2, 50),
        hex: z.string().regex(/^#[a-fA-F0-9]{6}$/),
      }),
    )
    .min(1)
    .max(12),
  wheels: z
    .array(z.object({ id: text(1, 40), name: text(2, 50) }))
    .min(1)
    .max(8),
  media: z.array(mediaSchema).max(20),
  featured: z.boolean(),
  published: z.boolean(),
});
const person = {
  name: text(2, 100),
  email: z
    .email()
    .max(180)
    .transform((s) => s.toLowerCase()),
  message: z.string().trim().max(3000).default(""),
};
export const contactSchema = z.object({
  ...person,
  department: z.enum(["General", "Sales", "Design", "Press", "Support"]),
  message: text(10, 3000),
});
export const testDriveSchema = z.object({
  ...person,
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s()-]{7,25}$/),
  vehicle: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (s) =>
        !Number.isNaN(Date.parse(s)) &&
        new Date(s).toISOString().slice(0, 10) === s &&
        s >= new Date().toISOString().slice(0, 10),
      "Choose a valid future date",
    ),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  location: text(2, 100),
});
export const statusSchema = z.object({
  status: z.enum(["new", "reviewing", "contacted", "closed"]),
});
