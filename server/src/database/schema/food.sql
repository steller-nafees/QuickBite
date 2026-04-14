CREATE TABLE IF NOT EXISTS food (
  food_id INT PRIMARY KEY AUTO_INCREMENT,
  item_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  managed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (managed_by) REFERENCES user(id) ON DELETE CASCADE
);

-- Create an index on managed_by for faster queries
CREATE INDEX idx_food_managed_by ON food(managed_by);
