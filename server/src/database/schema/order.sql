-- Create order table
CREATE TABLE IF NOT EXISTS `order` (
  order_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  vendor_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'preparing', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pickup_time TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Create order_item table
CREATE TABLE IF NOT EXISTS order_item (
  order_item_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  food_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES `order`(order_id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES food(food_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_order_customer_id ON `order`(customer_id);
CREATE INDEX idx_order_vendor_id ON `order`(vendor_id);
CREATE INDEX idx_order_status ON `order`(status);
CREATE INDEX idx_order_item_order_id ON order_item(order_id);
CREATE INDEX idx_order_item_food_id ON order_item(food_id);
