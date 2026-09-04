-- Nox Lounge POS — Oracle sync schema
-- Run once against the schema named in ORACLE_USER.
-- In VS Code: open this file with the Oracle SQL Developer extension connected,
-- then "Run Script" (or run `npm run init-db` which executes it for you).

CREATE TABLE pos_sales (
  id              VARCHAR2(64)                 NOT NULL,
  receipt_no      VARCHAR2(32),
  created_at      TIMESTAMP WITH TIME ZONE,
  subtotal        NUMBER(12,2)  DEFAULT 0      NOT NULL,
  discount_amount NUMBER(12,2)  DEFAULT 0      NOT NULL,
  tax             NUMBER(12,2)  DEFAULT 0      NOT NULL,
  total           NUMBER(12,2)  DEFAULT 0      NOT NULL,
  payment_method  VARCHAR2(20),
  payment_amount  NUMBER(12,2)  DEFAULT 0      NOT NULL,
  payment_change  NUMBER(12,2)  DEFAULT 0      NOT NULL,
  payment_ref     VARCHAR2(64),
  raw_json        CLOB,
  synced_at       TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
  CONSTRAINT pos_sales_pk PRIMARY KEY (id),
  CONSTRAINT pos_sales_raw_json_chk CHECK (raw_json IS JSON)
);

CREATE TABLE pos_sale_items (
  sale_id    VARCHAR2(64)                 NOT NULL,
  line_no    NUMBER(4)                    NOT NULL,
  product_id VARCHAR2(64),
  name       VARCHAR2(200),
  sku        VARCHAR2(40),
  unit_price NUMBER(12,2)  DEFAULT 0      NOT NULL,
  quantity   NUMBER(10,2)  DEFAULT 0      NOT NULL,
  line_total NUMBER(12,2)  DEFAULT 0      NOT NULL,
  CONSTRAINT pos_sale_items_pk PRIMARY KEY (sale_id, line_no),
  CONSTRAINT pos_sale_items_fk FOREIGN KEY (sale_id)
    REFERENCES pos_sales (id) ON DELETE CASCADE
);

CREATE INDEX pos_sales_created_idx ON pos_sales (created_at);

-- Handy views ------------------------------------------------------------

CREATE OR REPLACE VIEW pos_daily_totals AS
SELECT CAST(created_at AS DATE)        AS sale_day,
       COUNT(*)                        AS transactions,
       SUM(total)                      AS gross,
       SUM(tax)                        AS vat,
       SUM(CASE WHEN payment_method = 'cash'  THEN total ELSE 0 END) AS cash,
       SUM(CASE WHEN payment_method = 'mpesa' THEN total ELSE 0 END) AS mpesa,
       SUM(CASE WHEN payment_method = 'card'  THEN total ELSE 0 END) AS card
FROM   pos_sales
GROUP  BY CAST(created_at AS DATE);
