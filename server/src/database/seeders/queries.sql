INSERT INTO user 
(name, email, password, role, student_id, vendor_id)
VALUES
(
    'Super Admin',
    'superadmin@quickbite.com',
    '$2b$10$dummyhashedpassword123456789',
    'superadmin',
    NULL,
    NULL
),
(
    'Student User',
    'student@quickbite.com',
    '$2b$10$dummyhashedpassword123456789',
    'student',
    'NSU-2024-001',
    NULL
),
(
    'Tasty Bites Cafe',
    'tastybites@quickbite.com',
    '$2b$10$dummyhashedpassword123456789',
    'vendor',
    NULL,
    NULL
),
(
    'Pizza Palace',
    'pizzapalace@quickbite.com',
    '$2b$10$dummyhashedpassword123456789',
    'vendor',
    NULL,
    NULL
),
(
    'Deshi Kitchen',
    'deshikitchen@quickbite.com',
    '$2b$10$dummyhashedpassword123456789',
    'vendor',
    NULL,
    NULL
);

-- Insert 10 random foods - 6 for vendor id 3 (Tasty Bites Cafe) and 4 for vendor id 4 (Pizza Palace)
INSERT INTO food 
(item_name, description, price, is_available, managed_by)
VALUES
-- Tasty Bites Cafe (vendor_id = 3) - 6 items
(
    'Chicken Biryani',
    'Fragrant basmati rice cooked with tender chicken and aromatic spices',
    450.00,
    true,
    3
),
(
    'Butter Chicken',
    'Creamy tomato-based curry with succulent chicken pieces',
    380.00,
    true,
    3
),
(
    'Paneer Tikka',
    'Marinated cottage cheese cubes grilled with vegetables',
    320.00,
    true,
    3
),
(
    'Dal Makhani',
    'Creamy black lentils simmered overnight with butter and cream',
    280.00,
    true,
    3
),
(
    'Garlic Naan',
    'Soft bread brushed with garlic butter and fresh herbs',
    120.00,
    true,
    3
),
(
    'Mango Lassi',
    'Refreshing yogurt-based drink with fresh mango pulp',
    150.00,
    true,
    3
),
-- Pizza Palace (vendor_id = 4) - 4 items
(
    'Margherita Pizza',
    'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil',
    500.00,
    true,
    4
),
(
    'Pepperoni Pizza',
    'Spicy pizza topped with pepperoni slices and melted cheese',
    550.00,
    true,
    4
),
(
    'Veggie Supreme',
    'Loaded with bell peppers, onions, mushrooms, and olives',
    480.00,
    true,
    4
),
(
    'Chocolate Lava Cake',
    'Decadent chocolate cake with a gooey center served with vanilla ice cream',
    250.00,
    true,
    4
);