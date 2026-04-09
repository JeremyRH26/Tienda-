use Minimer;
-- -----------------------------------------------------------------------------
-- Roles & permissions (RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE role (
  id          int PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(128) NOT NULL UNIQUE
);

CREATE TABLE permission (
  id          int PRIMARY KEY AUTO_INCREMENT,
  code        VARCHAR(64) NOT NULL UNIQUE,
  description VARCHAR(256)
);

CREATE TABLE role_permission (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  role_id       INT NOT NULL,
  permission_id INT NOT NULL,

  CONSTRAINT fk_role
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,

  CONSTRAINT fk_permission
    FOREIGN KEY (permission_id) REFERENCES permission(id) ON DELETE CASCADE,

  CONSTRAINT unique_role_permission
    UNIQUE (role_id, permission_id)
);

-- -----------------------------------------------------------------------------
-- Employees (equipo) — no shift / turno
-- -----------------------------------------------------------------------------
CREATE TABLE employee (
  id              int PRIMARY KEY AUTO_INCREMENT,
  role_id         INT NOT NULL REFERENCES role (id),
  full_name       VARCHAR(200) NOT NULL,
  username        VARCHAR(100) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  phone           VARCHAR(40),
  status          tinyint NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Suppliers (proveedores)
-- -----------------------------------------------------------------------------
CREATE TABLE supplier (
  id          int PRIMARY KEY,
  company_name       VARCHAR(200) NOT NULL,
  contact_name    varchar (200) not null,
  phone       VARCHAR(40),
  email       VARCHAR(200)
);
-- -----------------------------------------------------------------------------
-- Product categories
-- -----------------------------------------------------------------------------
CREATE TABLE product_category (
  id          int PRIMARY KEY,
  name        VARCHAR(120) NOT NULL UNIQUE
);

-- -----------------------------------------------------------------------------
-- Products (catalog) — image URL on product
-- -----------------------------------------------------------------------------
CREATE TABLE product (
  id              int PRIMARY KEY,
  category_id     BIGINT NOT NULL REFERENCES product_category (id),
  supplier_id     BIGINT REFERENCES supplier (id) ON DELETE SET NULL,
  name            VARCHAR(255) NOT NULL,
  cost_price      NUMERIC(14, 4) NOT NULL DEFAULT 0,
  sale_price      NUMERIC(14, 4) NOT NULL DEFAULT 0,
  image_url       VARCHAR(2048),
  status          tinyint NOT NULL DEFAULT 1,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Stock control (one row per product; quantity derived/maintained vs product)
-- -----------------------------------------------------------------------------
CREATE TABLE product_stock (
  product_id        BIGINT PRIMARY KEY REFERENCES product (id) ON DELETE CASCADE,
  quantity  		INT NOT NULL DEFAULT 0 ,
  min_stock       	INT NOT NULL DEFAULT 0 ,
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Customers
-- -----------------------------------------------------------------------------
CREATE TABLE customer (
  id              int PRIMARY KEY,
  full_name        VARCHAR(200) NOT NULL,
  phone            VARCHAR(40) NOT NULL,
  email            VARCHAR(200),
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Sales (POS)
-- -----------------------------------------------------------------------------
CREATE TABLE sale (
  id              int PRIMARY KEY,
  customer_id     BIGINT REFERENCES customer (id) ON DELETE SET NULL,
  employee_id     BIGINT NOT NULL REFERENCES employee (id),
  sale_date       TIMESTAMP NOT NULL DEFAULT NOW(),
  total_amount    NUMERIC(14, 4) NOT NULL DEFAULT 0,
  payment_method  VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('cash', 'card', 'credit')),
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_details (
  id           int PRIMARY KEY,
  sale_id      BIGINT NOT NULL REFERENCES sale (id) ON DELETE CASCADE,
  product_id   BIGINT REFERENCES product (id) ON DELETE SET NULL,
  quantity     INT NOT NULL CHECK (quantity > 0)
);

-- -----------------------------------------------------------------------------
-- Customer payments (abonos)
-- -----------------------------------------------------------------------------
CREATE TABLE customer_account (
  id           int PRIMARY KEY,
  customer_id  BIGINT NOT NULL REFERENCES customer (id) ON DELETE CASCADE,
  transaction_type tinyint not null,
  amount       NUMERIC(14, 4) NOT NULL CHECK (amount > 0),
  note         VARCHAR(1000),
  paid_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
-- -----------------------------------------------------------------------------
-- Expenses (gastos)
-- -----------------------------------------------------------------------------
CREATE TABLE expense_category (
  id          int PRIMARY KEY,
  name        VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE expense (
  id               int PRIMARY KEY,
  category_id      BIGINT NOT NULL REFERENCES expense_category (id),
  expense_date     DATE NOT NULL,
  amount           NUMERIC(14, 4) NOT NULL CHECK (amount > 0),
  payment_method   VARCHAR(20) NOT NULL
    CHECK (payment_method IN ('cash', 'transfer')),
  note             VARCHAR(2000)
);