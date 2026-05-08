-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES DE ESCALAS
-- =====================================================

CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (
        type IN (
            'schedule_created',
            'schedule_updated',
            'schedule_published',
            'schedule_deleted',
            'schedule_assigned',
            'info'
        )
    ),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    schedule_id UUID REFERENCES schedules(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_notification_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES app_notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_notification_recipient UNIQUE (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_created_at
    ON app_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notifications_schedule
    ON app_notifications(schedule_id);

CREATE INDEX IF NOT EXISTS idx_app_notifications_team
    ON app_notifications(team_id);

CREATE INDEX IF NOT EXISTS idx_app_notification_recipients_user
    ON app_notification_recipients(user_id, dismissed_at, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notification_recipients_notification
    ON app_notification_recipients(notification_id);

ALTER TABLE app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_notification_recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem notificações destinadas a eles" ON app_notifications;
CREATE POLICY "Usuários veem notificações destinadas a eles"
    ON app_notifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM app_notification_recipients anr
            JOIN users_profile up ON up.id = anr.user_id
            WHERE anr.notification_id = app_notifications.id
              AND up.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuários autenticados criam notificações" ON app_notifications;
CREATE POLICY "Usuários autenticados criam notificações"
    ON app_notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários veem seus recebimentos" ON app_notification_recipients;
CREATE POLICY "Usuários veem seus recebimentos"
    ON app_notification_recipients FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM users_profile up
            WHERE up.id = app_notification_recipients.user_id
              AND up.auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuários autenticados criam recebimentos" ON app_notification_recipients;
CREATE POLICY "Usuários autenticados criam recebimentos"
    ON app_notification_recipients FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários atualizam seus recebimentos" ON app_notification_recipients;
CREATE POLICY "Usuários atualizam seus recebimentos"
    ON app_notification_recipients FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM users_profile up
            WHERE up.id = app_notification_recipients.user_id
              AND up.auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM users_profile up
            WHERE up.id = app_notification_recipients.user_id
              AND up.auth_user_id = auth.uid()
        )
    );
