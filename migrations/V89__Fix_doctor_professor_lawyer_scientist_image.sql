-- Fix Doctor, Professor, Lawyer, Scientist special card image path
-- The file is now doctor_profesor_lawyer_scientist.webp (with "profesor" instead of "professor")
UPDATE special_cards SET image_path = 'specials/doctor_profesor_lawyer_scientist.webp' WHERE name = 'Doctor, Professor, Lawyer, Scientist';
