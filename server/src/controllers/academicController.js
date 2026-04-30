const School = require('../models/School');
const Course = require('../models/Course');
const Specialization = require('../models/Specialization');

// ========== SCHOOLS ==========

exports.getAllSchools = async (req, res) => {
    try {
        const schools = await School.find().sort({ createdAt: -1 });
        res.json(schools);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching schools', error: error.message });
    }
};

exports.getSchoolById = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: 'School not found' });
        res.json(school);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching school', error: error.message });
    }
};

exports.createSchool = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'School name is required' });
        }
        
        // Check if school already exists
        const existingSchool = await School.findOne({ name });
        if (existingSchool) {
            return res.status(400).json({ message: 'School with this name already exists' });
        }
        
        const school = new School({ name, description });
        await school.save();
        res.status(201).json({ message: 'School created successfully', school });
    } catch (error) {
        res.status(500).json({ message: 'Error creating school', error: error.message });
    }
};

exports.updateSchool = async (req, res) => {
    try {
        const { name, description, isActive } = req.body;
        
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: 'School not found' });
        
        // Check if new name is unique (if changed)
        if (name && name !== school.name) {
            const existingSchool = await School.findOne({ name });
            if (existingSchool) {
                return res.status(400).json({ message: 'School with this name already exists' });
            }
            school.name = name;
        }
        
        if (description !== undefined) school.description = description;
        if (isActive !== undefined) school.isActive = isActive;
        
        await school.save();
        res.json({ message: 'School updated successfully', school });
    } catch (error) {
        res.status(500).json({ message: 'Error updating school', error: error.message });
    }
};

exports.deleteSchool = async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) return res.status(404).json({ message: 'School not found' });
        
        // Check if any courses depend on this school
        const courseCount = await Course.countDocuments({ schoolId: req.params.id });
        if (courseCount > 0) {
            return res.status(400).json({ message: 'Cannot delete school with associated courses' });
        }
        
        await School.findByIdAndDelete(req.params.id);
        res.json({ message: 'School deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting school', error: error.message });
    }
};

// ========== COURSES ==========

exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().populate('schoolId', 'name').sort({ createdAt: -1 });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
};

exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).populate('schoolId', 'name');
        if (!course) return res.status(404).json({ message: 'Course not found' });
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const { name, schoolId, description } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Course name is required' });
        }
        if (!schoolId) {
            return res.status(400).json({ message: 'School ID is required' });
        }
        
        // Verify school exists
        const school = await School.findById(schoolId);
        if (!school) return res.status(404).json({ message: 'School not found' });
        
        // Check if course already exists
        const existingCourse = await Course.findOne({ name });
        if (existingCourse) {
            return res.status(400).json({ message: 'Course with this name already exists' });
        }
        
        const course = new Course({ name, schoolId, description });
        await course.save();
        await course.populate('schoolId', 'name');
        
        res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const { name, schoolId, description, isActive } = req.body;
        
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        
        // Check if new name is unique (if changed)
        if (name && name !== course.name) {
            const existingCourse = await Course.findOne({ name });
            if (existingCourse) {
                return res.status(400).json({ message: 'Course with this name already exists' });
            }
            course.name = name;
        }
        
        if (schoolId) {
            const school = await School.findById(schoolId);
            if (!school) return res.status(404).json({ message: 'School not found' });
            course.schoolId = schoolId;
        }
        
        if (description !== undefined) course.description = description;
        if (isActive !== undefined) course.isActive = isActive;
        
        await course.save();
        await course.populate('schoolId', 'name');
        
        res.json({ message: 'Course updated successfully', course });
    } catch (error) {
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        
        // Check if any specializations depend on this course
        const specCount = await Specialization.countDocuments({ courseId: req.params.id });
        if (specCount > 0) {
            return res.status(400).json({ message: 'Cannot delete course with associated specializations' });
        }
        
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
};

// ========== SPECIALIZATIONS ==========

exports.getAllSpecializations = async (req, res) => {
    try {
        const specs = await Specialization.find()
            .populate({
                path: 'courseId',
                select: 'name',
                populate: { path: 'schoolId', select: 'name' }
            })
            .sort({ createdAt: -1 });
        res.json(specs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching specializations', error: error.message });
    }
};

exports.getSpecializationById = async (req, res) => {
    try {
        const spec = await Specialization.findById(req.params.id)
            .populate({
                path: 'courseId',
                select: 'name',
                populate: { path: 'schoolId', select: 'name' }
            });
        if (!spec) return res.status(404).json({ message: 'Specialization not found' });
        res.json(spec);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching specialization', error: error.message });
    }
};

exports.createSpecialization = async (req, res) => {
    try {
        const { name, courseId, description } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Specialization name is required' });
        }
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required' });
        }
        
        // Verify course exists
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found' });
        
        // Check if specialization already exists
        const existingSpec = await Specialization.findOne({ name });
        if (existingSpec) {
            return res.status(400).json({ message: 'Specialization with this name already exists' });
        }
        
        const spec = new Specialization({ name, courseId, description });
        await spec.save();
        await spec.populate({
            path: 'courseId',
            select: 'name',
            populate: { path: 'schoolId', select: 'name' }
        });
        
        res.status(201).json({ message: 'Specialization created successfully', spec });
    } catch (error) {
        res.status(500).json({ message: 'Error creating specialization', error: error.message });
    }
};

exports.updateSpecialization = async (req, res) => {
    try {
        const { name, courseId, description, isActive } = req.body;
        
        const spec = await Specialization.findById(req.params.id);
        if (!spec) return res.status(404).json({ message: 'Specialization not found' });
        
        // Check if new name is unique (if changed)
        if (name && name !== spec.name) {
            const existingSpec = await Specialization.findOne({ name });
            if (existingSpec) {
                return res.status(400).json({ message: 'Specialization with this name already exists' });
            }
            spec.name = name;
        }
        
        if (courseId) {
            const course = await Course.findById(courseId);
            if (!course) return res.status(404).json({ message: 'Course not found' });
            spec.courseId = courseId;
        }
        
        if (description !== undefined) spec.description = description;
        if (isActive !== undefined) spec.isActive = isActive;
        
        await spec.save();
        await spec.populate({
            path: 'courseId',
            select: 'name',
            populate: { path: 'schoolId', select: 'name' }
        });
        
        res.json({ message: 'Specialization updated successfully', spec });
    } catch (error) {
        res.status(500).json({ message: 'Error updating specialization', error: error.message });
    }
};

exports.deleteSpecialization = async (req, res) => {
    try {
        const spec = await Specialization.findById(req.params.id);
        if (!spec) return res.status(404).json({ message: 'Specialization not found' });
        
        await Specialization.findByIdAndDelete(req.params.id);
        res.json({ message: 'Specialization deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting specialization', error: error.message });
    }
};
