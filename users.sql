-- MySQL dump 10.13  Distrib 8.0.43, for Linux (x86_64)
--
-- Host: localhost    Database: crm_db
-- ------------------------------------------------------
-- Server version	8.0.43-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `role_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_role_id` (`role_id`),
  CONSTRAINT `fk_users_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@example.com','$2b$10$O1YGV4avBmgqHd61HjahcuG8rKaJ0RzydakgApg0Afyuc7MPXye/.','2025-09-14 06:58:17',1),(2,'Sabeer','sabeer@example.com','$2b$10$/ReCwOi3xmJIpQPGULLFPuLlij.r62KTbeYefP/JOtS0kJYAEIrxC','2025-09-14 07:47:01',1),(6,'Asad Khan','asadkhan@crm.com','$2b$10$6OM4b.IZPOfrlIYxAYGpl..ZGarGEmA.RhW7ZeXdCVd5HTNGdRajy','2025-09-14 09:41:47',2),(9,'Iftikhar Khan','iftikharkhan@crm.com','$2b$10$hNhH/svuPvwKsJTnglLIqe.cMXbP/elcnjBCRioMYzX42X4HBAxua','2025-09-15 20:07:34',4),(10,'Upseller','upseller@example.com','$2b$10$GiPWHs7KzHFxk8VYAVXRm.zgPXQBqhtN3g0ek0hL1FmDPd42J76aW','2025-09-16 23:35:32',5),(11,'Test User','test@example.com','$2b$10$3XOL9qo7GsTNKos4f6o2C.vhrJSmRKOHLLwr.Us3t8.vSvoSaUZc2','2025-09-16 23:47:51',1),(12,'Upseller2','upseller2@example.com','$2b$10$2UN4v2IRCMe3m2FFKtdfM.IMlHfOy/JFnus8iz8bbEsZOLPAvqy.O','2025-09-17 00:03:00',5),(13,'Upsell Manager','upsellmanager@example.com','$2b$10$lLAWT3ChReDwQ42xZdn8R.tAVAZY84CwZrzQis8.Sil6W5Lp1oVSW','2025-09-17 05:15:00',6),(14,'Designer Lead','designerlead@example.com','$2b$10$qw1eNoHEglWHp.YatzKZ6eoc6PFGO4t5z6JpeUIfmcpbUbVhfGG7m','2025-09-23 23:30:21',7),(15,'Designer','designer@example.com','$2b$10$0gsHzVUJ2Z2fa9S/fXDMqO40mnIT2cj./iJqWCF5nZiemPHw3wQFC','2025-09-23 23:30:40',7),(16,'Developmer Lead','developerlead@example.com','$2b$10$xA6Dmu/GUI45r.6btaAFgunuHKfaWShU4UQhibZZjFoCCgMHtPamW','2025-10-01 00:21:56',7),(17,'Developer','developer@example.com','$2b$10$qSHD/bDbQNtLp/gjPQHoNeU0pQ5aAoB5rfmtYHvpdCm8G95nVEF3.','2025-10-01 00:22:22',7),(18,'Jahan Rasoli','jahan@crm.com','$2b$10$3Yt/8LcavbbO/NecHH9wn.bpklTqViZspdybNGoeXGqCi1JG7n9zu','2025-10-01 19:10:42',2),(19,'Musawir Rasoli','musawir@crm.com','$2b$10$pl8Nl/XaPbMWGWtbMiKsR.5ws6whuuga481IHsPOFZZJdPSiHRrFi','2025-10-01 19:20:49',2),(20,'Hassaan Umer Ansari ','hassan@crm.com','$2b$10$7ntHdGnxg/o4Qpcz.QKJL.xujcrJfBP2t7A4p93jmY0.EDEZHFYRG','2025-10-01 19:26:23',3),(21,'Adam Zain Nasir','adam@crm.com','$2b$10$ZXU8.Lts/lFQRJLtmm5YBOD/ksKKbvNho6kpwnofLQJBN6yPpp8Ky','2025-10-01 19:49:38',3),(22,'Adnan Shafaqat','adnan@crm.com','$2b$10$skOH65Q6EQOd2M.8Gfr2Mu.jDr4V4Jlbp.ELJMyYcmbckD0SUiATa','2025-10-01 19:55:47',3),(23,'Muhammad Fahad ','fahad@crm.com','$2b$10$YPSKznKoJ.QWcj3mDw307OoSLVSz1MzON2Pr5Oe5N2Rp1uS.k9vLG','2025-10-01 19:57:50',3),(24,'Shahbaz khan','shahbaz@crm.com','$2b$10$.p8CbzrqsL/7ipgZjRBFfOdkCBHZInJocqmTHX7t8Q.9y5eAnTX9y','2025-10-01 19:58:28',3),(25,'Vincent Welfred Khan','vincent@crm.com','$2b$10$2wIycws1OCuIHzmWKH4PPeeZJwM38RmOMTnJ02UoAO/rLhEwvAfha','2025-10-01 19:59:00',3),(26,'Bilal Ahmed ','bilal@crm.com','$2b$10$BwcOLWPypwR3WZYKbh3mn.GsRX9SBkvjQI/zqRog.dpFZojACDOsq','2025-10-01 19:59:25',3),(27,'Sharjeel Ahmed','sharjeel@crm.com','$2b$10$Br0Ot.qHKBm/rTj3beEmw.NisfqvZSIfnpXYKrOD1wM6shaV1Uo4e','2025-10-01 21:19:54',3),(28,'Muheet ','muheet@crm.com','$2b$10$c.fTmdEntHFFN5FcWlp0tuFqr8ZwgQjcM3pLA1va3bNeor.8MAAeS','2025-10-01 21:25:23',3);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06 21:56:32
