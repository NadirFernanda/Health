-- CreateEnum AdminRole
DO $$ BEGIN
  CREATE TYPE "AdminRole" AS ENUM ('FINANCEIRO', 'GESTOR', 'SUPORTE', 'ANALISTA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum AdminAccessLevel
DO $$ BEGIN
  CREATE TYPE "AdminAccessLevel" AS ENUM ('NONE', 'READ', 'WRITE', 'FULL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum AdminNotificationChannel
DO $$ BEGIN
  CREATE TYPE "AdminNotificationChannel" AS ENUM ('EMAIL', 'SYSTEM', 'BOTH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable User: add admin sub-role fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminRole"  "AdminRole";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminEmail" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminCargo" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "adminPhone" TEXT;

-- CreateTable AdminPermission
CREATE TABLE IF NOT EXISTS "AdminPermission" (
    "id"     TEXT               NOT NULL,
    "userId" TEXT               NOT NULL,
    "module" TEXT               NOT NULL,
    "access" "AdminAccessLevel"  NOT NULL DEFAULT 'NONE',
    CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable AdminSecurity
CREATE TABLE IF NOT EXISTS "AdminSecurity" (
    "id"                    TEXT    NOT NULL,
    "userId"                TEXT    NOT NULL,
    "twoFactorRequired"     BOOLEAN NOT NULL DEFAULT false,
    "ipRestriction"         BOOLEAN NOT NULL DEFAULT false,
    "allowedIps"            JSONB   NOT NULL DEFAULT '[]',
    "sessionTimeoutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 30,
    "forcePasswordChange"   BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AdminSecurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable AdminNotification
CREATE TABLE IF NOT EXISTS "AdminNotification" (
    "id"                         TEXT                       NOT NULL,
    "userId"                     TEXT                       NOT NULL,
    "notifyNewUser"              BOOLEAN                    NOT NULL DEFAULT true,
    "notifyNewDispute"           BOOLEAN                    NOT NULL DEFAULT true,
    "notifyKycPending"           BOOLEAN                    NOT NULL DEFAULT true,
    "notifyPayoutRequest"        BOOLEAN                    NOT NULL DEFAULT true,
    "notifyHighValueTransaction" BOOLEAN                    NOT NULL DEFAULT false,
    "notifySystemError"          BOOLEAN                    NOT NULL DEFAULT true,
    "notifyDailyReport"          BOOLEAN                    NOT NULL DEFAULT false,
    "channel"                   "AdminNotificationChannel"  NOT NULL DEFAULT 'SYSTEM',
    CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);

-- Unique + Index constraints
CREATE UNIQUE INDEX IF NOT EXISTS "AdminPermission_userId_module_key" ON "AdminPermission"("userId", "module");
CREATE INDEX IF NOT EXISTS "AdminPermission_userId_idx"              ON "AdminPermission"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminSecurity_userId_key"         ON "AdminSecurity"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "AdminNotification_userId_key"     ON "AdminNotification"("userId");

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "AdminPermission" ADD CONSTRAINT "AdminPermission_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminSecurity" ADD CONSTRAINT "AdminSecurity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "AdminNotification" ADD CONSTRAINT "AdminNotification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
