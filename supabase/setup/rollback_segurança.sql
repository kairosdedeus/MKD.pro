-- =====================================================
-- ROLLBACK DE SEGURANÇA PARA SUPABASE MKD.pro
-- =====================================================
-- Use este script se algo quebrar depois de aplicar
-- seguranca_producao.sql.
--
-- Objetivo: reverter as políticas e liberar o acesso de forma
-- segura para recuperar o ambiente sem perder o schema.
--
-- ATENÇÃO:
-- - Esse rollback não apaga tabelas.
-- - Só remove políticas e desativa RLS.
-- - Use apenas em emergência ou para restaurar funcionamento.
-- =====================================================

-- 1) Remover políticas do schema principal
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manage_gerencial" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_gerencial" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_gerencial" ON public.profiles;

DROP POLICY IF EXISTS "users_profile_select_own_or_gerencial" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_insert_own" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_update_own_or_gerencial" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_delete_gerencial" ON public.users_profile;

DROP POLICY IF EXISTS "user_profiles_select_authenticated" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_manage_gerencial" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_gerencial" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_gerencial" ON public.user_profiles;

DROP POLICY IF EXISTS "team_types_select_authenticated" ON public.team_types;
DROP POLICY IF EXISTS "team_types_insert_gerencial" ON public.team_types;
DROP POLICY IF EXISTS "team_types_update_gerencial" ON public.team_types;
DROP POLICY IF EXISTS "team_types_delete_gerencial" ON public.team_types;

DROP POLICY IF EXISTS "teams_select_authenticated_access" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_gerencial" ON public.teams;
DROP POLICY IF EXISTS "teams_update_gerencial_or_leader" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_gerencial" ON public.teams;

DROP POLICY IF EXISTS "team_members_select_access" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_gerencial_or_leader" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_gerencial_or_leader" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_gerencial_or_leader" ON public.team_members;

DROP POLICY IF EXISTS "team_functions_select_authenticated" ON public.team_functions;
DROP POLICY IF EXISTS "team_functions_insert_gerencial" ON public.team_functions;
DROP POLICY IF EXISTS "team_functions_update_gerencial" ON public.team_functions;
DROP POLICY IF EXISTS "team_functions_delete_gerencial" ON public.team_functions;

DROP POLICY IF EXISTS "team_member_functions_select_access" ON public.team_member_functions;
DROP POLICY IF EXISTS "team_member_functions_manage_gerencial_or_leader" ON public.team_member_functions;
DROP POLICY IF EXISTS "team_member_functions_update_gerencial_or_leader" ON public.team_member_functions;
DROP POLICY IF EXISTS "team_member_functions_delete_gerencial_or_leader" ON public.team_member_functions;

DROP POLICY IF EXISTS "schedules_select_access" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert_gerencial_or_leader" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update_gerencial_or_leader" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete_gerencial_or_leader" ON public.schedules;

DROP POLICY IF EXISTS "schedule_members_select_access" ON public.schedule_members;
DROP POLICY IF EXISTS "schedule_members_manage_gerencial_or_leader" ON public.schedule_members;
DROP POLICY IF EXISTS "schedule_members_update_gerencial_or_leader" ON public.schedule_members;
DROP POLICY IF EXISTS "schedule_members_delete_gerencial_or_leader" ON public.schedule_members;

DROP POLICY IF EXISTS "schedule_member_functions_select_access" ON public.schedule_member_functions;
DROP POLICY IF EXISTS "schedule_member_functions_manage_gerencial_or_leader" ON public.schedule_member_functions;
DROP POLICY IF EXISTS "schedule_member_functions_update_gerencial_or_leader" ON public.schedule_member_functions;
DROP POLICY IF EXISTS "schedule_member_functions_delete_gerencial_or_leader" ON public.schedule_member_functions;

DROP POLICY IF EXISTS "songs_select_authenticated" ON public.songs;
DROP POLICY IF EXISTS "songs_insert_gerencial" ON public.songs;
DROP POLICY IF EXISTS "songs_update_gerencial" ON public.songs;
DROP POLICY IF EXISTS "songs_delete_gerencial" ON public.songs;

DROP POLICY IF EXISTS "schedule_songs_select_access" ON public.schedule_songs;
DROP POLICY IF EXISTS "schedule_songs_manage_gerencial_or_leader" ON public.schedule_songs;
DROP POLICY IF EXISTS "schedule_songs_update_gerencial_or_leader" ON public.schedule_songs;
DROP POLICY IF EXISTS "schedule_songs_delete_gerencial_or_leader" ON public.schedule_songs;

DROP POLICY IF EXISTS "cells_select_access" ON public.cells;
DROP POLICY IF EXISTS "cells_manage_gerencial_or_leader" ON public.cells;
DROP POLICY IF EXISTS "cells_update_gerencial_or_leader" ON public.cells;
DROP POLICY IF EXISTS "cells_delete_gerencial" ON public.cells;

DROP POLICY IF EXISTS "cell_members_select_access" ON public.cell_members;
DROP POLICY IF EXISTS "cell_members_manage_gerencial_or_leader" ON public.cell_members;
DROP POLICY IF EXISTS "cell_members_update_gerencial_or_leader" ON public.cell_members;
DROP POLICY IF EXISTS "cell_members_delete_gerencial_or_leader" ON public.cell_members;

DROP POLICY IF EXISTS "cell_meetings_select_access" ON public.cell_meetings;
DROP POLICY IF EXISTS "cell_meetings_manage_gerencial_or_leader" ON public.cell_meetings;
DROP POLICY IF EXISTS "cell_meetings_update_gerencial_or_leader" ON public.cell_meetings;
DROP POLICY IF EXISTS "cell_meetings_delete_gerencial" ON public.cell_meetings;

DROP POLICY IF EXISTS "cell_attendance_select_access" ON public.cell_attendance;
DROP POLICY IF EXISTS "cell_attendance_manage_gerencial_or_leader" ON public.cell_attendance;
DROP POLICY IF EXISTS "cell_attendance_update_gerencial_or_leader" ON public.cell_attendance;
DROP POLICY IF EXISTS "cell_attendance_delete_gerencial_or_leader" ON public.cell_attendance;

DROP POLICY IF EXISTS "app_notifications_select_access" ON public.app_notifications;
DROP POLICY IF EXISTS "app_notifications_insert_gerencial" ON public.app_notifications;
DROP POLICY IF EXISTS "app_notifications_update_own_or_gerencial" ON public.app_notifications;

DROP POLICY IF EXISTS "app_notification_recipients_select_own_or_gerencial" ON public.app_notification_recipients;
DROP POLICY IF EXISTS "app_notification_recipients_insert_gerencial" ON public.app_notification_recipients;
DROP POLICY IF EXISTS "app_notification_recipients_update_own_or_gerencial" ON public.app_notification_recipients;

-- 2) Desabilitar RLS das tabelas principais em caso de emergência
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_member_functions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_fixed_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_fixed_team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_songs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cells DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notification_recipients DISABLE ROW LEVEL SECURITY;

-- 3) Reabrir acesso amplo temporariamente em emergência
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4) Reverter funções de segurança auxiliares se necessário
DROP FUNCTION IF EXISTS public.is_gerencial_user();
DROP FUNCTION IF EXISTS public.user_has_team_access(UUID);
DROP FUNCTION IF EXISTS public.user_is_team_leader(UUID);

SELECT '⚠️ Rollback executado: RLS desativado e acesso temporariamente liberado para recuperar o sistema.' AS status;
