-- ============================================================
-- KDK Software — Website Builder
-- Database Schema (MySQL)
-- Phase 1
-- ============================================================

-- Each KDK user (professional) who creates a website
CREATE TABLE wb_websites (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL,          -- FK to KDK main users table
    subdomain       VARCHAR(60)     NOT NULL UNIQUE,   -- e.g. "sharma-associates"
    full_url        VARCHAR(255)    GENERATED ALWAYS AS (CONCAT('https://', subdomain, '.kdksites.in')) STORED,
    status          ENUM('draft', 'published', 'unpublished') NOT NULL DEFAULT 'draft',
    profession      ENUM('ca','advocate','tax_consultant','gst_practitioner','company_secretary','cost_accountant') NOT NULL,
    template        ENUM('prestige','clarity','heritage') NOT NULL DEFAULT 'prestige',
    color_theme     VARCHAR(30)     NOT NULL DEFAULT 'navy_gold',
    published_at    DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_id   (user_id),
    INDEX idx_status    (status),
    INDEX idx_subdomain (subdomain)
);

-- Business / firm information for the website
CREATE TABLE wb_business_info (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id      BIGINT UNSIGNED NOT NULL UNIQUE,
    firm_name       VARCHAR(150)    NOT NULL,
    tagline         VARCHAR(255)    NULL,
    about_text      TEXT            NULL,
    years_exp       SMALLINT        NULL,
    clients_count   SMALLINT        NULL,
    team_size       SMALLINT        NULL,
    phone           VARCHAR(20)     NULL,
    whatsapp        VARCHAR(20)     NULL,
    email           VARCHAR(150)    NULL,
    city            VARCHAR(80)     NULL,
    address         VARCHAR(300)    NULL,
    membership_no   VARCHAR(80)     NULL,   -- ICAI M.No., Bar Council No., etc.
    firm_reg_no     VARCHAR(80)     NULL,   -- FRN, etc.
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (website_id) REFERENCES wb_websites(id) ON DELETE CASCADE
);

-- Services displayed on the website
CREATE TABLE wb_services (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id      BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(150)    NOT NULL,
    description     TEXT            NULL,
    sort_order      TINYINT         NOT NULL DEFAULT 0,
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    is_custom       TINYINT(1)      NOT NULL DEFAULT 0,  -- user-added vs pre-populated
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (website_id) REFERENCES wb_websites(id) ON DELETE CASCADE,
    INDEX idx_website_active (website_id, is_active)
);

-- Pre-populated service library per profession (seed data)
CREATE TABLE wb_service_library (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profession      ENUM('ca','advocate','tax_consultant','gst_practitioner','company_secretary','cost_accountant') NOT NULL,
    name            VARCHAR(150)    NOT NULL,
    description     TEXT            NULL,
    default_active  TINYINT(1)      NOT NULL DEFAULT 1,
    sort_order      TINYINT         NOT NULL DEFAULT 0
);

-- Leads captured from the contact form on published websites
CREATE TABLE wb_leads (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id      BIGINT UNSIGNED NOT NULL,
    visitor_name    VARCHAR(150)    NOT NULL,
    phone           VARCHAR(20)     NOT NULL,
    email           VARCHAR(150)    NULL,
    service         VARCHAR(150)    NULL,
    message         TEXT            NULL,
    source_url      VARCHAR(255)    NULL,    -- which page the lead came from
    ip_address      VARCHAR(45)     NULL,
    status          ENUM('new','contacted','converted','closed') NOT NULL DEFAULT 'new',
    notified_at     DATETIME        NULL,    -- when email was sent to professional
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (website_id) REFERENCES wb_websites(id) ON DELETE CASCADE,
    INDEX idx_website_status  (website_id, status),
    INDEX idx_created_at      (created_at)
);

-- Website analytics (daily aggregates)
CREATE TABLE wb_analytics (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    website_id      BIGINT UNSIGNED NOT NULL,
    date            DATE            NOT NULL,
    page_views      INT             NOT NULL DEFAULT 0,
    unique_visitors INT             NOT NULL DEFAULT 0,
    leads_count     INT             NOT NULL DEFAULT 0,
    whatsapp_clicks INT             NOT NULL DEFAULT 0,

    FOREIGN KEY (website_id) REFERENCES wb_websites(id) ON DELETE CASCADE,
    UNIQUE KEY uq_website_date (website_id, date)
);

-- ============================================================
-- SEED DATA — Pre-populated services per profession
-- ============================================================

INSERT INTO wb_service_library (profession, name, description, default_active, sort_order) VALUES
-- Chartered Accountant
('ca', 'Income Tax Return (ITR) Filing', 'Accurate ITR filing for individuals, salaried, business, and NRI clients.', 1, 1),
('ca', 'GST Registration & Returns', 'GST registration, monthly/quarterly returns, GSTR-9 annual return.', 1, 2),
('ca', 'Tax Audit (Form 3CA/3CB)', 'Statutory tax audits under Section 44AB filed before due dates.', 1, 3),
('ca', 'TDS Return Filing', 'Quarterly TDS returns — Form 24Q, 26Q, 27Q for employers and deductors.', 1, 4),
('ca', 'Tax Planning & Advisory', 'Proactive tax planning to legally minimise your tax liability.', 0, 5),
('ca', 'NRI Taxation Services', 'DTAA, NRE/NRO reporting, property TDS, Section 195 certificates.', 0, 6),
('ca', 'Company / LLP Incorporation', 'Fast MCA registration with PAN, TAN, GST, MSME.', 1, 7),
('ca', 'ROC Annual Filings', 'AOC-4, MGT-7, DIR-3 KYC, DPT-3 and all MCA filings.', 1, 8),
('ca', 'Statutory Audit', 'Audit of financial statements under Companies Act.', 0, 9),
('ca', 'Virtual CFO Services', 'Outsourced CFO functions for growing businesses.', 0, 10),

-- Advocate / Lawyer
('advocate', 'Civil Litigation', 'Property disputes, breach of contract, injunctions, and recovery matters.', 1, 1),
('advocate', 'Criminal Defense', 'Bail applications, trial defense, appeals before Sessions and High Court.', 1, 2),
('advocate', 'Corporate & Company Law', 'Company formation, shareholder disputes, M&A advisory.', 1, 3),
('advocate', 'Tax Litigation', 'Representation before ITAT, CIT(A), and High Courts in tax disputes.', 1, 4),
('advocate', 'Property & Real Estate', 'Sale deeds, title verification, partition suits, landlord-tenant.', 0, 5),
('advocate', 'Family & Matrimonial', 'Divorce, maintenance, child custody, adoption, succession.', 0, 6),
('advocate', 'Consumer & Arbitration', 'Consumer forum cases, arbitration, mediation proceedings.', 0, 7),

-- Tax Consultant
('tax_consultant', 'Income Tax Return Filing', 'ITR for all types — salaried, business, capital gains, NRI.', 1, 1),
('tax_consultant', 'TDS Filing & Compliance', 'Quarterly TDS return filing for employers and deductors.', 1, 2),
('tax_consultant', 'Tax Planning & Advisory', 'Optimal tax planning under all sections — 80C, 80D, HRA, and more.', 1, 3),
('tax_consultant', 'NRI Taxation', 'DTAA, foreign income disclosure, property sale TDS for NRIs.', 0, 4),
('tax_consultant', 'Advance Tax Computation', 'Quarterly advance tax calculation to avoid interest.', 0, 5),
('tax_consultant', 'IT Notice Handling', 'Response to 139, 143, 148, 245 and other notices.', 1, 6),

-- GST Practitioner
('gst_practitioner', 'GST Registration', 'New GST registration for businesses, composition scheme.', 1, 1),
('gst_practitioner', 'Monthly/Quarterly GST Returns', 'GSTR-1 and GSTR-3B filing on time every month.', 1, 2),
('gst_practitioner', 'GST Annual Return (GSTR-9)', 'Annual reconciliation and GSTR-9 filing.', 1, 3),
('gst_practitioner', 'GST Audit', 'GST audit under Section 65/66 and GSTR-9C reconciliation.', 0, 4),
('gst_practitioner', 'GST Refund Applications', 'Refund applications for exports, inverted duty, and excess tax.', 0, 5),
('gst_practitioner', 'GST Notice Response', 'Expert response to SCN, DRC-01, and other GST notices.', 1, 6),

-- Company Secretary
('company_secretary', 'Company Incorporation', 'Private Ltd, Public Ltd, OPC with PAN, TAN, and all approvals.', 1, 1),
('company_secretary', 'LLP Registration', 'LLP formation with MCA and all statutory registrations.', 1, 2),
('company_secretary', 'ROC Annual Filings', 'AOC-4, MGT-7, DIR-3 KYC, and all MCA annual compliances.', 1, 3),
('company_secretary', 'FEMA Compliance', 'FDI, ODI, ECB filings and RBI FEMA compliance.', 0, 4),
('company_secretary', 'Board Meeting Management', 'Board meeting notices, minutes, resolutions, and secretarial audit.', 1, 5),
('company_secretary', 'Share Transfer & ESOP', 'Share transfers, SH-4, ESOP scheme drafting and compliance.', 0, 6),

-- Cost Accountant
('cost_accountant', 'Cost Audit', 'Cost audit under Section 148 of Companies Act.', 1, 1),
('cost_accountant', 'Management Accounting', 'MIS reports, variance analysis, cost centre reporting.', 1, 2),
('cost_accountant', 'Cost Records Maintenance', 'Cost records under Cost Records and Audit Rules.', 1, 3),
('cost_accountant', 'Product Costing', 'Standard costing, activity-based costing for manufacturing.', 0, 4),
('cost_accountant', 'Budgeting & MIS Reports', 'Annual budgets, quarterly forecasts, management dashboards.', 0, 5),
('cost_accountant', 'CAS Compliance', 'Cost Accounting Standards compliance and certification.', 1, 6);
