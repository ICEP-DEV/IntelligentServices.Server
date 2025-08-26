const pool = require("../config/db");

// GET all students
exports.getStudents = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ADD new student
exports.addStudent = async (req, res) => {
  const { name, email, course } = req.body;
  try {
    await pool.query("INSERT INTO students (name, email, course) VALUES (?, ?, ?)", 
      [name, email, course]);
    res.status(201).json({ message: "Student added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE student
exports.updateStudent = async (req, res) => {
  const { id } = req.params;
  const { name, email, course } = req.body;
  try {
    await pool.query("UPDATE students SET name=?, email=?, course=? WHERE id=?", 
      [name, email, course, id]);
    res.json({ message: "Student updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE student
exports.deleteStudent = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM students WHERE id=?", [id]);
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
