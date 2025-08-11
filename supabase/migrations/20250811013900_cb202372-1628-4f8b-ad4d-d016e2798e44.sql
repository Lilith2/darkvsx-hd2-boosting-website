-- Remove the auto-confirm trigger that's causing automatic email verification
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.auto_confirm_user();