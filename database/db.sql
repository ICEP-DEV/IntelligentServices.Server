-- database/backup.sql
CREATE DATABASE IF NOT EXISTS student_db;

USE student_db;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  course VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (name, email, course)
VALUES 
("Alice Johnson", "alice@example.com", "Computer Science"),
("Bob Smith", "bob@example.com", "Mathematics");
