-- Create brands table to store brand names
CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
);

-- Insert default/predefined brands
INSERT INTO brands (name) VALUES
('liberty_web_studio'),
('american_digital_agency'),
('american_digital_publishers'),
('the_web_sense'),
('the_tech_designers'),
('elite_pro_website'),
('design_lord'),
('web_designs_library'),
('web_harmony'),
('logic_works'),
('american_brand_designer'),
('pixels_and_the_beast'),
('american_book_studio'),
('smart_web_designers'),
('web_designs_lab'),
('my_american_logo')
ON DUPLICATE KEY UPDATE name=name;

-- Change sales.brand from ENUM to VARCHAR to support any brand name
ALTER TABLE sales MODIFY COLUMN brand VARCHAR(255) NULL;

