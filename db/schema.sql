-- =============================================================================
-- MiniMer / Tienda — database schema (DDL)
-- Modules covered: POS (sales), inventory, customers, expenses, team (equipo),
-- suppliers, roles/permissions, customer credit (CuentaCliente).
-- Excluded: dashboard and reportes (no dedicated tables; reportes read from facts).
-- Naming: tables and columns in English, except table "CuentaCliente" as requested.
-- Target: PostgreSQL 14+ (adjust types if you use MySQL/SQL Server).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Roles & permissions (RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE role (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(64) NOT NULL UNIQUE,
  name        VARCHAR(128) NOT NULL,
  description VARCHAR(512),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permission (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(64) NOT NULL UNIQUE,
  description VARCHAR(256),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permission (
  role_id       BIGINT NOT NULL REFERENCES role (id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permission (id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permission_permission ON role_permission (permission_id);

-- -----------------------------------------------------------------------------
-- Employees (equipo) — no shift / turno
-- -----------------------------------------------------------------------------
CREATE TABLE employee (
  id              BIGSERIAL PRIMARY KEY,
  role_id         BIGINT NOT NULL REFERENCES role (id),
  full_name       VARCHAR(200) NOT NULL,
  username        VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  phone           VARCHAR(40),
  status          VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_employee_role ON employee (role_id);
CREATE INDEX idx_employee_status ON employee (status);

-- -----------------------------------------------------------------------------
-- Suppliers (proveedores)
-- -----------------------------------------------------------------------------
CREATE TABLE supplier (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  phone       VARCHAR(40),
  email       VARCHAR(200),
  notes       VARCHAR(1000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Product categories
-- -----------------------------------------------------------------------------
CREATE TABLE product_category (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Products (catalog) — image URL on product
-- -----------------------------------------------------------------------------
CREATE TABLE product (
  id              BIGSERIAL PRIMARY KEY,
  category_id     BIGINT NOT NULL REFERENCES product_category (id),
  supplier_id     BIGINT REFERENCES supplier (id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  sku             VARCHAR(64),
  cost_price      NUMERIC(14, 4) NOT NULL DEFAULT 0,
  sale_price      NUMERIC(14, 4) NOT NULL DEFAULT 0,
  min_stock       INT NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  image_url       VARCHAR(2048),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sku)
);

CREATE INDEX idx_product_category ON product (category_id);
CREATE INDEX idx_product_supplier ON product (supplier_id);
CREATE INDEX idx_product_name ON product (name);

-- -----------------------------------------------------------------------------
-- Stock control (one row per product; quantity derived/maintained vs product)
-- -----------------------------------------------------------------------------
CREATE TABLE product_stock (
  product_id        BIGINT PRIMARY KEY REFERENCES product (id) ON DELETE CASCADE,
  quantity_on_hand  INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Customers
-- -----------------------------------------------------------------------------
CREATE TABLE customer (
  id               BIGSERIAL PRIMARY KEY,
  full_name        VARCHAR(200) NOT NULL,
  phone            VARCHAR(40),
  email            VARCHAR(200),
  balance          NUMERIC(14, 4) NOT NULL DEFAULT 0,
  last_purchase_at DATE,
  total_purchases  NUMERIC(14, 4) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_name ON customer (full_name);

-- -----------------------------------------------------------------------------
-- Sales (POS)
-- -----------------------------------------------------------------------------
CREATE TABLE sale (
  id              BIGSERIAL PRIMARY KEY,
  customer_id     BIGINT REFERENCES customer (id) ON DELETE SET NULL,
  customer_name   VARCHAR(200) NOT NULL,
  employee_id     BIGINT NOT NULL REFERENCES employee (id),
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_amount    NUMERIC(14, 4) NOT NULL DEFAULT 0,
  payment_method  VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('cash', 'card', 'credit')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sale_occurred ON sale (occurred_at);
CREATE INDEX idx_sale_customer ON sale (customer_id);
CREATE INDEX idx_sale_employee ON sale (employee_id);

CREATE TABLE sale_line (
  id           BIGSERIAL PRIMARY KEY,
  sale_id      BIGINT NOT NULL REFERENCES sale (id) ON DELETE CASCADE,
  product_id   BIGINT REFERENCES product (id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity     INT NOT NULL CHECK (quantity > 0),
  unit_price   NUMERIC(14, 4) NOT NULL CHECK (unit_price >= 0),
  line_total   NUMERIC(14, 4) NOT NULL DEFAULT 0
);

CREATE INDEX idx_sale_line_sale ON sale_line (sale_id);
CREATE INDEX idx_sale_line_product ON sale_line (product_id);

-- -----------------------------------------------------------------------------
-- Customer payments (abonos)
-- -----------------------------------------------------------------------------
CREATE TABLE customer_payment (
  id           BIGSERIAL PRIMARY KEY,
  customer_id  BIGINT NOT NULL REFERENCES customer (id) ON DELETE CASCADE,
  amount       NUMERIC(14, 4) NOT NULL CHECK (amount > 0),
  note         VARCHAR(1000),
  paid_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_payment_customer ON customer_payment (customer_id);
CREATE INDEX idx_customer_payment_paid_at ON customer_payment (paid_at);

-- -----------------------------------------------------------------------------
-- CuentaCliente — pending credit / fiado ledger (linked to customer)
-- TipoMovimiento = business classification (e.g. CREDIT_SALE, PAYMENT, ADJUSTMENT)
-- -----------------------------------------------------------------------------
CREATE TABLE "CuentaCliente" (
  id                   BIGSERIAL PRIMARY KEY,
  customer_id          BIGINT NOT NULL REFERENCES customer (id) ON DELETE CASCADE,
  "TipoMovimiento"     VARCHAR(40) NOT NULL,
  description          VARCHAR(500),
  sale_id              BIGINT REFERENCES sale (id) ON DELETE SET NULL,
  original_amount      NUMERIC(14, 4),
  pending_balance      NUMERIC(14, 4) NOT NULL DEFAULT 0,
  occurred_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note                 VARCHAR(1000),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cuenta_cliente_customer ON "CuentaCliente" (customer_id);
CREATE INDEX idx_cuenta_cliente_sale ON "CuentaCliente" (sale_id);
CREATE INDEX idx_cuenta_cliente_pending ON "CuentaCliente" (customer_id)
  WHERE pending_balance > 0;

-- Line detail for a credit movement (snapshot of products on that fiado)
CREATE TABLE customer_account_line (
  id                 BIGSERIAL PRIMARY KEY,
  cuenta_cliente_id  BIGINT NOT NULL REFERENCES "CuentaCliente" (id) ON DELETE CASCADE,
  product_id         BIGINT REFERENCES product (id) ON DELETE SET NULL,
  product_name       VARCHAR(255) NOT NULL,
  quantity           INT NOT NULL CHECK (quantity > 0),
  unit_price         NUMERIC(14, 4) NOT NULL CHECK (unit_price >= 0)
);

CREATE INDEX idx_customer_account_line_cuenta ON customer_account_line (cuenta_cliente_id);

-- -----------------------------------------------------------------------------
-- Expenses (gastos)
-- -----------------------------------------------------------------------------
CREATE TABLE expense_category (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(64) NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL
);

CREATE TABLE expense (
  id               BIGSERIAL PRIMARY KEY,
  category_id      BIGINT NOT NULL REFERENCES expense_category (id),
  expense_date     DATE NOT NULL,
  amount           NUMERIC(14, 4) NOT NULL CHECK (amount > 0),
  payment_method   VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('cash', 'transfer')),
  note             VARCHAR(2000),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_date ON expense (expense_date);
CREATE INDEX idx_expense_category ON expense (category_id);

COMMIT;

-- =============================================================================
-- Optional seed: expense categories (align with frontend ExpenseCategoryId)
-- =============================================================================
/*
INSERT INTO expense_category (code, name) VALUES
  ('utilities', 'Public utilities'),
  ('supplies_purchase', 'Supplies and products purchase'),
  ('rent', 'Rent'),
  ('payroll', 'Payroll'),
  ('administrative', 'Administrative'),
  ('transport_logistics', 'Transport and logistics'),
  ('furniture_equipment', 'Furniture, equipment or machinery'),
  ('other', 'Other');
*/

-- =============================================================================
-- Optional seed: permissions (exclude dashboard/reportes tables only; codes
-- can still exist for RBAC if you add those screens later)
-- =============================================================================
/*
INSERT INTO permission (code, description) VALUES
  ('ventas', 'POS / sales'),
  ('inventario', 'Inventory'),
  ('clientes', 'Customers'),
  ('proveedores', 'Suppliers'),
  ('gastos', 'Expenses'),
  ('equipo', 'Team / employees');

INSERT INTO role (code, name) VALUES
  ('admin', 'Administrator'),
  ('cashier', 'Cashier');

-- Then link role_permission as needed.
*/
