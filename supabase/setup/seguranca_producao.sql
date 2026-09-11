-- =====================================================
-- SEGURANÇA DE PRODUÇÃO PARA SUPABASE - MKD.pro
-- =====================================================
-- Objetivo: remover permissões abertas do plano gratuito e
-- ativar RLS com políticas mínimas e funcionais.
--
-- IMPORTANTE:
-- - Este arquivo NÃO deve ser usado em ambiente de desenvolvimento
--   com acesso amplo como "permissoes-dev.sql".
-- - Execute em produção apenas após revisar as políticas.
-- - O frontend deve usar apenas a anon key; a service_role deve
--   permanecer no backend/edge functions.
-- =====================================================

-- 1) Remover grants abertos que deixam o banco livre
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;

-- 2) Funções auxiliares de autorização
CREATE OR REPLACE FUNCTION public.is_gerencial_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users_profile up
    JOIN public.user_profiles upf ON upf.user_id = up.id
    JOIN public.profiles p ON p.id = upf.profile_id
    WHERE up.auth_user_id = auth.uid()
      AND up.ativo = true
      AND p.codigo = 'gerencial'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_team_access(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT (
    EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.users_profile up ON up.id = tm.user_id
      WHERE tm.team_id = p_team_id
        AND up.auth_user_id = auth.uid()
        AND tm.ativo = true
    )
    OR public.is_gerencial_user()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_team_leader(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT (
    EXISTS (
      SELECT 1
      FROM public.teams t
      JOIN public.users_profile up ON up.id = t.leader_id
      WHERE t.id = p_team_id
        AND up.auth_user_id = auth.uid()
    )
    OR public.is_gerencial_user()
  );
$$;

-- 3) Ativar RLS em tabelas principais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_member_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_member_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_fixed_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worship_fixed_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cell_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notification_recipients ENABLE ROW LEVEL SECURITY;

-- 4) Políticas para profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_manage_gerencial" ON public.profiles;

CREATE POLICY "profiles_select_authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_manage_gerencial"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "profiles_update_gerencial"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_gerencial_user())
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "profiles_delete_gerencial"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 5) Políticas para users_profile
DROP POLICY IF EXISTS "users_profile_select_own_or_gerencial" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_insert_own" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_update_own_or_gerencial" ON public.users_profile;
DROP POLICY IF EXISTS "users_profile_delete_gerencial" ON public.users_profile;

CREATE POLICY "users_profile_select_own_or_gerencial"
ON public.users_profile
FOR SELECT
TO authenticated
USING (
  auth_user_id = auth.uid() OR public.is_gerencial_user()
);

CREATE POLICY "users_profile_insert_own"
ON public.users_profile
FOR INSERT
TO authenticated
WITH CHECK (
  auth_user_id = auth.uid()
  AND email IS NOT NULL
  AND nome IS NOT NULL
);

CREATE POLICY "users_profile_update_own_or_gerencial"
ON public.users_profile
FOR UPDATE
TO authenticated
USING (
  auth_user_id = auth.uid() OR public.is_gerencial_user()
)
WITH CHECK (
  auth_user_id = auth.uid() OR public.is_gerencial_user()
);

CREATE POLICY "users_profile_delete_gerencial"
ON public.users_profile
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 6) Políticas para user_profiles
DROP POLICY IF EXISTS "user_profiles_select_authenticated" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_manage_gerencial" ON public.user_profiles;

CREATE POLICY "user_profiles_select_authenticated"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "user_profiles_manage_gerencial"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "user_profiles_update_gerencial"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (public.is_gerencial_user())
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "user_profiles_delete_gerencial"
ON public.user_profiles
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 7) Políticas para team_types
DROP POLICY IF EXISTS "team_types_select_authenticated" ON public.team_types;
DROP POLICY IF EXISTS "team_types_manage_gerencial" ON public.team_types;

CREATE POLICY "team_types_select_authenticated"
ON public.team_types
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "team_types_insert_gerencial"
ON public.team_types
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "team_types_update_gerencial"
ON public.team_types
FOR UPDATE
TO authenticated
USING (public.is_gerencial_user())
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "team_types_delete_gerencial"
ON public.team_types
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 8) Políticas para teams
DROP POLICY IF EXISTS "teams_select_authenticated_access" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_gerencial" ON public.teams;
DROP POLICY IF EXISTS "teams_update_gerencial_or_leader" ON public.teams;
DROP POLICY IF EXISTS "teams_delete_gerencial" ON public.teams;

CREATE POLICY "teams_select_authenticated_access"
ON public.teams
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR public.user_has_team_access(id)
  OR leader_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "teams_insert_gerencial"
ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "teams_update_gerencial_or_leader"
ON public.teams
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user() OR public.user_is_team_leader(id)
)
WITH CHECK (
  public.is_gerencial_user() OR public.user_is_team_leader(id)
);

CREATE POLICY "teams_delete_gerencial"
ON public.teams
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 9) Políticas para team_members
DROP POLICY IF EXISTS "team_members_select_access" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert_gerencial_or_leader" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_gerencial_or_leader" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete_gerencial_or_leader" ON public.team_members;

CREATE POLICY "team_members_select_access"
ON public.team_members
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR public.user_has_team_access(team_id)
  OR user_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "team_members_insert_gerencial_or_leader"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gerencial_user() OR public.user_is_team_leader(team_id)
);

CREATE POLICY "team_members_update_gerencial_or_leader"
ON public.team_members
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user() OR public.user_is_team_leader(team_id)
)
WITH CHECK (
  public.is_gerencial_user() OR public.user_is_team_leader(team_id)
);

CREATE POLICY "team_members_delete_gerencial_or_leader"
ON public.team_members
FOR DELETE
TO authenticated
USING (
  public.is_gerencial_user() OR public.user_is_team_leader(team_id)
);

-- 10) Políticas para team_functions
DROP POLICY IF EXISTS "team_functions_select_authenticated" ON public.team_functions;
DROP POLICY IF EXISTS "team_functions_manage_gerencial" ON public.team_functions;

CREATE POLICY "team_functions_select_authenticated"
ON public.team_functions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "team_functions_insert_gerencial"
ON public.team_functions
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "team_functions_update_gerencial"
ON public.team_functions
FOR UPDATE
TO authenticated
USING (public.is_gerencial_user())
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "team_functions_delete_gerencial"
ON public.team_functions
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 11) Políticas para team_member_functions
DROP POLICY IF EXISTS "team_member_functions_select_access" ON public.team_member_functions;
DROP POLICY IF EXISTS "team_member_functions_manage_gerencial_or_leader" ON public.team_member_functions;

CREATE POLICY "team_member_functions_select_access"
ON public.team_member_functions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.users_profile up ON up.id = tm.user_id
    WHERE tm.id = team_member_id
      AND (up.auth_user_id = auth.uid() OR public.is_gerencial_user())
  )
);

CREATE POLICY "team_member_functions_manage_gerencial_or_leader"
ON public.team_member_functions
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    JOIN public.users_profile up ON up.id = t.leader_id
    WHERE tm.id = team_member_id
      AND up.auth_user_id = auth.uid()
  )
);

CREATE POLICY "team_member_functions_update_gerencial_or_leader"
ON public.team_member_functions
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    JOIN public.users_profile up ON up.id = t.leader_id
    WHERE tm.id = team_member_id
      AND up.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    JOIN public.users_profile up ON up.id = t.leader_id
    WHERE tm.id = team_member_id
      AND up.auth_user_id = auth.uid()
  )
);

CREATE POLICY "team_member_functions_delete_gerencial_or_leader"
ON public.team_member_functions
FOR DELETE
TO authenticated
USING (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    JOIN public.teams t ON t.id = tm.team_id
    JOIN public.users_profile up ON up.id = t.leader_id
    WHERE tm.id = team_member_id
      AND up.auth_user_id = auth.uid()
  )
);

-- 12) Políticas para schedules
DROP POLICY IF EXISTS "schedules_select_access" ON public.schedules;
DROP POLICY IF EXISTS "schedules_insert_gerencial_or_leader" ON public.schedules;
DROP POLICY IF EXISTS "schedules_update_gerencial_or_leader" ON public.schedules;
DROP POLICY IF EXISTS "schedules_delete_gerencial_or_leader" ON public.schedules;

CREATE POLICY "schedules_select_access"
ON public.schedules
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR public.user_has_team_access(team_id)
);

CREATE POLICY "schedules_insert_gerencial_or_leader"
ON public.schedules
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gerencial_user() OR public.user_is_team_leader(team_id)
);

CREATE POLICY "schedules_update_gerencial_or_leader"
ON public.schedules
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user() OR public.user_is_team_leader(team_id)
)
WITH CHECK (
  public.is_gerencial_user() OR public.user_is_team_leader(team_id)
);

CREATE POLICY "schedules_delete_gerencial_or_leader"
ON public.schedules
FOR DELETE
TO authenticated
USING (
  public.is_gerencial_user() OR public.user_is_team_leader(team_id)
);

-- 13) Políticas para schedule_members
DROP POLICY IF EXISTS "schedule_members_select_access" ON public.schedule_members;
DROP POLICY IF EXISTS "schedule_members_manage_gerencial_or_leader" ON public.schedule_members;

CREATE POLICY "schedule_members_select_access"
ON public.schedule_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_has_team_access(s.team_id))
  )
);

CREATE POLICY "schedule_members_manage_gerencial_or_leader"
ON public.schedule_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

CREATE POLICY "schedule_members_update_gerencial_or_leader"
ON public.schedule_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

CREATE POLICY "schedule_members_delete_gerencial_or_leader"
ON public.schedule_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

-- 14) Políticas para schedule_member_functions
DROP POLICY IF EXISTS "schedule_member_functions_select_access" ON public.schedule_member_functions;
DROP POLICY IF EXISTS "schedule_member_functions_manage_gerencial_or_leader" ON public.schedule_member_functions;

CREATE POLICY "schedule_member_functions_select_access"
ON public.schedule_member_functions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedule_members sm
    JOIN public.schedules s ON s.id = sm.schedule_id
    WHERE sm.id = schedule_member_id
      AND (public.is_gerencial_user() OR public.user_has_team_access(s.team_id))
  )
);

CREATE POLICY "schedule_member_functions_manage_gerencial_or_leader"
ON public.schedule_member_functions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.schedule_members sm
    JOIN public.schedules s ON s.id = sm.schedule_id
    WHERE sm.id = schedule_member_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

CREATE POLICY "schedule_member_functions_update_gerencial_or_leader"
ON public.schedule_member_functions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedule_members sm
    JOIN public.schedules s ON s.id = sm.schedule_id
    WHERE sm.id = schedule_member_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.schedule_members sm
    JOIN public.schedules s ON s.id = sm.schedule_id
    WHERE sm.id = schedule_member_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

CREATE POLICY "schedule_member_functions_delete_gerencial_or_leader"
ON public.schedule_member_functions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedule_members sm
    JOIN public.schedules s ON s.id = sm.schedule_id
    WHERE sm.id = schedule_member_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

-- 15) Políticas para songs
DROP POLICY IF EXISTS "songs_select_authenticated" ON public.songs;
DROP POLICY IF EXISTS "songs_manage_gerencial" ON public.songs;

CREATE POLICY "songs_select_authenticated"
ON public.songs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "songs_insert_gerencial"
ON public.songs
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "songs_update_gerencial"
ON public.songs
FOR UPDATE
TO authenticated
USING (public.is_gerencial_user())
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "songs_delete_gerencial"
ON public.songs
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 16) Políticas para schedule_songs
DROP POLICY IF EXISTS "schedule_songs_select_access" ON public.schedule_songs;
DROP POLICY IF EXISTS "schedule_songs_manage_gerencial_or_leader" ON public.schedule_songs;

CREATE POLICY "schedule_songs_select_access"
ON public.schedule_songs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_has_team_access(s.team_id))
  )
);

CREATE POLICY "schedule_songs_manage_gerencial_or_leader"
ON public.schedule_songs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

CREATE POLICY "schedule_songs_update_gerencial_or_leader"
ON public.schedule_songs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

CREATE POLICY "schedule_songs_delete_gerencial_or_leader"
ON public.schedule_songs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.schedules s
    WHERE s.id = schedule_id
      AND (public.is_gerencial_user() OR public.user_is_team_leader(s.team_id))
  )
);

-- 17) Políticas para cells
DROP POLICY IF EXISTS "cells_select_access" ON public.cells;
DROP POLICY IF EXISTS "cells_manage_gerencial_or_leader" ON public.cells;

CREATE POLICY "cells_select_access"
ON public.cells
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR leader_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.cell_members cm
    JOIN public.users_profile up ON up.id = cm.user_id
    WHERE cm.cell_id = public.cells.id
      AND up.auth_user_id = auth.uid()
  )
);

CREATE POLICY "cells_manage_gerencial_or_leader"
ON public.cells
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gerencial_user()
  OR leader_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "cells_update_gerencial_or_leader"
ON public.cells
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user()
  OR leader_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  public.is_gerencial_user()
  OR leader_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "cells_delete_gerencial"
ON public.cells
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 18) Políticas para cell_members
DROP POLICY IF EXISTS "cell_members_select_access" ON public.cell_members;
DROP POLICY IF EXISTS "cell_members_manage_gerencial_or_leader" ON public.cell_members;

CREATE POLICY "cell_members_select_access"
ON public.cell_members
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.cells c
    WHERE c.id = cell_id
      AND (
        c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.cell_members cm2
          JOIN public.users_profile up ON up.id = cm2.user_id
          WHERE cm2.cell_id = c.id
            AND up.auth_user_id = auth.uid()
        )
      )
  )
);

CREATE POLICY "cell_members_manage_gerencial_or_leader"
ON public.cell_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.cells c
    WHERE c.id = cell_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "cell_members_update_gerencial_or_leader"
ON public.cell_members
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.cells c
    WHERE c.id = cell_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
)
WITH CHECK (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.cells c
    WHERE c.id = cell_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "cell_members_delete_gerencial_or_leader"
ON public.cell_members
FOR DELETE
TO authenticated
USING (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.cells c
    WHERE c.id = cell_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

-- 19) Políticas para cell_meetings
DROP POLICY IF EXISTS "cell_meetings_select_access" ON public.cell_meetings;
DROP POLICY IF EXISTS "cell_meetings_manage_gerencial_or_leader" ON public.cell_meetings;

CREATE POLICY "cell_meetings_select_access"
ON public.cell_meetings
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR cell_id IN (
    SELECT c.id
    FROM public.cells c
    WHERE c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM public.cell_members cm
    JOIN public.users_profile up ON up.id = cm.user_id
    WHERE cm.cell_id = cell_id
      AND up.auth_user_id = auth.uid()
  )
);

CREATE POLICY "cell_meetings_manage_gerencial_or_leader"
ON public.cell_meetings
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gerencial_user()
  OR cell_id IN (
    SELECT c.id
    FROM public.cells c
    WHERE c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "cell_meetings_update_gerencial_or_leader"
ON public.cell_meetings
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user()
  OR cell_id IN (
    SELECT c.id
    FROM public.cells c
    WHERE c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
)
WITH CHECK (
  public.is_gerencial_user()
  OR cell_id IN (
    SELECT c.id
    FROM public.cells c
    WHERE c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "cell_meetings_delete_gerencial"
ON public.cell_meetings
FOR DELETE
TO authenticated
USING (public.is_gerencial_user());

-- 20) Políticas para cell_attendance
DROP POLICY IF EXISTS "cell_attendance_select_access" ON public.cell_attendance;
DROP POLICY IF EXISTS "cell_attendance_manage_gerencial_or_leader" ON public.cell_attendance;

CREATE POLICY "cell_attendance_select_access"
ON public.cell_attendance
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR user_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.cell_meetings cm
    JOIN public.cells c ON c.id = cm.cell_id
    WHERE cm.id = cell_meeting_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "cell_attendance_manage_gerencial_or_leader"
ON public.cell_attendance
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_gerencial_user()
  OR user_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.cell_meetings cm
    JOIN public.cells c ON c.id = cm.cell_id
    WHERE cm.id = cell_meeting_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "cell_attendance_update_gerencial_or_leader"
ON public.cell_attendance
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user()
  OR user_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.cell_meetings cm
    JOIN public.cells c ON c.id = cm.cell_id
    WHERE cm.id = cell_meeting_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
)
WITH CHECK (
  public.is_gerencial_user()
  OR user_id IN (
    SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.cell_meetings cm
    JOIN public.cells c ON c.id = cm.cell_id
    WHERE cm.id = cell_meeting_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "cell_attendance_delete_gerencial_or_leader"
ON public.cell_attendance
FOR DELETE
TO authenticated
USING (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.cell_meetings cm
    JOIN public.cells c ON c.id = cm.cell_id
    WHERE cm.id = cell_meeting_id
      AND c.leader_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

-- 21) Políticas para notificações
DROP POLICY IF EXISTS "app_notifications_select_access" ON public.app_notifications;
DROP POLICY IF EXISTS "app_notifications_insert_gerencial" ON public.app_notifications;
DROP POLICY IF EXISTS "app_notifications_update_own_or_gerencial" ON public.app_notifications;

CREATE POLICY "app_notifications_select_access"
ON public.app_notifications
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR EXISTS (
    SELECT 1
    FROM public.app_notification_recipients anr
    WHERE anr.notification_id = public.app_notifications.id
      AND anr.user_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
  )
);

CREATE POLICY "app_notifications_insert_gerencial"
ON public.app_notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "app_notifications_update_own_or_gerencial"
ON public.app_notifications
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user()
  OR actor_user_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  public.is_gerencial_user()
  OR actor_user_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
);

-- 22) Políticas para destinatários de notificações
DROP POLICY IF EXISTS "app_notification_recipients_select_own_or_gerencial" ON public.app_notification_recipients;
DROP POLICY IF EXISTS "app_notification_recipients_insert_gerencial" ON public.app_notification_recipients;
DROP POLICY IF EXISTS "app_notification_recipients_update_own_or_gerencial" ON public.app_notification_recipients;

CREATE POLICY "app_notification_recipients_select_own_or_gerencial"
ON public.app_notification_recipients
FOR SELECT
TO authenticated
USING (
  public.is_gerencial_user()
  OR user_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
);

CREATE POLICY "app_notification_recipients_insert_gerencial"
ON public.app_notification_recipients
FOR INSERT
TO authenticated
WITH CHECK (public.is_gerencial_user());

CREATE POLICY "app_notification_recipients_update_own_or_gerencial"
ON public.app_notification_recipients
FOR UPDATE
TO authenticated
USING (
  public.is_gerencial_user()
  OR user_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
)
WITH CHECK (
  public.is_gerencial_user()
  OR user_id IN (SELECT id FROM public.users_profile WHERE auth_user_id = auth.uid())
);

-- 23) Regras finais de segurança
REVOKE ALL ON FUNCTION public.is_gerencial_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_has_team_access(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_is_team_leader(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_gerencial_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_team_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_team_leader(UUID) TO authenticated;

-- 24) Ajuste de segurança do PostgreSQL
ALTER TABLE public.users_profile
  ALTER COLUMN auth_user_id SET NOT NULL;

ALTER TABLE public.users_profile
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.users_profile
  ALTER COLUMN nome SET NOT NULL;

-- 25) Mensagem final
SELECT '✅ Segurança de produção aplicada: RLS habilitado e políticas restritivas configuradas.' AS status;
