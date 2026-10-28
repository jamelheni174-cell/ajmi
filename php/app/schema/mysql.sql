-- ---------------------------------------------------------------------
--  Cabinet Ajmi — schéma MySQL / MariaDB (hébergement mutualisé cPanel)
--  Appliqué par install.php. Les identifiants cités par des accents
--  graves évitent les conflits avec les mots réservés.
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom`        VARCHAR(120) NOT NULL,
  `email`      VARCHAR(190) NOT NULL,
  `password`   VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `content` (
  `id`         TINYINT UNSIGNED NOT NULL,
  `data`       LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `history` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `data`       LONGTEXT NOT NULL,
  `author`     VARCHAR(190) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom`        VARCHAR(120) NOT NULL,
  `email`      VARCHAR(190) NOT NULL,
  `telephone`  VARCHAR(60) DEFAULT '',
  `competence` VARCHAR(120) DEFAULT '',
  `message`    TEXT NOT NULL,
  `lu`         TINYINT(1) NOT NULL DEFAULT 0,
  `ip`         VARCHAR(60) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_messages_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(190) NOT NULL,
  `taille`     INT UNSIGNED DEFAULT 0,
  `created_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_media_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reservations` (
  `id`                VARCHAR(40) NOT NULL,
  `code_norm`         VARCHAR(40) NOT NULL,
  `created_at`        DATETIME NOT NULL,
  `publication_id`    VARCHAR(120) NOT NULL DEFAULT '',
  `publication_title` VARCHAR(240) NOT NULL DEFAULT '',
  `nom`               VARCHAR(120) NOT NULL,
  `telephone`         VARCHAR(60) NOT NULL DEFAULT '',
  `email`             VARCHAR(190) NOT NULL DEFAULT '',
  `adresse`           VARCHAR(300) NOT NULL DEFAULT '',
  `quantite`          SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `remarques`         TEXT,
  `statut`            VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  `ip`                VARCHAR(60) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reservations_code` (`code_norm`),
  KEY `idx_reservations_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
