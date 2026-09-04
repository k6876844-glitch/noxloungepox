-- OPTIONAL: create a dedicated schema/user for the POS.
-- Run this as a DBA (connect as SYSTEM or SYS in the Oracle SQL Developer
-- extension) against the pluggable DB you'll use, e.g. XEPDB1.
-- Skip this file if you already have a schema to use — just put its
-- credentials in server/.env.

-- change the password
CREATE USER nox_pos IDENTIFIED BY "Nox_Pos#2026";

GRANT CONNECT, RESOURCE, CREATE VIEW TO nox_pos;
ALTER USER nox_pos QUOTA UNLIMITED ON USERS;

-- Then set in server/.env:
--   ORACLE_USER=nox_pos
--   ORACLE_PASSWORD=Nox_Pos#2026
--   ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
