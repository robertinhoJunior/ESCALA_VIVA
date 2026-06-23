-- ─────────────────────────────────────────────────────────────
--  EscalaViva — Schema MySQL
--  Execute: mysql -u root -p < schema.sql
-- ─────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS escalaviva
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE escalaviva;

-- ── Usuários ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('lider','voluntario') NOT NULL DEFAULT 'voluntario',
  dept          VARCHAR(50)   NOT NULL,
  initials      VARCHAR(3)    NOT NULL,
  points        INT           NOT NULL DEFAULT 0,
  checkins_count INT          NOT NULL DEFAULT 0,
  available     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── Escalas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedules (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  date        DATE         NOT NULL,
  time        TIME         NOT NULL,
  dept        VARCHAR(50)  NOT NULL,
  status      ENUM('pending','confirmed') NOT NULL DEFAULT 'pending',
  created_by  INT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Escala × Voluntários ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_volunteers (
  schedule_id  INT NOT NULL,
  user_id      INT NOT NULL,
  assigned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (schedule_id, user_id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Check-ins ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkins (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  schedule_id INT NOT NULL,
  checked_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_checkin (user_id, schedule_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Notificações ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  user_id   INT,
  to_role   ENUM('all','lider','voluntario') NOT NULL DEFAULT 'all',
  text      VARCHAR(500) NOT NULL,
  read_at   TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─────────────────────────────────────────────────────────────
--  Dados iniciais (seed)
-- ─────────────────────────────────────────────────────────────
-- Senhas: lider123 e vol123 (bcrypt hash rounds=10)
INSERT INTO users (name,email,password_hash,role,dept,initials,points,checkins_count,available) VALUES
  ('João Silva',     'joao@escalaviva.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHFy','lider',     'Louvor',     'JS',320,24,1),
  ('Maria Fernanda', 'maria@escalaviva.com',  '$2a$10$Byk4HqBMQTDGX/9FJJ2g3OobBxkMDFJJRBe9.S6TXaI18.UiDVLDW','voluntario','Louvor',     'MF',280,18,1),
  ('Carlos Eduardo', 'carlos@escalaviva.com', '$2a$10$Byk4HqBMQTDGX/9FJJ2g3OobBxkMDFJJRBe9.S6TXaI18.UiDVLDW','voluntario','Mídia',      'CE',150,12,0),
  ('Ana Paula',      'ana@escalaviva.com',    '$2a$10$Byk4HqBMQTDGX/9FJJ2g3OobBxkMDFJJRBe9.S6TXaI18.UiDVLDW','voluntario','Recepção',   'AP',420,31,1),
  ('Pedro Henrique', 'pedro@escalaviva.com',  '$2a$10$Byk4HqBMQTDGX/9FJJ2g3OobBxkMDFJJRBe9.S6TXaI18.UiDVLDW','voluntario','Intercessão','PH', 95, 8,1),
  ('Lúcia Santos',   'lucia@escalaviva.com',  '$2a$10$Byk4HqBMQTDGX/9FJJ2g3OobBxkMDFJJRBe9.S6TXaI18.UiDVLDW','voluntario','Infantil',   'LS',200,15,0),
  ('Rafael Moreira', 'rafael@escalaviva.com', '$2a$10$Byk4HqBMQTDGX/9FJJ2g3OobBxkMDFJJRBe9.S6TXaI18.UiDVLDW','voluntario','Pregação',   'RM',130,10,1);

INSERT INTO schedules (title,date,time,dept,status,created_by) VALUES
  ('Culto Domingo Manhã', '2026-05-24','09:00','Louvor',     'confirmed',1),
  ('Culto Domingo Noite', '2026-05-24','19:00','Recepção',   'pending',  1),
  ('Reunião de Célula',   '2026-05-27','20:00','Intercessão','confirmed',1),
  ('Culto Quarta-Feira',  '2026-05-27','19:30','Mídia',      'pending',  1),
  ('Ensaio de Louvor',    '2026-05-30','16:00','Louvor',     'confirmed',1),
  ('Escola Dominical',    '2026-06-01','08:30','Infantil',   'pending',  1);

INSERT INTO schedule_volunteers (schedule_id,user_id) VALUES
  (1,1),(1,2),(2,4),(3,2),(3,5),(4,3),(5,1),(5,2),(6,6);

INSERT INTO notifications (user_id,to_role,text) VALUES
  (NULL,'all',    'Bem-vindo ao EscalaViva! 🙏'),
  (NULL,'lider',  'Sistema iniciado. Gerencie sua equipe com eficiência.'),
  (NULL,'voluntario','Você foi adicionado ao sistema EscalaViva.');
