-- Verificar tudo sobre equipes
SELECT 'EQUIPES' as secao;
SELECT id, nome, leader_id, team_type_id, ativo FROM teams;

SELECT 'MEMBROS' as secao;
SELECT * FROM team_members;

SELECT 'TIPOS' as secao;
SELECT id, nome, codigo FROM team_types;
