

# Plan: Generate "Living Book" knowledge document

I will create a comprehensive markdown document covering all 12 areas requested. This is a data/artifact generation task — I will write a script to output the document to `/mnt/documents/`.

## What will be produced

A single markdown file `Living_Book_Stakerpol.md` saved to `/mnt/documents/` containing the complete structured knowledge document based on all the codebase analysis I've performed.

## Key findings to include

**Routes:** `/` (home), `/products` (listing), `/products/:id` (detail), `/testimonials`, `/contact`, `/faq`, `/admin` (protected), `*` (404)

**Tech:** React 18 + Vite 5 + Tailwind v3 + TypeScript + Supabase (DB, Auth, Edge Functions, Realtime, Storage)

**Auth:** Supabase email/password, `user_roles` table with `app_role` enum (admin/moderator/user), `has_role()` security definer function

**Database:** 13 tables including products (29 rows), price_inquiries, faqs, product_images, product_translations, orders, etc.

**Edge Functions:** 7 functions (notify-lead, auto-translate, geo-feed, migrate-images, schedule-translations, sitemap, translation-worker)

**State:** React Context (language), Zustand (productStore with persist), React Query (server state)

**Email:** Resend via notify-lead edge function, currently using `onboarding@resend.dev` sender (domain not verified)

**Languages:** PL, EN, DE, CS, SK — modular translation files + DeepL API integration

**Integrations:** Supabase, Resend, DeepL, GA4, Elfsight (Google Reviews widget)

**No TODO/FIXME/HACK comments found.** Some `console.log` statements present in admin code.

## Steps
1. Write the complete markdown document to `/mnt/documents/Living_Book_Stakerpol.md`
2. No UI changes needed — pure artifact generation

