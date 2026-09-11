CREATE TABLE IF NOT EXISTS `meos_feitcodes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(20) NOT NULL,
  `omschrijving` TEXT NOT NULL,
  `sanctiebedrag` INT DEFAULT NULL,
  `categorie` VARCHAR(60) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_meos_feitcodes_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT IGNORE INTO `meos_feitcodes` (`code`, `omschrijving`, `sanctiebedrag`, `categorie`) VALUES
  ('R315a', 'Als bestuurder van een motorvoertuig niet de rijbaan gebruiken', 190, 'Verkeer op de weg'),
  ('R315b', 'Als bestuurder van een motorvoertuig stilstaan op het trottoir/fietspad', 130, 'Verkeer op de weg'),
  ('VW010', 'Als schipper varen zonder de vereiste vaarbevoegdheid', 140, 'Verkeer op de weg'),
  ('VW020', 'Overschrijden van de toegestane maximumsnelheid op het water', 160, 'Verkeer op de weg'),
  ('OV010', 'Reizen met het openbaar vervoer zonder geldig vervoerbewijs', 110, 'Openbaar vervoer'),
  ('M101', 'Vissen zonder de vereiste visakte of buiten het visseizoen', 100, 'Binnenvisserij'),
  ('MV010', 'Afsteken van vuurwerk buiten de toegestane periode', 150, 'Milieu/vuurwerk'),
  ('MV020', 'Illegaal storten of achterlaten van afval', 190, 'Milieu/vuurwerk'),
  ('D050', 'Aanwezig hebben van een gebruikershoeveelheid softdrugs', 75, 'Drugs'),
  ('DH010', 'Schenken van alcoholhoudende drank aan een persoon onder de 18 jaar', 200, 'Drank/horeca'),
  ('DH020', 'Exploiteren van een horecabedrijf zonder de vereiste vergunning', 220, 'Drank/horeca'),
  ('F010', 'Openbare dronkenschap', 100, 'Openbare orde'),
  ('F020', 'Baldadigheid / verstoring openbare orde', 140, 'Openbare orde'),
  ('B015', 'Verstoren van de openbare orde tijdens een evenement', 150, 'Openbare orde'),
  ('D537b', 'Bediening/gebruik van voorzieningen belemmeren waardoor orde/rust/veiligheid wordt verstoord', 140, 'Openbare orde');

DELETE FROM `meos_feitcodes` WHERE `code` IN ('A20', 'A21', 'A22', 'M204', 'G100', 'G200', 'W010');

UPDATE `meos_feitcodes` SET `categorie` = 'Verkeer op de weg' WHERE `categorie` = 'Verkeer te water';

CREATE TABLE IF NOT EXISTS `meos_lookup_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `officer_identifier` VARCHAR(60) NOT NULL,
  `type` ENUM('persoon', 'voertuig') NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `target_identifier` VARCHAR(60) DEFAULT NULL COMMENT 'users.identifier or owned_vehicles.plate, if applicable',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_meos_lookup_officer_type` (`officer_identifier`, `type`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `meos_wanted` (
  `identifier` VARCHAR(60) NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  `added_by` VARCHAR(60) DEFAULT NULL COMMENT 'officer identifier who marked this person wanted',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT IGNORE INTO `licenses` (`type`, `label`) VALUES
  ('verlof', 'Verlof (jacht/wapen)'),
  ('weapon', 'Wapenvergunning');

CREATE TABLE IF NOT EXISTS `meos_digibonnen` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `officer_identifier` VARCHAR(60) NOT NULL,
  `feit_code` VARCHAR(20) DEFAULT NULL,
  `feit_omschrijving` TEXT,
  `persoon_identifier` VARCHAR(60) DEFAULT NULL,
  `voertuig_plate` VARCHAR(12) DEFAULT NULL,
  `postcode` VARCHAR(20) DEFAULT NULL,
  `straat` VARCHAR(120) DEFAULT NULL,
  `reden_wetenschap` TEXT,
  `verklaring` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_meos_digibonnen_persoon` (`persoon_identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `meos_mutaties` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `officer_identifier` VARCHAR(60) NOT NULL,
  `situatie` TEXT,
  `persoon_identifier` VARCHAR(60) DEFAULT NULL,
  `voertuig_plate` VARCHAR(12) DEFAULT NULL,
  `postcode` VARCHAR(20) DEFAULT NULL,
  `straat` VARCHAR(120) DEFAULT NULL,
  `toelichting` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_meos_mutaties_persoon` (`persoon_identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE IF NOT EXISTS `meos_combibonnen` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `officer_identifier` VARCHAR(60) NOT NULL,
  `soort` ENUM('S', 'K', 'A', 'B') DEFAULT NULL,
  `feit_code` VARCHAR(20) DEFAULT NULL,
  `feit_omschrijving` TEXT,
  `persoon_identifier` VARCHAR(60) DEFAULT NULL,
  `voertuig_plate` VARCHAR(12) DEFAULT NULL,
  `postcode` VARCHAR(20) DEFAULT NULL,
  `straat` VARCHAR(120) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_meos_combibonnen_persoon` (`persoon_identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
