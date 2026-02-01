-- Enable Row Level Security (RLS) on all app tables.
-- Apply this in Supabase SQL Editor.

alter table "User" enable row level security;
alter table "Account" enable row level security;
alter table "Session" enable row level security;
alter table "VerificationToken" enable row level security;
alter table "Conversation" enable row level security;
alter table "Message" enable row level security;
alter table "CreditBalance" enable row level security;
alter table "CreditTransaction" enable row level security;
alter table "Project" enable row level security;
alter table "ProjectBuildStep" enable row level security;

-- No policies are defined intentionally.
-- This blocks direct access from Supabase client keys and forces all access
-- through the server API (Prisma + service role / DB connection).

-- If you later want direct client access, add policies that map auth.uid()
-- to your user model (e.g., by storing the Supabase user id on each row).
