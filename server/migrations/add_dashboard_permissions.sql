-- Add dashboard permissions to the permissions table
-- Each dashboard gets a 'view' permission

INSERT INTO permissions (id, module, action) VALUES
(171, 'admin_dashboard', 'view'),
(172, 'lead_scraper_dashboard', 'view'),
(173, 'front_seller_dashboard', 'view'),
(174, 'upseller_dashboard', 'view'),
(175, 'upsell_manager_dashboard', 'view'),
(176, 'front_sales_manager_dashboard', 'view'),
(177, 'production_head_dashboard', 'view'),
(178, 'department_leader_dashboard', 'view'),
(179, 'team_member_dashboard', 'view');

-- Assign dashboard permissions to appropriate roles
-- Admin (role_id: 1) - gets all dashboard permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
(1, 171), -- admin_dashboard
(1, 172), -- lead_scraper_dashboard
(1, 173), -- front_seller_dashboard
(1, 174), -- upseller_dashboard
(1, 175), -- upsell_manager_dashboard
(1, 176), -- front_sales_manager_dashboard
(1, 177), -- production_head_dashboard
(1, 178), -- department_leader_dashboard
(1, 179); -- team_member_dashboard

-- Lead Scraper (role_id: 2) - gets lead_scraper_dashboard
INSERT INTO role_permissions (role_id, permission_id) VALUES
(2, 172); -- lead_scraper_dashboard

-- Sales (role_id: 3) - gets front_seller_dashboard
INSERT INTO role_permissions (role_id, permission_id) VALUES
(3, 173); -- front_seller_dashboard

-- Front Sales Manager (role_id: 4) - gets front_sales_manager_dashboard and admin_dashboard
INSERT INTO role_permissions (role_id, permission_id) VALUES
(4, 171), -- admin_dashboard
(4, 176); -- front_sales_manager_dashboard

-- Upseller (role_id: 5) - gets upseller_dashboard
INSERT INTO role_permissions (role_id, permission_id) VALUES
(5, 174); -- upseller_dashboard

-- Upsell Manager (role_id: 6) - gets upsell_manager_dashboard
INSERT INTO role_permissions (role_id, permission_id) VALUES
(6, 175); -- upsell_manager_dashboard

-- Production Head (role_id: 8) - gets production_head_dashboard
INSERT INTO role_permissions (role_id, permission_id) VALUES
(8, 177); -- production_head_dashboard

-- Department Leaders (role_ids: 9, 11, 13, 15, 17) - get department_leader_dashboard
INSERT INTO role_permissions (role_id, permission_id) VALUES
(9, 178),  -- designer-lead
(11, 178), -- developer-lead
(13, 178), -- seo-lead
(15, 178), -- content-lead
(17, 178); -- qa-lead

-- Team Members (role_ids: 10, 12, 14, 16, 18) - get team_member_dashboard
INSERT INTO role_permissions (role_id, permission_id) VALUES
(10, 179), -- designer-member
(12, 179), -- developer-member
(14, 179), -- seo-member
(16, 179), -- content-member
(18, 179); -- qa-member

