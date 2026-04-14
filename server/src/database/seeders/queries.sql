INSERT INTO students 
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
    'Vendor User',
    'Vendor Owner',
    'vendor@quickbite.com',
    '$2b$10$dummyhashedpassword123456789',
    'vendor',
    NULL,
    1
);