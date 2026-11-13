import json
import logging
from sqlalchemy.orm import Session
from app.models.mock_test import MockTest, MockTestCategory, MockTestType
from app.utils.timezone import now_utc

logger = logging.getLogger(__name__)

INITIAL_CATEGORIES = [
    {
        "name": "School Examinations",
        "slug": "school-examinations",
        "description": "Standard board examinations practice covering Class 11 and Class 12 Science and STEM curriculum.",
        "category_type": "school",
        "subcategories": [
            "Class 11 - Physics",
            "Class 11 - Chemistry",
            "Class 11 - Mathematics",
            "Class 11 - Biology",
            "Class 11 - English",
            "Class 11 - Computer Science",
            "Class 12 - Physics",
            "Class 12 - Chemistry",
            "Class 12 - Mathematics",
            "Class 12 - Biology",
            "Class 12 - English",
            "Class 12 - Computer Science"
        ],
        "display_order": 1
    },
    {
        "name": "Engineering Entrance Examinations",
        "slug": "engineering-entrance",
        "description": "National level engineering entrance competitive exams including JEE Main and JEE Advanced full syllabus.",
        "category_type": "engineering_entrance",
        "subcategories": [
            "JEE Main - Physics",
            "JEE Main - Chemistry",
            "JEE Main - Mathematics",
            "JEE Main - PCM Practice",
            "JEE Advanced - PCM Practice"
        ],
        "display_order": 2
    },
    {
        "name": "Engineering Branch Examinations",
        "slug": "engineering-branch",
        "description": "Undergraduate core engineering curriculum assessments across Computer Science, IT, Mechanical, Civil, ECE, and EEE.",
        "category_type": "engineering_branch",
        "subcategories": [
            "Computer Science Engineering (CSE)",
            "Information Technology (IT)",
            "Mechanical Engineering (ME)",
            "Civil Engineering (CE)",
            "Electrical & Electronics (EEE)",
            "Electronics & Communication (ECE)"
        ],
        "display_order": 3
    },
    {
        "name": "Other Competitive Examinations",
        "slug": "other-competitive",
        "description": "General aptitude, analytical reasoning, and recruitment entrance assessments.",
        "category_type": "competitive",
        "subcategories": [
            "Quantitative Foundations",
            "Logical & Analytical Reasoning",
            "Verbal Aptitude & Reading Comprehension"
        ],
        "display_order": 4
    },
    {
        "name": "Corporate Placement Tests",
        "slug": "corporate-placement",
        "description": "Corporate recruitment tests for TCS, Infosys, HCLTech, Wipro, Accenture.",
        "category_type": "corporate",
        "subcategories": [
            "TCS NQT",
            "Infosys DSE",
            "HCLTech First Careers",
            "Wipro Elite",
            "Accenture Digital"
        ],
        "display_order": 5
    }
]

INITIAL_TEST_TYPES = [
    {
        "name": "Full-Length Mock Test",
        "slug": "full-length-mock",
        "description": "Complete examination simulation replicating the actual exam duration, question count, marking scheme, and full syllabus.",
        "icon": "Layers",
        "badge_color": "blue",
        "requires_chapter": False,
        "requires_topic": False,
        "requires_pyq_metadata": False,
        "requires_section": False,
        "is_speed_test": False,
        "is_practice": False,
        "display_order": 1
    },
    {
        "name": "Chapter-Wise Test",
        "slug": "chapter-wise",
        "description": "Focused evaluation on a single chapter to master foundational concepts before advancing to full-length mocks.",
        "icon": "BookOpen",
        "badge_color": "emerald",
        "requires_chapter": True,
        "requires_topic": False,
        "requires_pyq_metadata": False,
        "requires_section": False,
        "is_speed_test": False,
        "is_practice": False,
        "display_order": 2
    },
    {
        "name": "Topic-Wise Test",
        "slug": "topic-wise",
        "description": "Deep-dive assessment targeted at a specific micro-concept or mathematical theorem.",
        "icon": "Sparkles",
        "badge_color": "purple",
        "requires_chapter": True,
        "requires_topic": True,
        "requires_pyq_metadata": False,
        "requires_section": False,
        "is_speed_test": False,
        "is_practice": False,
        "display_order": 3
    },
    {
        "name": "Subject-Wise Test",
        "slug": "subject-wise",
        "description": "Broad assessment covering the entire subject curriculum across all chapters.",
        "icon": "GraduationCap",
        "badge_color": "indigo",
        "requires_chapter": False,
        "requires_topic": False,
        "requires_pyq_metadata": False,
        "requires_section": False,
        "is_speed_test": False,
        "is_practice": False,
        "display_order": 4
    },
    {
        "name": "Previous Year Question (PYQ) Test",
        "slug": "pyq-test",
        "description": "Authentic previous year question papers tagged with examination year, shift, and official authority source.",
        "icon": "Award",
        "badge_color": "amber",
        "requires_chapter": False,
        "requires_topic": False,
        "requires_pyq_metadata": True,
        "requires_section": False,
        "is_speed_test": False,
        "is_practice": False,
        "display_order": 5
    },
    {
        "name": "Speed Test",
        "slug": "speed-test",
        "description": "High-intensity, rapid-fire assessment designed to maximize question-solving speed and accuracy under strict time pressure.",
        "icon": "Zap",
        "badge_color": "rose",
        "requires_chapter": False,
        "requires_topic": False,
        "requires_pyq_metadata": False,
        "requires_section": False,
        "is_speed_test": True,
        "is_practice": False,
        "display_order": 6
    },
    {
        "name": "Practice Test",
        "slug": "practice-test",
        "description": "Relaxed, self-paced learning mode with optional timer and instant educational explanations after each question.",
        "icon": "Lightbulb",
        "badge_color": "teal",
        "requires_chapter": False,
        "requires_topic": False,
        "requires_pyq_metadata": False,
        "requires_section": False,
        "is_speed_test": False,
        "is_practice": True,
        "display_order": 7
    },
    {
        "name": "Diagnostic / Assessment Test",
        "slug": "diagnostic-test",
        "description": "Calibrated diagnostic exam evaluating strengths and knowledge gaps to formulate targeted study plans.",
        "icon": "Activity",
        "badge_color": "cyan",
        "requires_chapter": False,
        "requires_topic": False,
        "requires_pyq_metadata": False,
        "requires_section": False,
        "is_speed_test": False,
        "is_practice": False,
        "display_order": 8
    },
    {
        "name": "Sectional Test",
        "slug": "sectional-test",
        "description": "Section-specific test targeting individual modules (e.g. Quantitative, Organic Chemistry, or Mechanics).",
        "icon": "Columns",
        "badge_color": "orange",
        "requires_chapter": False,
        "requires_topic": False,
        "requires_pyq_metadata": False,
        "requires_section": True,
        "is_speed_test": False,
        "is_practice": False,
        "display_order": 9
    },
    {
        "name": "Revision Test",
        "slug": "revision-test",
        "description": "Comprehensive review test consolidating previously completed chapters and high-yield question patterns.",
        "icon": "RotateCcw",
        "badge_color": "violet",
        "requires_chapter": True,
        "requires_topic": False,
        "requires_pyq_metadata": False,
        "requires_section": False,
        "is_speed_test": False,
        "is_practice": False,
        "display_order": 10
    }
]

SAMPLE_ACADEMIC_MOCK_TESTS = [
    {
        "title": "Class 11 Physics – Full Syllabus Foundation",
        "description": "Comprehensive Class 11 CBSE / ISC Physics mock test covering Physical World, Kinematics, Laws of Motion, Work Energy Power, Rotational Dynamics, Gravitation, Bulk Matter, Thermodynamics, and Waves.",
        "category": "School Examinations",
        "category_slug": "school-examinations",
        "subcategory": "Class 11 - Physics",
        "class_level": "Class 11",
        "subject": "Physics",
        "exam_type": "School Board",
        "difficulty": "Medium",
        "language": "English",
        "visibility_target": "all",
        "target_class": "Class 11",
        "status": "published",
        "price_inr": 0,
        "duration_minutes": 60,
        "total_questions": 50,
        "total_marks": 50.0,
        "marks_per_question": 1.0,
        "negative_marking": 0.0,
        "passing_marks": 20.0,
        "pass_percentage": 40,
        "display_order": 1,
        "instructions": "1. Test duration is 60 minutes. 2. Contains 50 single-correct multiple-choice questions. 3. Each correct answer is awarded 1.0 mark. 4. There is NO negative marking. 5. Attempt all questions systematically.",
        "questions": [
  {
    "id": "p11_q1",
    "question": "Which of the following is NOT a fundamental SI unit?",
    "options": [
      "Kilogram",
      "Candela",
      "Newton",
      "Kelvin"
    ],
    "correct_answer": "C",
    "domain": "Units & Measurements",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Newton is a derived unit of force (kg\u00b7m/s^2), whereas Kilogram, Candela, and Kelvin are fundamental base units."
  },
  {
    "id": "p11_q2",
    "question": "The dimensions of Planck's constant (h) are identical to those of:",
    "options": [
      "Linear momentum",
      "Angular momentum",
      "Work",
      "Power"
    ],
    "correct_answer": "B",
    "domain": "Dimensional Analysis",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Planck's constant has dimensions [M L^2 T^-1], which is identical to angular momentum (L = r x p)."
  },
  {
    "id": "p11_q3",
    "question": "If the percentage error in measuring the radius of a sphere is 2%, the error in calculating its volume is:",
    "options": [
      "2%",
      "4%",
      "6%",
      "8%"
    ],
    "correct_answer": "C",
    "domain": "Errors & Measurements",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Volume V = (4/3)\u03c0r^3. The fractional error is 3 * (\u0394r/r), so 3 * 2% = 6%."
  },
  {
    "id": "p11_q4",
    "question": "Which of the following pairs has identical dimensional formulas?",
    "options": [
      "Work and Torque",
      "Force and Pressure",
      "Impulse and Surface Tension",
      "Stress and Strain"
    ],
    "correct_answer": "A",
    "domain": "Dimensional Analysis",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Both Work and Torque share the dimensional formula [M L^2 T^-2]."
  },
  {
    "id": "p11_q5",
    "question": "The number of significant figures in 0.00340 is:",
    "options": [
      "2",
      "3",
      "4",
      "5"
    ],
    "correct_answer": "B",
    "domain": "Measurements",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Leading zeros are not significant, but trailing zeros after the decimal point are significant, giving 3 significant figures."
  },
  {
    "id": "p11_q6",
    "question": "A particle moves such that displacement x = 3t^2 + 2t + 5. Its acceleration at t = 2 s is:",
    "options": [
      "6 m/s^2",
      "12 m/s^2",
      "14 m/s^2",
      "18 m/s^2"
    ],
    "correct_answer": "A",
    "domain": "Kinematics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Velocity v = dx/dt = 6t + 2. Acceleration a = dv/dt = 6 m/s^2 (constant)."
  },
  {
    "id": "p11_q7",
    "question": "At the maximum height of a projectile launched at angle \u03b8, which quantity is non-zero?",
    "options": [
      "Vertical velocity",
      "Horizontal velocity",
      "Acceleration",
      "Both Horizontal velocity and Acceleration"
    ],
    "correct_answer": "D",
    "domain": "Projectile Motion",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "At apex, vertical velocity is 0, but horizontal velocity (u cos \u03b8) and gravitational acceleration (g downwards) remain non-zero."
  },
  {
    "id": "p11_q8",
    "question": "The range of a projectile on level ground is maximum when the angle of projection \u03b8 is:",
    "options": [
      "30\u00b0",
      "45\u00b0",
      "60\u00b0",
      "90\u00b0"
    ],
    "correct_answer": "B",
    "domain": "Projectile Motion",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Range R = (u^2 sin 2\u03b8)/g. Maximum occurs when sin 2\u03b8 = 1 -> \u03b8 = 45\u00b0."
  },
  {
    "id": "p11_q9",
    "question": "The area under an acceleration-time graph represents:",
    "options": [
      "Displacement",
      "Distance traveled",
      "Change in velocity",
      "Impulse"
    ],
    "correct_answer": "C",
    "domain": "Kinematics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "The integral of acceleration over time \u222b a dt equals the change in velocity \u0394v."
  },
  {
    "id": "p11_q10",
    "question": "A body thrown vertically upwards reaches maximum height H. The ratio of time of ascent to time of descent is:",
    "options": [
      "1 : 1",
      "1 : 2",
      "1 : \u221a2",
      "2 : 1"
    ],
    "correct_answer": "A",
    "domain": "Kinematics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Neglecting air drag, time of ascent equals time of descent, yielding a ratio of 1 : 1."
  },
  {
    "id": "p11_q11",
    "question": "In uniform circular motion, the acceleration vector points:",
    "options": [
      "Tangential to path",
      "Radially inward towards center",
      "Radially outward",
      "Zero"
    ],
    "correct_answer": "B",
    "domain": "Circular Motion",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Uniform circular motion has centripetal acceleration pointing strictly inward toward the rotation center."
  },
  {
    "id": "p11_q12",
    "question": "A rocket works on the fundamental principle of conservation of:",
    "options": [
      "Energy",
      "Linear momentum",
      "Angular momentum",
      "Mass"
    ],
    "correct_answer": "B",
    "domain": "Laws of Motion",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "High-velocity exhaust gas expulsion provides forward thrust via conservation of linear momentum."
  },
  {
    "id": "p11_q13",
    "question": "A 5 kg block rests on a horizontal surface with static friction coefficient \u03bc = 0.4. Limiting friction is: (g = 10 m/s^2)",
    "options": [
      "10 N",
      "15 N",
      "20 N",
      "25 N"
    ],
    "correct_answer": "C",
    "domain": "Friction",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Limiting friction f = \u03bc N = \u03bc m g = 0.4 * 5 * 10 = 20 N."
  },
  {
    "id": "p11_q14",
    "question": "Impulse imparted to a body equals its:",
    "options": [
      "Rate of change of momentum",
      "Change in momentum",
      "Change in kinetic energy",
      "Force times velocity"
    ],
    "correct_answer": "B",
    "domain": "Laws of Motion",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Impulse J = F * \u0394t = \u0394p, which is the total change in momentum."
  },
  {
    "id": "p11_q15",
    "question": "When a horse pulls a cart, the forward force propelling the horse is exerted by:",
    "options": [
      "The cart on horse",
      "The ground on horse",
      "The horse on ground",
      "The horse on cart"
    ],
    "correct_answer": "B",
    "domain": "Newton's Laws",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "By Newton's Third Law, the ground exerts an equal and opposite forward reaction force on the horse's feet."
  },
  {
    "id": "p11_q16",
    "question": "An accelerated frame of reference is classified as an:",
    "options": [
      "Inertial frame",
      "Non-inertial frame",
      "Absolute frame",
      "Geocentric frame"
    ],
    "correct_answer": "B",
    "domain": "Frames of Reference",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "An accelerated coordinate system is a non-inertial frame where pseudo forces must be applied."
  },
  {
    "id": "p11_q17",
    "question": "Force F = (3i + 4j) N displaces a body by s = (2i + 5j) m. Total work done is:",
    "options": [
      "22 J",
      "26 J",
      "28 J",
      "30 J"
    ],
    "correct_answer": "B",
    "domain": "Work & Energy",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "W = F \u00b7 s = (3*2) + (4*5) = 6 + 20 = 26 Joules."
  },
  {
    "id": "p11_q18",
    "question": "In an elastic collision in one dimension, which quantities are conserved?",
    "options": [
      "Only kinetic energy",
      "Only linear momentum",
      "Both linear momentum and kinetic energy",
      "Neither"
    ],
    "correct_answer": "C",
    "domain": "Collisions",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Elastic collisions are defined by the conservation of both total linear momentum and total kinetic energy."
  },
  {
    "id": "p11_q19",
    "question": "If momentum increases by 50%, kinetic energy increases by approximately:",
    "options": [
      "50%",
      "100%",
      "125%",
      "225%"
    ],
    "correct_answer": "C",
    "domain": "Work & Energy",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "K = p^2 / 2m. If p becomes 1.5p, K becomes 2.25 K, representing an increase of 125%."
  },
  {
    "id": "p11_q20",
    "question": "A spring stretched by x has potential energy U. When stretched by 2x, its potential energy is:",
    "options": [
      "2U",
      "3U",
      "4U",
      "8U"
    ],
    "correct_answer": "C",
    "domain": "Potential Energy",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "U = (1/2) k x^2. Doubling displacement quadruples the stored potential energy to 4U."
  },
  {
    "id": "p11_q21",
    "question": "One kilowatt-hour (1 kWh) of electrical energy equals:",
    "options": [
      "3.6 x 10^3 J",
      "3.6 x 10^5 J",
      "3.6 x 10^6 J",
      "3.6 x 10^8 J"
    ],
    "correct_answer": "C",
    "domain": "Power",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "1 kWh = 1000 W * 3600 s = 3.6 x 10^6 Joules."
  },
  {
    "id": "p11_q22",
    "question": "The moment of inertia of a solid cylinder of mass M and radius R about its longitudinal axis is:",
    "options": [
      "MR^2",
      "(1/2) MR^2",
      "(2/5) MR^2",
      "(1/4) MR^2"
    ],
    "correct_answer": "B",
    "domain": "Rotational Dynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "The moment of inertia of a uniform solid cylinder about its central longitudinal axis is (1/2) M R^2."
  },
  {
    "id": "p11_q23",
    "question": "The rotational analogue of mass in linear motion is:",
    "options": [
      "Torque",
      "Angular velocity",
      "Moment of Inertia",
      "Angular Momentum"
    ],
    "correct_answer": "C",
    "domain": "Rotational Dynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Moment of inertia measures rotational inertia, analogous to mass in linear mechanics."
  },
  {
    "id": "p11_q24",
    "question": "When an ice skater draws in her arms, her spin rate increases due to conservation of:",
    "options": [
      "Energy",
      "Linear momentum",
      "Angular momentum",
      "Torque"
    ],
    "correct_answer": "C",
    "domain": "Angular Momentum",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "With zero external torque, pulling arms inward reduces moment of inertia I, increasing angular speed \u03c9 so L = I\u03c9 remains constant."
  },
  {
    "id": "p11_q25",
    "question": "A solid sphere and a hollow sphere of identical mass and radius roll down an incline. Which reaches the bottom first?",
    "options": [
      "Hollow sphere",
      "Solid sphere",
      "Both simultaneously",
      "Depends on incline angle"
    ],
    "correct_answer": "B",
    "domain": "Rolling Motion",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "The solid sphere has a smaller moment of inertia ((2/5)MR^2 vs (2/3)MR^2), yielding greater linear acceleration."
  },
  {
    "id": "p11_q26",
    "question": "Torque vector \u03c4 is mathematically defined as:",
    "options": [
      "F x v",
      "r x F",
      "m x a",
      "r x v"
    ],
    "correct_answer": "B",
    "domain": "Rotational Dynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Torque is the cross product of the position vector and force: \u03c4 = r x F."
  },
  {
    "id": "p11_q27",
    "question": "Acceleration due to gravity g is maximum at:",
    "options": [
      "The Equator",
      "The Poles",
      "The Earth's core",
      "Height equal to Earth radius"
    ],
    "correct_answer": "B",
    "domain": "Gravitation",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Due to Earth's polar flattening and absence of centrifugal force at poles, g is highest at the poles."
  },
  {
    "id": "p11_q28",
    "question": "The escape velocity from the surface of Earth (radius R, gravity g) is:",
    "options": [
      "\u221a(gR)",
      "\u221a(2gR)",
      "2\u221a(gR)",
      "\u221a(gR/2)"
    ],
    "correct_answer": "B",
    "domain": "Gravitation",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Escape velocity is given by v_e = \u221a(2GM/R) = \u221a(2gR) \u2248 11.2 km/s."
  },
  {
    "id": "p11_q29",
    "question": "Kepler's Second Law (Law of Areas) directly demonstrates conservation of:",
    "options": [
      "Linear momentum",
      "Angular momentum",
      "Total energy",
      "Mass"
    ],
    "correct_answer": "B",
    "domain": "Kepler's Laws",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Because gravity is a central force exerting zero torque, areal velocity dA/dt = L / 2m is constant."
  },
  {
    "id": "p11_q30",
    "question": "If the distance between Earth and Sun is doubled, the gravitational attraction becomes:",
    "options": [
      "Double",
      "Half",
      "One-fourth",
      "Four times"
    ],
    "correct_answer": "C",
    "domain": "Gravitation",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "By the inverse-square law F \u221d 1/r^2, doubling distance reduces gravitational force to (1/2)^2 = 1/4."
  },
  {
    "id": "p11_q31",
    "question": "The orbital period of a geostationary satellite is:",
    "options": [
      "12 hours",
      "24 hours",
      "48 hours",
      "365 days"
    ],
    "correct_answer": "B",
    "domain": "Gravitation",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "A geostationary orbit matches Earth's sidereal rotation period of 24 hours directly above the equator."
  },
  {
    "id": "p11_q32",
    "question": "Hooke's Law (stress proportional to strain) strictly holds up to the:",
    "options": [
      "Elastic limit",
      "Proportionality limit",
      "Yield point",
      "Breaking point"
    ],
    "correct_answer": "B",
    "domain": "Elasticity",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Hooke's linear relation holds specifically up to the limit of proportionality."
  },
  {
    "id": "p11_q33",
    "question": "The SI unit of surface tension is:",
    "options": [
      "N/m",
      "N\u00b7m",
      "N/m^2",
      "J/m"
    ],
    "correct_answer": "A",
    "domain": "Fluids",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Surface tension is force per unit length along a surface line: N/m."
  },
  {
    "id": "p11_q34",
    "question": "Bernoulli's theorem for fluid flow represents the conservation of:",
    "options": [
      "Mass",
      "Momentum",
      "Energy",
      "Angular momentum"
    ],
    "correct_answer": "C",
    "domain": "Fluid Dynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Bernoulli's equation expresses the conservation of mechanical energy per unit volume in streamline non-viscous flow."
  },
  {
    "id": "p11_q35",
    "question": "When two connected soap bubbles have different radii, what occurs?",
    "options": [
      "Air flows from smaller to larger bubble",
      "Air flows from larger to smaller bubble",
      "Both reach identical size",
      "No flow occurs"
    ],
    "correct_answer": "A",
    "domain": "Surface Tension",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Excess pressure inside a soap bubble is \u0394P = 4T/r. The smaller bubble has higher pressure and empties into the larger one."
  },
  {
    "id": "p11_q36",
    "question": "The terminal velocity v_t of a sphere falling in a viscous fluid depends on radius r as:",
    "options": [
      "r",
      "r^2",
      "1/r",
      "r^3"
    ],
    "correct_answer": "B",
    "domain": "Viscosity",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "By Stokes' Law, terminal velocity v_t = (2/9)(r^2 g (\u03c1 - \u03c3))/\u03b7, proportional to r^2."
  },
  {
    "id": "p11_q37",
    "question": "The Zeroth Law of Thermodynamics enables the formal definition of:",
    "options": [
      "Internal energy",
      "Work",
      "Temperature",
      "Entropy"
    ],
    "correct_answer": "C",
    "domain": "Thermodynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Thermal equilibrium transitivity in the Zeroth Law establishes the thermodynamic scale of temperature."
  },
  {
    "id": "p11_q38",
    "question": "In an ideal gas adiabatic process, which relation is invariant?",
    "options": [
      "T * V",
      "P * T",
      "P * V^\u03b3",
      "P * V"
    ],
    "correct_answer": "C",
    "domain": "Thermodynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "For a reversible adiabatic process with no heat exchange (dQ = 0), P * V^\u03b3 = constant."
  },
  {
    "id": "p11_q39",
    "question": "The efficiency of a Carnot heat engine operating between temperatures T1 (hot) and T2 (cold) is:",
    "options": [
      "1 - (T2/T1)",
      "1 - (T1/T2)",
      "T2 / T1",
      "(T1 - T2) / T2"
    ],
    "correct_answer": "A",
    "domain": "Thermodynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Carnot efficiency \u03b7 = 1 - (T_sink / T_source) = 1 - (T2 / T1)."
  },
  {
    "id": "p11_q40",
    "question": "The First Law of Thermodynamics is an explicit statement of:",
    "options": [
      "Momentum conservation",
      "Energy conservation",
      "Mass conservation",
      "Entropy increase"
    ],
    "correct_answer": "B",
    "domain": "Thermodynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "dQ = dU + dW expresses total energy conservation across heat, internal energy, and work."
  },
  {
    "id": "p11_q41",
    "question": "The mean translational kinetic energy of an ideal gas molecule at temperature T is:",
    "options": [
      "(1/2) k_B T",
      "(3/2) k_B T",
      "3 k_B T",
      "(5/2) k_B T"
    ],
    "correct_answer": "B",
    "domain": "Kinetic Theory",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Three translational degrees of freedom provide 3 * (1/2) k_B T = (3/2) k_B T."
  },
  {
    "id": "p11_q42",
    "question": "For a monoatomic gas, the heat capacity ratio \u03b3 = Cp / Cv is approximately:",
    "options": [
      "1.33",
      "1.40",
      "1.67",
      "1.25"
    ],
    "correct_answer": "C",
    "domain": "Kinetic Theory",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "For degrees of freedom f = 3, \u03b3 = 1 + (2/3) = 5/3 \u2248 1.67."
  },
  {
    "id": "p11_q43",
    "question": "During an isothermal expansion of an ideal gas, the change in internal energy \u0394U is:",
    "options": [
      "Positive",
      "Negative",
      "Zero",
      "Dependent on volume"
    ],
    "correct_answer": "C",
    "domain": "Thermodynamics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Internal energy of an ideal gas depends solely on temperature. At constant temperature, \u0394U = 0."
  },
  {
    "id": "p11_q44",
    "question": "In simple harmonic motion, the restoring force is proportional to:",
    "options": [
      "Velocity",
      "Displacement",
      "Displacement squared",
      "Acceleration"
    ],
    "correct_answer": "B",
    "domain": "SHM",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "SHM restoring force follows Hooke's relation F = -k x, directly proportional to displacement from equilibrium."
  },
  {
    "id": "p11_q45",
    "question": "The period of a simple pendulum on Earth depends on:",
    "options": [
      "Bob mass",
      "Oscillation amplitude",
      "Pendulum length",
      "Bob material"
    ],
    "correct_answer": "C",
    "domain": "Oscillations",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "T = 2\u03c0 \u221a(L/g), depending exclusively on effective length L and gravitational field g."
  },
  {
    "id": "p11_q46",
    "question": "When a wave refracts into a new medium, which parameter stays strictly constant?",
    "options": [
      "Wavelength",
      "Velocity",
      "Frequency",
      "Wave amplitude"
    ],
    "correct_answer": "C",
    "domain": "Wave Mechanics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Frequency is fixed by the oscillating source and remains invariant across media boundaries."
  },
  {
    "id": "p11_q47",
    "question": "Sound waves cannot propagate through:",
    "options": [
      "Water",
      "Air",
      "Steel",
      "Vacuum"
    ],
    "correct_answer": "D",
    "domain": "Acoustics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Sound is a mechanical longitudinal wave requiring a physical material medium for elastic propagation."
  },
  {
    "id": "p11_q48",
    "question": "The speed of sound in an ideal gas depends primarily on its:",
    "options": [
      "Ambient pressure",
      "Absolute temperature",
      "Container volume",
      "Wave frequency"
    ],
    "correct_answer": "B",
    "domain": "Wave Mechanics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "v = \u221a(\u03b3RT / M). At constant temperature, pressure changes cancel density changes, so speed depends only on temperature T."
  },
  {
    "id": "p11_q49",
    "question": "Tuning forks of frequencies 256 Hz and 260 Hz sounded together produce a beat frequency of:",
    "options": [
      "2 Hz",
      "4 Hz",
      "6 Hz",
      "8 Hz"
    ],
    "correct_answer": "B",
    "domain": "Acoustics",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Beat frequency is the absolute difference: |260 - 256| = 4 Hz."
  },
  {
    "id": "p11_q50",
    "question": "In a stationary wave, the separation between two adjacent nodes is:",
    "options": [
      "\u03bb",
      "\u03bb / 2",
      "\u03bb / 4",
      "2\u03bb"
    ],
    "correct_answer": "B",
    "domain": "Standing Waves",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Successive nodal points of destructive interference are separated by exactly half a wavelength: \u03bb / 2."
  }
]
    },
    {
        "title": "Class 12 Mathematics – Board & Competitive Prep",
        "description": "Full-scale Class 12 Higher Mathematics assessment covering Relations & Functions, Matrices, Determinants, Calculus (Continuity, Differentiability, Integrals), Differential Equations, Vectors, and 3D Geometry.",
        "category": "School Examinations",
        "category_slug": "school-examinations",
        "subcategory": "Class 12 - Mathematics",
        "class_level": "Class 12",
        "subject": "Mathematics",
        "exam_type": "School Board",
        "difficulty": "Hard",
        "language": "English",
        "visibility_target": "all",
        "target_class": "Class 12",
        "status": "published",
        "price_inr": 0,
        "duration_minutes": 90,
        "total_questions": 50,
        "total_marks": 100.0,
        "marks_per_question": 2.0,
        "negative_marking": 0.0,
        "passing_marks": 40.0,
        "pass_percentage": 40,
        "display_order": 2,
        "instructions": "1. Total duration is 90 minutes. 2. Contains 50 multiple choice questions. 3. Each question carries 2.0 marks (Total 100 marks). 4. No negative marking. 5. Keep paper and pencil ready for algebraic calculations.",
        "questions": [
  {
    "id": "m12_q1",
    "question": "Let R be a relation on set A = {1, 2, 3} defined by R = {(1, 1), (2, 2), (3, 3), (1, 2), (2, 1)}. R is:",
    "options": [
      "Reflexive and symmetric only",
      "Reflexive, symmetric, and transitive (Equivalence)",
      "Symmetric and transitive only",
      "Reflexive only"
    ],
    "correct_answer": "B",
    "domain": "Relations & Functions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "R contains all (a, a), is symmetric ((1, 2) and (2, 1) in R), and transitive ((1, 2) and (2, 1) -> (1, 1) in R). Thus R is an equivalence relation."
  },
  {
    "id": "m12_q2",
    "question": "If f: R -> R is defined by f(x) = 3 - 4x, then f is:",
    "options": [
      "One-one and onto (Bijective)",
      "One-one but not onto",
      "Onto but not one-one",
      "Neither one-one nor onto"
    ],
    "correct_answer": "A",
    "domain": "Functions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "f(x1) = f(x2) -> 3 - 4x1 = 3 - 4x2 -> x1 = x2 (injective). For any y in R, x = (3 - y)/4 in R (surjective). Hence f is bijective."
  },
  {
    "id": "m12_q3",
    "question": "The principal value branch of sin^-1(x) is:",
    "options": [
      "[-\u03c0/2, \u03c0/2]",
      "[0, \u03c0]",
      "(-\u03c0/2, \u03c0/2)",
      "[0, \u03c0/2]"
    ],
    "correct_answer": "A",
    "domain": "Inverse Trigonometry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "The standard principal value branch for arcsine is the closed interval [-\u03c0/2, \u03c0/2]."
  },
  {
    "id": "m12_q4",
    "question": "The principal value of cos^-1(-1/2) is:",
    "options": [
      "\u03c0/3",
      "2\u03c0/3",
      "4\u03c0/3",
      "-\u03c0/3"
    ],
    "correct_answer": "B",
    "domain": "Inverse Trigonometry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "For cos^-1(-x) = \u03c0 - cos^-1(x) = \u03c0 - \u03c0/3 = 2\u03c0/3, which lies in [0, \u03c0]."
  },
  {
    "id": "m12_q5",
    "question": "The value of tan(sin^-1(3/5) + cos^-1(3/5)) is:",
    "options": [
      "0",
      "1",
      "Undefined (Infinity)",
      "1/2"
    ],
    "correct_answer": "C",
    "domain": "Inverse Trigonometry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "sin^-1(x) + cos^-1(x) = \u03c0/2. tan(\u03c0/2) is undefined (approaches infinity)."
  },
  {
    "id": "m12_q6",
    "question": "The domain of the function f(x) = sin^-1(2x - 1) is:",
    "options": [
      "[0, 1]",
      "[-1, 1]",
      "[-1, 0]",
      "[0, 2]"
    ],
    "correct_answer": "A",
    "domain": "Inverse Trigonometry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "-1 <= 2x - 1 <= 1 -> 0 <= 2x <= 2 -> 0 <= x <= 1."
  },
  {
    "id": "m12_q7",
    "question": "Let f: [0, \u221e) -> [0, \u221e) be defined by f(x) = x^2. The function f is:",
    "options": [
      "Injective and surjective",
      "Injective but not surjective",
      "Surjective but not injective",
      "Neither"
    ],
    "correct_answer": "A",
    "domain": "Functions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Over non-negative reals, x^2 is strictly increasing (one-one) and covers all non-negative reals as outputs (onto)."
  },
  {
    "id": "m12_q8",
    "question": "If * is a binary operation on R defined by a * b = a + b + ab, the identity element is:",
    "options": [
      "1",
      "0",
      "-1",
      "None"
    ],
    "correct_answer": "B",
    "domain": "Binary Operations",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "a * e = a + e + ae = a -> e(1 + a) = 0 for all a -> e = 0."
  },
  {
    "id": "m12_q9",
    "question": "The value of sin(2 sin^-1(0.6)) is:",
    "options": [
      "0.48",
      "0.96",
      "0.80",
      "0.64"
    ],
    "correct_answer": "B",
    "domain": "Inverse Trigonometry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Let \u03b8 = sin^-1(0.6) -> sin \u03b8 = 0.6, cos \u03b8 = 0.8. sin(2\u03b8) = 2 sin \u03b8 cos \u03b8 = 2 * 0.6 * 0.8 = 0.96."
  },
  {
    "id": "m12_q10",
    "question": "If f(x) = (4x + 3) / (6x - 4), x != 2/3, then f(f(x)) equals:",
    "options": [
      "x",
      "1/x",
      "x^2",
      "-x"
    ],
    "correct_answer": "A",
    "domain": "Composite Functions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Substituting f(x) into f yields [4((4x+3)/(6x-4)) + 3] / [6((4x+3)/(6x-4)) - 4] = (34x) / 34 = x."
  },
  {
    "id": "m12_q11",
    "question": "If a matrix A has order 3 x 4 and B has order 4 x 2, the order of matrix AB is:",
    "options": [
      "3 x 2",
      "4 x 4",
      "3 x 4",
      "2 x 3"
    ],
    "correct_answer": "A",
    "domain": "Matrices",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Multiplication of (m x k) with (k x n) yields a matrix of dimensions (m x n) = (3 x 2)."
  },
  {
    "id": "m12_q12",
    "question": "For any square matrix A, A + A^T is always a:",
    "options": [
      "Symmetric matrix",
      "Skew-symmetric matrix",
      "Diagonal matrix",
      "Scalar matrix"
    ],
    "correct_answer": "A",
    "domain": "Matrices",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "(A + A^T)^T = A^T + (A^T)^T = A^T + A = A + A^T, which proves it is symmetric."
  },
  {
    "id": "m12_q13",
    "question": "If A is a square matrix of order 3 such that |A| = 5, then |adj A| equals:",
    "options": [
      "5",
      "25",
      "125",
      "1/5"
    ],
    "correct_answer": "B",
    "domain": "Determinants",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "|adj A| = |A|^(n - 1). For order n = 3, |adj A| = 5^(3 - 1) = 5^2 = 25."
  },
  {
    "id": "m12_q14",
    "question": "If A is a skew-symmetric matrix of odd order, then its determinant |A| is:",
    "options": [
      "1",
      "-1",
      "0",
      "Any real number"
    ],
    "correct_answer": "C",
    "domain": "Determinants",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "A^T = -A -> |A^T| = |-A| = (-1)^n |A|. Since n is odd, |A| = -|A| -> 2|A| = 0 -> |A| = 0."
  },
  {
    "id": "m12_q15",
    "question": "If A is an invertible matrix of order 2, then det(A^-1) is equal to:",
    "options": [
      "det(A)",
      "1 / det(A)",
      "1",
      "0"
    ],
    "correct_answer": "B",
    "domain": "Determinants",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "A * A^-1 = I -> det(A) * det(A^-1) = det(I) = 1 -> det(A^-1) = 1 / det(A)."
  },
  {
    "id": "m12_q16",
    "question": "The trace of a square matrix is defined as the:",
    "options": [
      "Determinant of the matrix",
      "Sum of principal diagonal elements",
      "Product of diagonal elements",
      "Sum of all row elements"
    ],
    "correct_answer": "B",
    "domain": "Matrices",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Trace tr(A) = sum of the diagonal entries a_ii from i = 1 to n."
  },
  {
    "id": "m12_q17",
    "question": "If A = [[cos \u03b8, -sin \u03b8], [sin \u03b8, cos \u03b8]], then A is an:",
    "options": [
      "Orthogonal matrix",
      "Idempotent matrix",
      "Nilpotent matrix",
      "Involutory matrix"
    ],
    "correct_answer": "A",
    "domain": "Matrices",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "A * A^T = [[cos^2 \u03b8 + sin^2 \u03b8, 0], [0, sin^2 \u03b8 + cos^2 \u03b8]] = I, proving A is orthogonal."
  },
  {
    "id": "m12_q18",
    "question": "If a system of linear equations AX = B has a unique solution, then:",
    "options": [
      "|A| = 0",
      "|A| != 0",
      "|A| = |B|",
      "A is singular"
    ],
    "correct_answer": "B",
    "domain": "Linear Systems",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "A system AX = B has a unique solution if and only if matrix A is non-singular, meaning det(A) != 0."
  },
  {
    "id": "m12_q19",
    "question": "The minor of element a_22 in [[1, 2, 3], [0, 4, 5], [1, 0, 6]] is:",
    "options": [
      "3",
      "6",
      "3",
      "3"
    ],
    "correct_answer": "A",
    "domain": "Determinants",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Deleting row 2 and col 2 leaves [[1, 3], [1, 6]]. Minor M_22 = (1*6) - (3*1) = 6 - 3 = 3."
  },
  {
    "id": "m12_q20",
    "question": "If A is a matrix of order 3 and k is a scalar, then det(kA) is:",
    "options": [
      "k det(A)",
      "k^2 det(A)",
      "k^3 det(A)",
      "det(A) / k"
    ],
    "correct_answer": "C",
    "domain": "Determinants",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Multiplying an n x n matrix by scalar k scales every row by k, so det(kA) = k^n det(A) = k^3 det(A)."
  },
  {
    "id": "m12_q21",
    "question": "The function f(x) = |x| is:",
    "options": [
      "Continuous and differentiable at x = 0",
      "Continuous but not differentiable at x = 0",
      "Differentiable but not continuous at x = 0",
      "Neither"
    ],
    "correct_answer": "B",
    "domain": "Continuity",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Limit as x->0 exists and equals f(0) = 0. However, left derivative is -1 and right derivative is +1, so it is non-differentiable at x = 0."
  },
  {
    "id": "m12_q22",
    "question": "If y = e^(sin x), then dy/dx equals:",
    "options": [
      "e^(sin x)",
      "cos x * e^(sin x)",
      "-cos x * e^(sin x)",
      "sin x * e^(cos x)"
    ],
    "correct_answer": "B",
    "domain": "Differentiation",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "By chain rule, dy/dx = e^(sin x) * d/dx(sin x) = cos x * e^(sin x)."
  },
  {
    "id": "m12_q23",
    "question": "Derivative of tan^-1((2x)/(1 - x^2)) with respect to sin^-1((2x)/(1 + x^2)) is:",
    "options": [
      "1",
      "2",
      "1/2",
      "0"
    ],
    "correct_answer": "A",
    "domain": "Differentiation",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Both expressions simplify to 2 tan^-1(x). Thus the derivative of one with respect to the other is 1."
  },
  {
    "id": "m12_q24",
    "question": "If x = a cos \u03b8 and y = a sin \u03b8, then dy/dx at \u03b8 = \u03c0/4 is:",
    "options": [
      "1",
      "-1",
      "0",
      "Undefined"
    ],
    "correct_answer": "B",
    "domain": "Parametric Derivatives",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "dx/d\u03b8 = -a sin \u03b8, dy/d\u03b8 = a cos \u03b8 -> dy/dx = -cot \u03b8. At \u03b8 = \u03c0/4, dy/dx = -cot(\u03c0/4) = -1."
  },
  {
    "id": "m12_q25",
    "question": "If y = ln(sec x + tan x), then dy/dx is:",
    "options": [
      "sec x",
      "tan x",
      "sec x tan x",
      "cos x"
    ],
    "correct_answer": "A",
    "domain": "Differentiation",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "dy/dx = (sec x tan x + sec^2 x)/(sec x + tan x) = sec x(tan x + sec x)/(sec x + tan x) = sec x."
  },
  {
    "id": "m12_q26",
    "question": "If f(x) = x^3 - 3x is defined on [0, \u221a3], the point c guaranteed by Rolle's Theorem is:",
    "options": [
      "1",
      "1/\u221a3",
      "\u221a3/2",
      "0"
    ],
    "correct_answer": "A",
    "domain": "Rolle's Theorem",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "f(0) = 0, f(\u221a3) = 0. f'(c) = 3c^2 - 3 = 0 -> c^2 = 1 -> c = 1 in (0, \u221a3)."
  },
  {
    "id": "m12_q27",
    "question": "If y = x^x, then dy/dx is:",
    "options": [
      "x * x^(x-1)",
      "x^x (1 + ln x)",
      "x^x ln x",
      "x^x / ln x"
    ],
    "correct_answer": "B",
    "domain": "Logarithmic Differentiation",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "ln y = x ln x. Differentiating: (1/y) dy/dx = 1 * ln x + x * (1/x) = 1 + ln x -> dy/dx = x^x (1 + ln x)."
  },
  {
    "id": "m12_q28",
    "question": "The slope of the tangent to curve y = 3x^4 - 4x at x = 4 is:",
    "options": [
      "764",
      "768",
      "764",
      "764"
    ],
    "correct_answer": "A",
    "domain": "Tangents",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "dy/dx = 12x^3 - 4. At x = 4, dy/dx = 12(64) - 4 = 768 - 4 = 764."
  },
  {
    "id": "m12_q29",
    "question": "The rate of change of area of a circle with respect to its radius r when r = 6 cm is:",
    "options": [
      "12\u03c0 cm^2/cm",
      "36\u03c0 cm^2/cm",
      "6\u03c0 cm^2/cm",
      "24\u03c0 cm^2/cm"
    ],
    "correct_answer": "A",
    "domain": "Rate of Change",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "A = \u03c0 r^2 -> dA/dr = 2\u03c0r. At r = 6 cm, dA/dr = 12\u03c0 cm^2/cm."
  },
  {
    "id": "m12_q30",
    "question": "The maximum value of the function f(x) = sin x + cos x is:",
    "options": [
      "1",
      "\u221a2",
      "2",
      "1/\u221a2"
    ],
    "correct_answer": "B",
    "domain": "Maxima & Minima",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "f(x) = \u221a2 sin(x + \u03c0/4). The maximum possible value is \u221a2."
  },
  {
    "id": "m12_q31",
    "question": "Evaluate \u222b (1 / (1 + x^2)) dx:",
    "options": [
      "tan^-1(x) + C",
      "sin^-1(x) + C",
      "ln|1 + x^2| + C",
      "cot^-1(x) + C"
    ],
    "correct_answer": "A",
    "domain": "Integrals",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Standard integration identity: \u222b 1/(1+x^2) dx = tan^-1(x) + C."
  },
  {
    "id": "m12_q32",
    "question": "Evaluate \u222b e^x (sin x + cos x) dx:",
    "options": [
      "e^x sin x + C",
      "e^x cos x + C",
      "-e^x cos x + C",
      "e^x (sin x - cos x) + C"
    ],
    "correct_answer": "A",
    "domain": "Integrals",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Using \u222b e^x [f(x) + f'(x)] dx = e^x f(x) + C, with f(x) = sin x and f'(x) = cos x, the integral is e^x sin x + C."
  },
  {
    "id": "m12_q33",
    "question": "Evaluate definite integral \u222b_0^(\u03c0/2) (sin^4 x / (sin^4 x + cos^4 x)) dx:",
    "options": [
      "\u03c0/2",
      "\u03c0/4",
      "\u03c0",
      "1"
    ],
    "correct_answer": "B",
    "domain": "Definite Integrals",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "By King's property \u222b_0^a f(x) dx = \u222b_0^a f(a - x) dx, 2I = \u222b_0^(\u03c0/2) 1 dx = \u03c0/2 -> I = \u03c0/4."
  },
  {
    "id": "m12_q34",
    "question": "Evaluate \u222b (sec^2 x / tan x) dx:",
    "options": [
      "ln|tan x| + C",
      "tan^2 x + C",
      "sec x + C",
      "ln|sec x| + C"
    ],
    "correct_answer": "A",
    "domain": "Integrals",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Using substitution u = tan x, du = sec^2 x dx: \u222b (1/u) du = ln|u| + C = ln|tan x| + C."
  },
  {
    "id": "m12_q35",
    "question": "The order and degree of differential equation (d^2y/dx^2)^3 + (dy/dx)^2 + sin(dy/dx) + 1 = 0 are:",
    "options": [
      "Order 2, Degree 3",
      "Order 2, Degree not defined",
      "Order 3, Degree 2",
      "Order 1, Degree 1"
    ],
    "correct_answer": "B",
    "domain": "Differential Equations",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Highest derivative is 2nd order. Because dy/dx appears inside a transcendental sine function, degree is not defined."
  },
  {
    "id": "m12_q36",
    "question": "The integrating factor (I.F.) of linear differential equation dy/dx + P(x)y = Q(x) is:",
    "options": [
      "e^(\u222b Q dx)",
      "e^(\u222b P dx)",
      "\u222b P dx",
      "ln(P(x))"
    ],
    "correct_answer": "B",
    "domain": "Differential Equations",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "The standard integrating factor for a first-order linear ODE in y is e^(\u222b P dx)."
  },
  {
    "id": "m12_q37",
    "question": "The general solution of differential equation dy/dx = y / x is:",
    "options": [
      "y = c / x",
      "y = c x",
      "x^2 + y^2 = c",
      "y = x + c"
    ],
    "correct_answer": "B",
    "domain": "Differential Equations",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Separating variables: dy / y = dx / x -> ln|y| = ln|x| + ln|c| -> y = c x."
  },
  {
    "id": "m12_q38",
    "question": "Area bounded by parabola y^2 = 4ax and its latus rectum x = a is:",
    "options": [
      "(8/3) a^2",
      "(4/3) a^2",
      "(16/3) a^2",
      "8 a^2"
    ],
    "correct_answer": "A",
    "domain": "Applications of Integrals",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Area = 2 \u222b_0^a 2\u221a(a) x^(1/2) dx = 4\u221a(a) * [ (2/3) x^(3/2) ]_0^a = (8/3) a^2."
  },
  {
    "id": "m12_q39",
    "question": "Evaluate \u222b_(-1)^1 x^17 cos^4(x) dx:",
    "options": [
      "0",
      "1",
      "\u03c0/2",
      "2"
    ],
    "correct_answer": "A",
    "domain": "Definite Integrals",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "The integrand f(x) = x^17 cos^4(x) is an odd function (f(-x) = -f(x)). The integral over symmetric limits [-a, a] is strictly 0."
  },
  {
    "id": "m12_q40",
    "question": "The number of arbitrary constants in the particular solution of a differential equation of order 3 is:",
    "options": [
      "3",
      "2",
      "1",
      "0"
    ],
    "correct_answer": "D",
    "domain": "Differential Equations",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "A particular solution contains no arbitrary constants (0 constants), as they are fixed by boundary conditions."
  },
  {
    "id": "m12_q41",
    "question": "If vectors a and b are perpendicular, then their dot product a \u00b7 b is:",
    "options": [
      "1",
      "0",
      "-1",
      "|a||b|"
    ],
    "correct_answer": "B",
    "domain": "Vectors",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "a \u00b7 b = |a||b| cos(90\u00b0) = 0."
  },
  {
    "id": "m12_q42",
    "question": "If |a| = 2, |b| = 3, and a \u00b7 b = 3, the angle between vectors a and b is:",
    "options": [
      "\u03c0/6",
      "\u03c0/4",
      "\u03c0/3",
      "\u03c0/2"
    ],
    "correct_answer": "C",
    "domain": "Vectors",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "cos \u03b8 = (a \u00b7 b) / (|a||b|) = 3 / (2 * 3) = 1/2 -> \u03b8 = \u03c0/3 (60\u00b0)."
  },
  {
    "id": "m12_q43",
    "question": "The unit vector perpendicular to both vectors a and b is given by:",
    "options": [
      "(a \u00b7 b) / |a \u00b7 b|",
      "(a x b) / |a x b|",
      "a + b",
      "a - b"
    ],
    "correct_answer": "B",
    "domain": "Vectors",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "The vector cross product a x b is orthogonal to both a and b. Normalizing gives the unit vector (a x b) / |a x b|."
  },
  {
    "id": "m12_q44",
    "question": "If a line makes angles 90\u00b0, 135\u00b0, and 45\u00b0 with x, y, and z axes respectively, its direction cosines are:",
    "options": [
      "[0, -1/\u221a2, 1/\u221a2]",
      "[1, 0, 0]",
      "[0, 1/2, \u221a3/2]",
      "[1/\u221a3, 1/\u221a3, 1/\u221a3]"
    ],
    "correct_answer": "A",
    "domain": "3D Geometry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "l = cos 90\u00b0 = 0, m = cos 135\u00b0 = -1/\u221a2, n = cos 45\u00b0 = 1/\u221a2."
  },
  {
    "id": "m12_q45",
    "question": "The distance between parallel planes 2x - y + 2z + 3 = 0 and 2x - y + 2z - 6 = 0 is:",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ],
    "correct_answer": "C",
    "domain": "3D Geometry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "d = |d1 - d2| / \u221a(a^2 + b^2 + c^2) = |3 - (-6)| / \u221a(4 + 1 + 4) = 9 / 3 = 3 units."
  },
  {
    "id": "m12_q46",
    "question": "In Linear Programming, the optimal value of an objective function Z = ax + by always occurs at:",
    "options": [
      "Origin",
      "Corner points of the feasible region",
      "Centre of gravity",
      "Midpoint of boundary lines"
    ],
    "correct_answer": "B",
    "domain": "Linear Programming",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "By the Fundamental Theorem of Linear Programming, optimal values occur at extreme (corner) points of the convex feasible polygon."
  },
  {
    "id": "m12_q47",
    "question": "If P(A) = 0.4, P(B) = 0.8, and P(B|A) = 0.6, then P(A \u2229 B) is:",
    "options": [
      "0.24",
      "0.48",
      "0.32",
      "0.16"
    ],
    "correct_answer": "A",
    "domain": "Probability",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "P(B|A) = P(A \u2229 B) / P(A) -> P(A \u2229 B) = P(B|A) * P(A) = 0.6 * 0.4 = 0.24."
  },
  {
    "id": "m12_q48",
    "question": "If two events A and B are independent, then P(A \u2229 B) equals:",
    "options": [
      "P(A) + P(B)",
      "P(A) * P(B)",
      "P(A) / P(B)",
      "0"
    ],
    "correct_answer": "B",
    "domain": "Probability",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "By definition of statistical independence, joint probability is the product of marginals: P(A \u2229 B) = P(A) * P(B)."
  },
  {
    "id": "m12_q49",
    "question": "A die is thrown twice. What is the probability of obtaining a total sum of 7?",
    "options": [
      "1/6",
      "1/12",
      "5/36",
      "7/36"
    ],
    "correct_answer": "A",
    "domain": "Probability",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Pairs summing to 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) -> 6 outcomes out of 36. P = 6/36 = 1/6."
  },
  {
    "id": "m12_q50",
    "question": "In a binomial distribution B(n, p), the mean is 4 and variance is 3. The value of p is:",
    "options": [
      "1/4",
      "3/4",
      "1/2",
      "1/3"
    ],
    "correct_answer": "A",
    "domain": "Probability Distributions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Mean = np = 4, Variance = np(1 - p) = 3 -> 4(1 - p) = 3 -> 1 - p = 3/4 -> p = 1/4."
  }
]
    },
    {
        "title": "JEE Main PCM Practice – Complete Grand Mock",
        "description": "Balanced high-yield JEE Main entrance simulation combining 17 Physics, 17 Chemistry, and 16 Mathematics questions with official negative marking (+2, -0.5).",
        "category": "Engineering Entrance Examinations",
        "category_slug": "engineering-entrance",
        "subcategory": "JEE Main - PCM Practice",
        "class_level": "Class 12",
        "subject": "PCM Combined",
        "exam_type": "JEE Main",
        "difficulty": "Hard",
        "language": "English",
        "visibility_target": "all",
        "target_class": "Class 12",
        "status": "published",
        "price_inr": 0,
        "duration_minutes": 90,
        "total_questions": 50,
        "total_marks": 100.0,
        "marks_per_question": 2.0,
        "negative_marking": 0.5,
        "passing_marks": 45.0,
        "pass_percentage": 45,
        "display_order": 3,
        "instructions": "1. 90 minutes test covering Physics (Q1-17), Chemistry (Q18-34), and Mathematics (Q35-50). 2. Correct answer: +2 marks. 3. Incorrect answer: -0.5 negative marking. 4. Unanswered: 0 marks. 5. Calculators are strictly prohibited.",
        "questions": [
  {
    "id": "jee_q1",
    "question": "A charge q is placed at the centre of a cube of side L. The electric flux through one of its faces is:",
    "options": [
      "q / \u03b5_0",
      "q / (6 \u03b5_0)",
      "q / (24 \u03b5_0)",
      "6q / \u03b5_0"
    ],
    "correct_answer": "B",
    "domain": "Electrostatics",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "By Gauss's law, total flux through the cube is q / \u03b5_0. By symmetry across all 6 identical faces, flux through one face is q / (6 \u03b5_0)."
  },
  {
    "id": "jee_q2",
    "question": "The capacitance of a parallel plate capacitor with plate area A and separation d filled with dielectric constant K is:",
    "options": [
      "\u03b5_0 A / d",
      "K \u03b5_0 A / d",
      "\u03b5_0 A / (K d)",
      "K d / (\u03b5_0 A)"
    ],
    "correct_answer": "B",
    "domain": "Capacitors",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Dielectric insertion scales capacitance by dielectric constant K: C = K \u03b5_0 A / d."
  },
  {
    "id": "jee_q3",
    "question": "Two long parallel wires carry currents I1 and I2 in opposite directions separated by distance d. The magnetic force between them is:",
    "options": [
      "Attractive",
      "Repulsive",
      "Zero",
      "Torque only"
    ],
    "correct_answer": "B",
    "domain": "Magnetism",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Anti-parallel currents in adjacent conductors experience a mutual repulsive magnetic Lorentz force."
  },
  {
    "id": "jee_q4",
    "question": "Lenz's law of electromagnetic induction is a consequence of the conservation of:",
    "options": [
      "Charge",
      "Energy",
      "Magnetic flux",
      "Linear momentum"
    ],
    "correct_answer": "B",
    "domain": "Electromagnetic Induction",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "The induced current creates a magnetic field opposing the change in flux, ensuring conservation of energy."
  },
  {
    "id": "jee_q5",
    "question": "In a series LCR circuit at resonance, the impedance Z is:",
    "options": [
      "Maximum and equal to R",
      "Minimum and equal to R",
      "Zero",
      "Infinity"
    ],
    "correct_answer": "B",
    "domain": "Alternating Current",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "At resonance, inductive reactance equals capacitive reactance (X_L = X_C). Net reactance is zero, making impedance purely resistive and minimum: Z = R."
  },
  {
    "id": "jee_q6",
    "question": "The electromagnetic wave with the highest frequency among the following is:",
    "options": [
      "X-rays",
      "Gamma rays",
      "Ultraviolet rays",
      "Microwaves"
    ],
    "correct_answer": "B",
    "domain": "EM Waves",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Gamma rays occupy the highest frequency and photon energy band in the electromagnetic spectrum."
  },
  {
    "id": "jee_q7",
    "question": "In Young's double-slit experiment, if the distance between slits is halved and screen distance is doubled, the fringe width becomes:",
    "options": [
      "Unchanged",
      "Doubled",
      "Four times",
      "Halved"
    ],
    "correct_answer": "C",
    "domain": "Wave Optics",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Fringe width \u03b2 = (\u03bb D) / d. If D becomes 2D and d becomes d/2, \u03b2' = (\u03bb * 2D) / (d/2) = 4 \u03b2."
  },
  {
    "id": "jee_q8",
    "question": "A convex lens of refractive index 1.5 is immersed in water (refractive index 1.33). Its focal length will:",
    "options": [
      "Increase",
      "Decrease",
      "Remain unchanged",
      "Become negative"
    ],
    "correct_answer": "A",
    "domain": "Ray Optics",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "By Lens Maker's Formula 1/f = (\u03bc_lens/\u03bc_medium - 1)(1/R1 - 1/R2). As relative refractive index decreases, focal length increases."
  },
  {
    "id": "jee_q9",
    "question": "The de Broglie wavelength of an electron accelerated through potential difference V is proportional to:",
    "options": [
      "V",
      "V^(1/2)",
      "V^(-1/2)",
      "V^(-1)"
    ],
    "correct_answer": "C",
    "domain": "Dual Nature",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "\u03bb = h / p = h / \u221a(2 m e V) \u221d 1 / \u221aV = V^(-1/2)."
  },
  {
    "id": "jee_q10",
    "question": "In Bohr's model of the hydrogen atom, the radius of the nth orbit is proportional to:",
    "options": [
      "n",
      "n^2",
      "1 / n",
      "1 / n^2"
    ],
    "correct_answer": "B",
    "domain": "Atomic Physics",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Bohr radius r_n = (n^2 h^2 \u03b5_0) / (\u03c0 m e^2) \u221d n^2."
  },
  {
    "id": "jee_q11",
    "question": "The half-life of a radioactive substance is 20 minutes. The fraction of initial activity remaining after 60 minutes is:",
    "options": [
      "1/4",
      "1/8",
      "1/16",
      "1/2"
    ],
    "correct_answer": "B",
    "domain": "Nuclear Physics",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Number of half-lives n = 60 / 20 = 3. Remaining fraction = (1/2)^3 = 1/8."
  },
  {
    "id": "jee_q12",
    "question": "In an intrinsic semiconductor, the Fermi energy level at 0 K lies:",
    "options": [
      "In the conduction band",
      "In the valence band",
      "Precisely midway in the forbidden energy gap",
      "At top of valence band"
    ],
    "correct_answer": "C",
    "domain": "Semiconductors",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "For an intrinsic semiconductor with equal electron and hole densities, the chemical potential (Fermi level) lies at the middle of the bandgap."
  },
  {
    "id": "jee_q13",
    "question": "A body cools from 80\u00b0C to 70\u00b0C in 5 minutes in a room at 20\u00b0C. According to Newton's law of cooling, it cools to 60\u00b0C in:",
    "options": [
      "Less than 5 minutes",
      "Exactly 5 minutes",
      "More than 5 minutes",
      "10 minutes"
    ],
    "correct_answer": "C",
    "domain": "Thermal Properties",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Rate of cooling decreases as the temperature difference with ambient surroundings diminishes, requiring more time (> 5 min) for the subsequent 10\u00b0C drop."
  },
  {
    "id": "jee_q14",
    "question": "The work done in blowing a soap bubble of radius R to 2R in air (surface tension T) is:",
    "options": [
      "8\u03c0 R^2 T",
      "24\u03c0 R^2 T",
      "12\u03c0 R^2 T",
      "6\u03c0 R^2 T"
    ],
    "correct_answer": "B",
    "domain": "Surface Tension",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "A soap bubble has two surfaces. \u0394A = 2 * [4\u03c0(2R)^2 - 4\u03c0(R)^2] = 2 * 4\u03c0(3R^2) = 24\u03c0 R^2. Work W = T * \u0394A = 24\u03c0 R^2 T."
  },
  {
    "id": "jee_q15",
    "question": "Two particles A and B perform SHM with same amplitude and frequency about origin. When distance between them is max, their phase difference is:",
    "options": [
      "0",
      "\u03c0/2",
      "\u03c0",
      "2\u03c0"
    ],
    "correct_answer": "C",
    "domain": "SHM",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Maximum separation occurs when one particle is at +A and the other is at -A. The phase difference is \u03c0 radians (180\u00b0)."
  },
  {
    "id": "jee_q16",
    "question": "A Carnot refrigerator extracts heat from a cold reservoir at -3\u00b0C and rejects it at 27\u00b0C. Its coefficient of performance (COP) is:",
    "options": [
      "9",
      "10",
      "8",
      "7.5"
    ],
    "correct_answer": "A",
    "domain": "Thermodynamics",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "COP = T_cold / (T_hot - T_cold) = (273 - 3) / (300 - 270) = 270 / 30 = 9."
  },
  {
    "id": "jee_q17",
    "question": "A wire of resistance R is stretched uniformly such that its length doubles. Its new electrical resistance is:",
    "options": [
      "2R",
      "4R",
      "R/2",
      "R/4"
    ],
    "correct_answer": "B",
    "domain": "Current Electricity",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Volume V = A * L is constant. Doubling length halves area A. R' = \u03c1 (2L) / (A/2) = 4 (\u03c1 L / A) = 4R."
  },
  {
    "id": "jee_q18",
    "question": "The number of radial nodes for a 3p orbital is:",
    "options": [
      "0",
      "1",
      "2",
      "3"
    ],
    "correct_answer": "B",
    "domain": "Atomic Structure",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Number of radial nodes = n - l - 1. For 3p orbital: n = 3, l = 1 -> 3 - 1 - 1 = 1."
  },
  {
    "id": "jee_q19",
    "question": "Which of the following molecules has zero dipole moment?",
    "options": [
      "NH3",
      "NF3",
      "BF3",
      "H2O"
    ],
    "correct_answer": "C",
    "domain": "Chemical Bonding",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "BF3 has a symmetrical trigonal planar geometry (120\u00b0 bond angles). The three B-F bond dipoles cancel completely, giving \u03bc = 0."
  },
  {
    "id": "jee_q20",
    "question": "According to Molecular Orbital Theory, which species has a bond order of 3.0?",
    "options": [
      "O2",
      "N2",
      "O2+",
      "NO"
    ],
    "correct_answer": "B",
    "domain": "Chemical Bonding",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "N2 has 14 electrons: (10 bonding - 4 antibonding) / 2 = 6 / 2 = 3.0."
  },
  {
    "id": "jee_q21",
    "question": "For the equilibrium N2(g) + 3H2(g) <=> 2NH3(g), the relationship between Kp and Kc is:",
    "options": [
      "Kp = Kc (RT)^-2",
      "Kp = Kc (RT)^2",
      "Kp = Kc (RT)",
      "Kp = Kc"
    ],
    "correct_answer": "A",
    "domain": "Chemical Equilibrium",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "\u0394n_g = moles of gaseous products - moles of gaseous reactants = 2 - (1 + 3) = -2. Kp = Kc (RT)^\u0394n = Kc (RT)^-2."
  },
  {
    "id": "jee_q22",
    "question": "The pH of a 10^-8 M aqueous HCl solution at 25\u00b0C is:",
    "options": [
      "8.0",
      "6.96",
      "7.00",
      "1.00"
    ],
    "correct_answer": "B",
    "domain": "Ionic Equilibrium",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Water autoprotolysis contributes 10^-7 M [H+]. Total [H+] = 10^-8 + 10^-7 = 1.1 x 10^-7 M. pH = -log(1.1 x 10^-7) \u2248 6.96 (slightly acidic)."
  },
  {
    "id": "jee_q23",
    "question": "The oxidation state of Cr in potassium dichromate (K2Cr2O7) is:",
    "options": [
      "+3",
      "+4",
      "+6",
      "+7"
    ],
    "correct_answer": "C",
    "domain": "Redox Reactions",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "2(+1) + 2(Cr) + 7(-2) = 0 -> 2 + 2(Cr) - 14 = 0 -> 2(Cr) = 12 -> Cr = +6."
  },
  {
    "id": "jee_q24",
    "question": "Which gas has the lowest van der Waals constant 'a' (weakest intermolecular forces)?",
    "options": [
      "He",
      "CH4",
      "CO2",
      "NH3"
    ],
    "correct_answer": "A",
    "domain": "States of Matter",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Helium is a small, non-polar noble gas with minimal polarizability, having the smallest van der Waals 'a' parameter."
  },
  {
    "id": "jee_q25",
    "question": "Which alkali metal carbonate is thermally least stable and decomposes on heating?",
    "options": [
      "Li2CO3",
      "Na2CO3",
      "K2CO3",
      "Rb2CO3"
    ],
    "correct_answer": "A",
    "domain": "Inorganic Chemistry",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Li+ has a very small ionic radius and high charge density, polarizing the large carbonate anion and making Li2CO3 decompose readily into Li2O and CO2."
  },
  {
    "id": "jee_q26",
    "question": "The shape of XeF4 molecule according to VSEPR theory is:",
    "options": [
      "Tetrahedral",
      "Square planar",
      "See-saw",
      "Octahedral"
    ],
    "correct_answer": "B",
    "domain": "Chemical Bonding",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Xe has 8 valence electrons + 4 bonds = 12 electrons (6 pairs: 4 bonding pairs + 2 lone pairs). Structure is square planar."
  },
  {
    "id": "jee_q27",
    "question": "According to Crystal Field Theory, which ligand exerts the strongest field?",
    "options": [
      "Cl-",
      "H2O",
      "NH3",
      "CN-"
    ],
    "correct_answer": "D",
    "domain": "Coordination Chemistry",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "According to the spectrochemical series: I- < Cl- < F- < H2O < NH3 < CN- < CO. Cyanide is a strong field carbon-donor ligand."
  },
  {
    "id": "jee_q28",
    "question": "Which of the following compounds exhibits optical isomerism?",
    "options": [
      "[Pt(NH3)2Cl2]",
      "[Co(en)3]3+",
      "[Co(NH3)4Cl2]+",
      "[Zn(NH3)4]2+"
    ],
    "correct_answer": "B",
    "domain": "Coordination Chemistry",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "[Co(en)3]3+ has three bidentate ligands in an octahedral arrangement with no plane or center of symmetry, existing as non-superimposable d- and l-enantiomers."
  },
  {
    "id": "jee_q29",
    "question": "Major product formed when 2-bromobutane is heated with alcoholic KOH is:",
    "options": [
      "1-butene",
      "trans-2-butene",
      "cis-2-butene",
      "2-butanol"
    ],
    "correct_answer": "B",
    "domain": "Organic Chemistry",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "By Saytzeff's rule, base-induced dehydrohalogenation predominantly forms the more substituted, thermodynamically stable trans-2-butene."
  },
  {
    "id": "jee_q30",
    "question": "Reaction of phenol with chloroform in aqueous NaOH followed by acidification yields:",
    "options": [
      "Salicylic acid",
      "Salicylaldehyde",
      "Benzoic acid",
      "Picric acid"
    ],
    "correct_answer": "B",
    "domain": "Named Reactions",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "This is the Reimer-Tiemann reaction, converting phenol into o-hydroxybenzaldehyde (salicylaldehyde) via dichlorocarbene intermediate."
  },
  {
    "id": "jee_q31",
    "question": "Which test is used to distinguish primary, secondary, and tertiary amines?",
    "options": [
      "Tollens' test",
      "Lucas test",
      "Hinsberg test",
      "Fehling's test"
    ],
    "correct_answer": "C",
    "domain": "Organic Nitrogen",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Benzenesulfonyl chloride (Hinsberg reagent) forms alkali-soluble sulfonamides with primary amines, alkali-insoluble with secondary, and does not react with tertiary amines."
  },
  {
    "id": "jee_q32",
    "question": "Which of the following is a non-reducing sugar?",
    "options": [
      "Glucose",
      "Fructose",
      "Maltose",
      "Sucrose"
    ],
    "correct_answer": "D",
    "domain": "Biomolecules",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "In sucrose, the glycosidic bond links both anomeric carbons (C1 of \u03b1-glucose and C2 of \u03b2-fructose), preventing ring opening and mutarotation."
  },
  {
    "id": "jee_q33",
    "question": "The unit of rate constant for a second-order reaction is:",
    "options": [
      "s^-1",
      "mol L^-1 s^-1",
      "L mol^-1 s^-1",
      "L^2 mol^-2 s^-1"
    ],
    "correct_answer": "C",
    "domain": "Chemical Kinetics",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Rate = k [A]^2 -> k = Rate / [A]^2 = (mol L^-1 s^-1) / (mol^2 L^-2) = L mol^-1 s^-1."
  },
  {
    "id": "jee_q34",
    "question": "The standard electrode potentials E\u00b0 of Zn2+/Zn and Cu2+/Cu are -0.76 V and +0.34 V. The standard EMF of the Daniel cell is:",
    "options": [
      "0.42 V",
      "1.10 V",
      "-1.10 V",
      "1.52 V"
    ],
    "correct_answer": "B",
    "domain": "Electrochemistry",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "E\u00b0_cell = E\u00b0_cathode - E\u00b0_anode = +0.34 V - (-0.76 V) = +1.10 V."
  },
  {
    "id": "jee_q35",
    "question": "If the roots of quadratic equation ax^2 + bx + c = 0 are in ratio 2:3, then:",
    "options": [
      "6b^2 = 25ac",
      "25b^2 = 6ac",
      "b^2 = 5ac",
      "6b = 25ac"
    ],
    "correct_answer": "A",
    "domain": "Quadratic Equations",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Let roots be 2k and 3k. Sum = 5k = -b/a, Product = 6k^2 = c/a. (5k)^2 = 25k^2 = 25(c/6a) = b^2/a^2 -> 6b^2 = 25ac."
  },
  {
    "id": "jee_q36",
    "question": "The value of i^(4n + 3), where n is an integer and i = \u221a(-1), is:",
    "options": [
      "1",
      "-1",
      "i",
      "-i"
    ],
    "correct_answer": "D",
    "domain": "Complex Numbers",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "i^(4n+3) = (i^4)^n * i^3 = (1)^n * (-i) = -i."
  },
  {
    "id": "jee_q37",
    "question": "The sum to infinity of geometric progression 1, 1/2, 1/4, 1/8, ... is:",
    "options": [
      "1",
      "2",
      "3/2",
      "Infinity"
    ],
    "correct_answer": "B",
    "domain": "Sequences & Series",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "S_inf = a / (1 - r) = 1 / (1 - 1/2) = 2."
  },
  {
    "id": "jee_q38",
    "question": "Number of ways of arranging 5 boys and 5 girls in a circle such that boys and girls sit alternately is:",
    "options": [
      "(5!)^2",
      "4! * 5!",
      "10!",
      "9!"
    ],
    "correct_answer": "B",
    "domain": "Permutations",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Fix 5 boys in a circle in (5 - 1)! = 4! ways. The 5 alternating gaps can be filled by 5 girls in 5! ways -> 4! * 5!."
  },
  {
    "id": "jee_q39",
    "question": "The coefficient of x^5 in the expansion of (1 + x)^8 is:",
    "options": [
      "28",
      "56",
      "70",
      "35"
    ],
    "correct_answer": "B",
    "domain": "Binomial Theorem",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "T_(r+1) = ^8C_r x^r. For x^5, r = 5. ^8C_5 = ^8C_3 = (8 * 7 * 6) / (3 * 2 * 1) = 56."
  },
  {
    "id": "jee_q40",
    "question": "The distance between focus and directrix of parabola y^2 = 12x is:",
    "options": [
      "3",
      "6",
      "12",
      "4"
    ],
    "correct_answer": "B",
    "domain": "Conic Sections",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "y^2 = 4ax -> 4a = 12 -> a = 3. Focus is at (3, 0) and directrix is x = -3. Distance = 2a = 6."
  },
  {
    "id": "jee_q41",
    "question": "The eccentricity of ellipse x^2/25 + y^2/16 = 1 is:",
    "options": [
      "3/5",
      "4/5",
      "9/25",
      "1/5"
    ],
    "correct_answer": "A",
    "domain": "Conic Sections",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "e = \u221a(1 - b^2/a^2) = \u221a(1 - 16/25) = \u221a(9/25) = 3/5."
  },
  {
    "id": "jee_q42",
    "question": "The equation of tangent to circle x^2 + y^2 = 25 at point (3, 4) is:",
    "options": [
      "3x + 4y = 25",
      "4x + 3y = 25",
      "3x - 4y = 25",
      "x + y = 7"
    ],
    "correct_answer": "A",
    "domain": "Circles",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Tangent formula T = 0 at (x1, y1) on circle x^2 + y^2 = r^2 is x x1 + y y1 = r^2 -> 3x + 4y = 25."
  },
  {
    "id": "jee_q43",
    "question": "Evaluate limit lim_(x->0) (sin 5x / sin 3x):",
    "options": [
      "1",
      "5/3",
      "3/5",
      "0"
    ],
    "correct_answer": "B",
    "domain": "Limits",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "lim_(x->0) [(sin 5x / 5x) * 5] / [(sin 3x / 3x) * 3] = (1 * 5) / (1 * 3) = 5/3."
  },
  {
    "id": "jee_q44",
    "question": "If f(x) = ln(x + \u221a(x^2 + 1)), then f'(x) equals:",
    "options": [
      "1 / \u221a(x^2 + 1)",
      "1 / (x + \u221a(x^2 + 1))",
      "x / \u221a(x^2 + 1)",
      "1 + x"
    ],
    "correct_answer": "A",
    "domain": "Calculus",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "f'(x) = [1 + x / \u221a(x^2+1)] / [x + \u221a(x^2+1)] = [\u221a(x^2+1) + x] / [\u221a(x^2+1)(x + \u221a(x^2+1))] = 1 / \u221a(x^2+1)."
  },
  {
    "id": "jee_q45",
    "question": "Evaluate \u222b (x e^x / (x + 1)^2) dx:",
    "options": [
      "e^x / (x + 1) + C",
      "e^x (x + 1) + C",
      "x e^x + C",
      "-e^x / (x + 1) + C"
    ],
    "correct_answer": "A",
    "domain": "Integrals",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Rewrite x / (x+1)^2 = 1/(x+1) - 1/(x+1)^2. This matches e^x [f(x) + f'(x)] with f(x) = 1/(x+1), giving e^x / (x+1) + C."
  },
  {
    "id": "jee_q46",
    "question": "The area of region enclosed by curve y = x^2 and line y = 4 is:",
    "options": [
      "16/3",
      "32/3",
      "64/3",
      "8"
    ],
    "correct_answer": "B",
    "domain": "Applications of Integrals",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Area = 2 \u222b_0^4 \u221a(y) dy = 2 * [ (2/3) y^(3/2) ]_0^4 = (4/3) * 8 = 32/3 square units."
  },
  {
    "id": "jee_q47",
    "question": "If a, b, c are three mutually perpendicular unit vectors, then |a + b + c| is:",
    "options": [
      "1",
      "\u221a2",
      "\u221a3",
      "3"
    ],
    "correct_answer": "C",
    "domain": "Vectors",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "|a + b + c|^2 = |a|^2 + |b|^2 + |c|^2 + 2(a\u00b7b + b\u00b7c + c\u00b7a) = 1 + 1 + 1 + 0 = 3 -> |a + b + c| = \u221a3."
  },
  {
    "id": "jee_q48",
    "question": "The shortest distance between lines (x - 1)/2 = (y - 2)/3 = (z - 3)/4 and (x - 2)/3 = (y - 4)/4 = (z - 5)/5 is:",
    "options": [
      "0 (Intersecting)",
      "1/\u221a6",
      "2/\u221a6",
      "1/6"
    ],
    "correct_answer": "A",
    "domain": "3D Geometry",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Evaluating the coplanarity determinant [a2 - a1, b1, b2] yields 0, proving the lines intersect and the shortest distance is 0."
  },
  {
    "id": "jee_q49",
    "question": "Two unbiased dice are rolled. The probability of getting a sum greater than 9 is:",
    "options": [
      "1/6",
      "5/36",
      "1/4",
      "7/36"
    ],
    "correct_answer": "A",
    "domain": "Probability",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "Sums > 9 are 10, 11, 12. Pairs: (4,6),(5,5),(6,4) [3] + (5,6),(6,5) [2] + (6,6) [1] = 6 pairs. P = 6/36 = 1/6."
  },
  {
    "id": "jee_q50",
    "question": "If A and B are independent events with P(A) = 0.3 and P(B) = 0.4, then P(A \u222a B) is:",
    "options": [
      "0.70",
      "0.58",
      "0.12",
      "0.42"
    ],
    "correct_answer": "B",
    "domain": "Probability",
    "marks": 2.0,
    "negative_marks": 0.5,
    "explanation": "P(A \u222a B) = P(A) + P(B) - P(A)P(B) = 0.3 + 0.4 - (0.3 * 0.4) = 0.70 - 0.12 = 0.58."
  }
]
    },
    {
        "title": "Engineering CSE Fundamentals – Core Curriculum Benchmark",
        "description": "Standard university and recruitment core benchmark for Computer Science & IT engineering students: Data Structures, Algorithms, OS, DBMS, Computer Networks, and System Architecture.",
        "category": "Engineering Branch Examinations",
        "category_slug": "engineering-branch",
        "subcategory": "Computer Science Engineering (CSE)",
        "class_level": "Engineering",
        "subject": "Computer Science",
        "exam_type": "Engineering Branch",
        "engineering_branch": "CSE",
        "difficulty": "Medium",
        "language": "English",
        "visibility_target": "all",
        "target_class": "Engineering",
        "status": "published",
        "price_inr": 0,
        "duration_minutes": 60,
        "total_questions": 50,
        "total_marks": 50.0,
        "marks_per_question": 1.0,
        "negative_marking": 0.0,
        "passing_marks": 25.0,
        "pass_percentage": 50,
        "display_order": 4,
        "instructions": "1. Total duration is 60 minutes. 2. 50 multiple choice questions evaluating Core CS concepts. 3. Each correct answer carries 1 mark (Total 50 marks). 4. No negative marking.",
        "questions": [
  {
    "id": "cse_q1",
    "question": "What is the time complexity to access an element by index in a contiguous dynamic array (e.g. ArrayList)?",
    "options": [
      "O(1)",
      "O(log n)",
      "O(n)",
      "O(n^2)"
    ],
    "correct_answer": "A",
    "domain": "Data Structures",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Direct indexing calculates memory offset in O(1) constant time."
  },
  {
    "id": "cse_q2",
    "question": "Which data structure is primarily used to implement Breadth-First Search (BFS) in a graph?",
    "options": [
      "Stack",
      "Queue",
      "Priority Queue",
      "Binary Search Tree"
    ],
    "correct_answer": "B",
    "domain": "Graph Algorithms",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "BFS traverses level by level, requiring a FIFO Queue to order discovery."
  },
  {
    "id": "cse_q3",
    "question": "In a singly linked list with n nodes, what is the worst-case time to delete the last node given only the head pointer?",
    "options": [
      "O(1)",
      "O(log n)",
      "O(n)",
      "O(n log n)"
    ],
    "correct_answer": "C",
    "domain": "Data Structures",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Without a pointer to the second-to-last node, one must traverse all n nodes from head in O(n) time."
  },
  {
    "id": "cse_q4",
    "question": "What is the maximum number of nodes in a binary tree of height h (where a tree with single node has h=1)?",
    "options": [
      "2^h",
      "2^h - 1",
      "2^(h-1)",
      "2^(h+1) - 1"
    ],
    "correct_answer": "B",
    "domain": "Binary Trees",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "A full binary tree has 1 + 2 + 4 + ... + 2^(h-1) = 2^h - 1 nodes."
  },
  {
    "id": "cse_q5",
    "question": "What is the balance factor of a node in an AVL tree?",
    "options": [
      "Height(Left) - Height(Right)",
      "Height(Left) * Height(Right)",
      "Depth(Left) - Depth(Right)",
      "Number of left keys - right keys"
    ],
    "correct_answer": "A",
    "domain": "Self-Balancing Trees",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "AVL balance factor is the difference between left and right subtree heights, constrained to -1, 0, or +1."
  },
  {
    "id": "cse_q6",
    "question": "Which hash collision resolution method stores all colliding elements in a linked list at the bucket index?",
    "options": [
      "Open Addressing",
      "Linear Probing",
      "Separate Chaining",
      "Double Hashing"
    ],
    "correct_answer": "C",
    "domain": "Hashing",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Separate Chaining uses independent linked lists or dynamic arrays per bucket to hold colliding keys."
  },
  {
    "id": "cse_q7",
    "question": "What is the time complexity of searching for an element in a Hash Table with good hash distribution?",
    "options": [
      "O(1) average",
      "O(log n)",
      "O(n)",
      "O(n log n)"
    ],
    "correct_answer": "A",
    "domain": "Hashing",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "With uniform hashing and acceptable load factor, lookup averages O(1)."
  },
  {
    "id": "cse_q8",
    "question": "In a Min-Heap with N elements, the root node always contains:",
    "options": [
      "The maximum value",
      "The minimum value",
      "The median value",
      "An arbitrary value"
    ],
    "correct_answer": "B",
    "domain": "Heaps",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "The min-heap property ensures that every parent node is less than or equal to its children, placing minimum at root."
  },
  {
    "id": "cse_q9",
    "question": "Which traversal of a Binary Search Tree (BST) produces keys in sorted ascending order?",
    "options": [
      "Pre-order",
      "In-order",
      "Post-order",
      "Level-order"
    ],
    "correct_answer": "B",
    "domain": "Tree Traversals",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "In-order traversal visits Left subtree, Node, Right subtree, naturally sorting BST keys."
  },
  {
    "id": "cse_q10",
    "question": "What data structure is used to evaluate postfix expressions or check balanced parentheses?",
    "options": [
      "Queue",
      "Stack",
      "Heap",
      "Graph"
    ],
    "correct_answer": "B",
    "domain": "Stacks",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "LIFO stack semantics are ideal for matching delimiters and evaluating postfix operators."
  },
  {
    "id": "cse_q11",
    "question": "What is the worst-case time complexity of QuickSort?",
    "options": [
      "O(n log n)",
      "O(n^2)",
      "O(n)",
      "O(log n)"
    ],
    "correct_answer": "B",
    "domain": "Sorting",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "When the pivot partition is maximally unbalanced (e.g. sorted input with end pivot), recurrence yields O(n^2)."
  },
  {
    "id": "cse_q12",
    "question": "Which sorting algorithm has a guaranteed worst-case time complexity of O(n log n) and is in-place?",
    "options": [
      "Merge Sort",
      "Heap Sort",
      "Bubble Sort",
      "Quick Sort"
    ],
    "correct_answer": "B",
    "domain": "Sorting",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "HeapSort sorts in-place using O(1) auxiliary space while guaranteeing O(n log n) worst-case."
  },
  {
    "id": "cse_q13",
    "question": "Binary Search requires the underlying collection to be:",
    "options": [
      "Randomized",
      "Sorted and random accessible",
      "Linked list based",
      "Hashed"
    ],
    "correct_answer": "B",
    "domain": "Searching",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Binary Search needs ordered keys with O(1) random access to bisect the search space in O(log n)."
  },
  {
    "id": "cse_q14",
    "question": "What algorithmic technique does Dijkstra's shortest path algorithm employ?",
    "options": [
      "Greedy method",
      "Divide and conquer",
      "Dynamic programming",
      "Backtracking"
    ],
    "correct_answer": "A",
    "domain": "Graph Algorithms",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Dijkstra repeatedly selects the unvisited vertex with smallest tentative distance using a greedy choice."
  },
  {
    "id": "cse_q15",
    "question": "The 0/1 Knapsack problem is optimally solved in pseudo-polynomial time using:",
    "options": [
      "Greedy Algorithm",
      "Dynamic Programming",
      "Linear Search",
      "Binary Search"
    ],
    "correct_answer": "B",
    "domain": "Dynamic Programming",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "0/1 Knapsack exhibits optimal substructure and overlapping subproblems solved via DP in O(n * W) time."
  },
  {
    "id": "cse_q16",
    "question": "Which problem is NOT solvable in polynomial time (unless P = NP)?",
    "options": [
      "Shortest Path",
      "Minimum Spanning Tree",
      "Traveling Salesperson Problem",
      "Topological Sort"
    ],
    "correct_answer": "C",
    "domain": "Complexity Theory",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "TSP is a renowned NP-hard problem with no known polynomial-time solution."
  },
  {
    "id": "cse_q17",
    "question": "What is the time complexity of building a heap (Build-Heap) from an unsorted array of n elements?",
    "options": [
      "O(n)",
      "O(n log n)",
      "O(n^2)",
      "O(log n)"
    ],
    "correct_answer": "A",
    "domain": "Heaps",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Bottom-up heap construction sums to a converging geometric series bounded by O(n)."
  },
  {
    "id": "cse_q18",
    "question": "Which graph algorithm detects negative-weight cycles in a directed graph?",
    "options": [
      "Dijkstra's Algorithm",
      "Bellman-Ford Algorithm",
      "Prim's Algorithm",
      "Kruskal's Algorithm"
    ],
    "correct_answer": "B",
    "domain": "Graph Algorithms",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Bellman-Ford relaxes edges V-1 times; if a V-th relaxation further reduces distances, a negative cycle exists."
  },
  {
    "id": "cse_q19",
    "question": "Topological sorting is possible only on which type of graphs?",
    "options": [
      "Undirected Graphs",
      "Directed Acyclic Graphs (DAG)",
      "Complete Graphs",
      "Bipartite Graphs"
    ],
    "correct_answer": "B",
    "domain": "Graph Theory",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Topological order requires directed edges and absence of cycles (DAG) to establish linear precedence."
  },
  {
    "id": "cse_q20",
    "question": "What is the best-case time complexity of standard Bubble Sort when optimized with a swapped flag?",
    "options": [
      "O(1)",
      "O(n)",
      "O(n log n)",
      "O(n^2)"
    ],
    "correct_answer": "B",
    "domain": "Sorting",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "If no swaps occur during the first pass over an already sorted array, it terminates in O(n) time."
  },
  {
    "id": "cse_q21",
    "question": "What is the state of a process when it is waiting for an I/O operation to complete?",
    "options": [
      "Ready",
      "Running",
      "Blocked / Waiting",
      "Terminated"
    ],
    "correct_answer": "C",
    "domain": "Process Management",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "A process blocked on I/O transitions from Running to Waiting/Blocked state until the I/O interrupt occurs."
  },
  {
    "id": "cse_q22",
    "question": "Which CPU scheduling algorithm is subject to the convoy effect?",
    "options": [
      "Round Robin",
      "First-Come, First-Served (FCFS)",
      "Shortest Job First (SJF)",
      "Priority Scheduling"
    ],
    "correct_answer": "B",
    "domain": "Scheduling",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "In FCFS, long CPU-burst processes hold the CPU, forcing all short I/O-bound processes to wait behind it."
  },
  {
    "id": "cse_q23",
    "question": "Which of the following is NOT one of Coffman's four conditions for deadlock?",
    "options": [
      "Mutual Exclusion",
      "Hold and Wait",
      "Preemption allowed",
      "Circular Wait"
    ],
    "correct_answer": "C",
    "domain": "Deadlocks",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Deadlock requires NO preemption (resources cannot be forcibly taken). Preemption prevents deadlock."
  },
  {
    "id": "cse_q24",
    "question": "Belady's Anomaly occurs in which page replacement algorithm?",
    "options": [
      "LRU",
      "Optimal",
      "FIFO",
      "LFU"
    ],
    "correct_answer": "C",
    "domain": "Memory Management",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "FIFO can experience more page faults when allocated more physical page frames, known as Belady's Anomaly."
  },
  {
    "id": "cse_q25",
    "question": "What is virtual memory primarily implemented through?",
    "options": [
      "Paging and Segmentation",
      "Cache registers",
      "ROM storage",
      "DMA controllers"
    ],
    "correct_answer": "A",
    "domain": "Memory Management",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Virtual memory maps logical addresses to physical frames using page tables, segmentation, and backing store."
  },
  {
    "id": "cse_q26",
    "question": "What is a semaphore initialized to 1 commonly known as?",
    "options": [
      "Counting Semaphore",
      "Binary Semaphore / Mutex",
      "Spinlock",
      "Condition Variable"
    ],
    "correct_answer": "B",
    "domain": "Synchronization",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "A binary semaphore has values 0 and 1, functioning as a mutual exclusion lock."
  },
  {
    "id": "cse_q27",
    "question": "In UNIX-like operating systems, which system call creates a new child process?",
    "options": [
      "fork()",
      "exec()",
      "spawn()",
      "create()"
    ],
    "correct_answer": "A",
    "domain": "System Calls",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "fork() duplicates the calling process to create an identical child process with a unique PID."
  },
  {
    "id": "cse_q28",
    "question": "What is thrashing in an operating system?",
    "options": [
      "Hard drive physical failure",
      "System spending excessive time paging rather than executing code",
      "Network congestion",
      "CPU overclocking"
    ],
    "correct_answer": "B",
    "domain": "Virtual Memory",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Thrashing happens when processes lack sufficient working frames, causing near-continuous page faulting."
  },
  {
    "id": "cse_q29",
    "question": "The Translation Lookaside Buffer (TLB) acts as a hardware cache for:",
    "options": [
      "Instruction opcodes",
      "Page table address translations",
      "Disk sectors",
      "CPU registers"
    ],
    "correct_answer": "B",
    "domain": "Memory Management",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "TLB stores recent virtual-to-physical address translations to accelerate memory access."
  },
  {
    "id": "cse_q30",
    "question": "What type of kernel runs core OS services (like file systems and drivers) in user space?",
    "options": [
      "Monolithic Kernel",
      "Microkernel",
      "Exokernel",
      "Hybrid Kernel"
    ],
    "correct_answer": "B",
    "domain": "Kernel Architecture",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Microkernels maintain only minimal mechanisms in supervisor mode, running OS services in user space."
  },
  {
    "id": "cse_q31",
    "question": "In an ER diagram, what shape represents an entity set?",
    "options": [
      "Circle",
      "Rectangle",
      "Diamond",
      "Ellipse"
    ],
    "correct_answer": "B",
    "domain": "Database Design",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Rectangles represent entity sets, diamonds represent relationships, and ellipses represent attributes."
  },
  {
    "id": "cse_q32",
    "question": "Which normal form guarantees the elimination of all transitive dependencies?",
    "options": [
      "1NF",
      "2NF",
      "3NF",
      "BCNF"
    ],
    "correct_answer": "C",
    "domain": "Normalization",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "3NF requires relations to be in 2NF and contain no non-prime attribute transitively dependent on candidate keys."
  },
  {
    "id": "cse_q33",
    "question": "What does the 'I' in ACID properties of transactions stand for?",
    "options": [
      "Integrity",
      "Isolation",
      "Indexing",
      "Interoperability"
    ],
    "correct_answer": "B",
    "domain": "Transactions",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Isolation ensures concurrent transactions execute without interference as if serially scheduled."
  },
  {
    "id": "cse_q34",
    "question": "Which SQL command is used to remove all records from a table without logging individual row deletions?",
    "options": [
      "DELETE",
      "DROP",
      "TRUNCATE",
      "REMOVE"
    ],
    "correct_answer": "C",
    "domain": "SQL",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "TRUNCATE is a DDL operation that deallocates data pages quickly without row-by-row transaction logging."
  },
  {
    "id": "cse_q35",
    "question": "A primary key constraint in relational databases enforces:",
    "options": [
      "NOT NULL and UNIQUE",
      "FOREIGN KEY and INDEX",
      "CHECK and DEFAULT",
      "AUTO INCREMENT only"
    ],
    "correct_answer": "A",
    "domain": "Relational Model",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "A Primary Key uniquely identifies tuples and strictly disallows NULL values."
  },
  {
    "id": "cse_q36",
    "question": "Which join returns all matching records from both tables plus unmatched records from the left table?",
    "options": [
      "INNER JOIN",
      "LEFT OUTER JOIN",
      "RIGHT OUTER JOIN",
      "FULL OUTER JOIN"
    ],
    "correct_answer": "B",
    "domain": "SQL Joins",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "LEFT JOIN retains all rows from the left table, filling missing right table columns with NULL."
  },
  {
    "id": "cse_q37",
    "question": "What data structure is standard for implementing primary indexes in relational database engines (like MySQL InnoDB)?",
    "options": [
      "Binary Search Tree",
      "B+ Tree",
      "Skip List",
      "Splay Tree"
    ],
    "correct_answer": "B",
    "domain": "Indexing",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "B+ Trees provide high fan-out, shallow depth, and linked leaf nodes for rapid point and range queries."
  },
  {
    "id": "cse_q38",
    "question": "In SQL, which clause filters aggregated results produced by GROUP BY?",
    "options": [
      "WHERE",
      "ORDER BY",
      "HAVING",
      "LIMIT"
    ],
    "correct_answer": "C",
    "domain": "SQL",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "HAVING applies conditions to aggregated group rows, whereas WHERE filters individual tuples before grouping."
  },
  {
    "id": "cse_q39",
    "question": "A schedule where each transaction reads data only after the writing transaction has committed is:",
    "options": [
      "Cascadeless Schedule",
      "Strict Schedule",
      "Serializable Schedule",
      "Recoverable Schedule"
    ],
    "correct_answer": "A",
    "domain": "Concurrency Control",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Cascadeless schedules prevent cascading rollbacks by ensuring uncommitted writes are never read."
  },
  {
    "id": "cse_q40",
    "question": "What is a Foreign Key designed to preserve?",
    "options": [
      "Domain Integrity",
      "Entity Integrity",
      "Referential Integrity",
      "Physical Integrity"
    ],
    "correct_answer": "C",
    "domain": "Database Integrity",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Foreign keys enforce referential integrity between child and parent tables."
  },
  {
    "id": "cse_q41",
    "question": "Which OSI model layer is responsible for end-to-end reliability and flow control?",
    "options": [
      "Data Link Layer",
      "Network Layer",
      "Transport Layer",
      "Session Layer"
    ],
    "correct_answer": "C",
    "domain": "OSI Model",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "The Transport Layer (Layer 4) provides reliable data transfer, flow control, and error recovery."
  },
  {
    "id": "cse_q42",
    "question": "What is the size of an IPv4 address versus an IPv6 address?",
    "options": [
      "32 bits and 128 bits",
      "64 bits and 128 bits",
      "32 bits and 64 bits",
      "16 bits and 32 bits"
    ],
    "correct_answer": "A",
    "domain": "IP Addressing",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "IPv4 addresses use 32 bits (4 bytes); IPv6 addresses use 128 bits (16 bytes)."
  },
  {
    "id": "cse_q43",
    "question": "Which protocol resolves an IP address to a physical MAC address on a local network?",
    "options": [
      "DHCP",
      "DNS",
      "ARP",
      "ICMP"
    ],
    "correct_answer": "C",
    "domain": "Networking Protocols",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Address Resolution Protocol (ARP) maps a network layer IPv4 address to a 48-bit Ethernet MAC address."
  },
  {
    "id": "cse_q44",
    "question": "Which transport protocol is connectionless and does not guarantee packet delivery?",
    "options": [
      "TCP",
      "UDP",
      "SCTP",
      "HTTP"
    ],
    "correct_answer": "B",
    "domain": "Transport Layer",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "UDP (User Datagram Protocol) is connectionless, prioritizing low latency over reliability."
  },
  {
    "id": "cse_q45",
    "question": "What port number does secure HTTPS traffic use by default?",
    "options": [
      "80",
      "443",
      "8080",
      "22"
    ],
    "correct_answer": "B",
    "domain": "Web Protocols",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Standard unencrypted HTTP operates on port 80, while TLS/SSL encrypted HTTPS uses port 443."
  },
  {
    "id": "cse_q46",
    "question": "Which algorithm is used in TCP for congestion control during the initial connection phase?",
    "options": [
      "Slow Start",
      "Fast Retransmit",
      "Leaky Bucket",
      "Token Bucket"
    ],
    "correct_answer": "A",
    "domain": "Congestion Control",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "TCP Slow Start exponentially increases congestion window (cwnd) per RTT until ssthresh is reached."
  },
  {
    "id": "cse_q47",
    "question": "What is the network address for IP 192.168.1.130 with subnet mask 255.255.255.192 (/26)?",
    "options": [
      "192.168.1.0",
      "192.168.1.64",
      "192.168.1.128",
      "192.168.1.192"
    ],
    "correct_answer": "C",
    "domain": "Subnetting",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Mask 192 in binary is 11000000. 130 in binary is 10000010. 130 AND 192 = 128 -> 192.168.1.128."
  },
  {
    "id": "cse_q48",
    "question": "Which protocol automatically assigns IP addresses, subnet masks, and default gateways to client devices?",
    "options": [
      "DNS",
      "DHCP",
      "SNMP",
      "BGP"
    ],
    "correct_answer": "B",
    "domain": "Network Services",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Dynamic Host Configuration Protocol (DHCP) dynamically leases network configurations to hosts."
  },
  {
    "id": "cse_q49",
    "question": "What does the Domain Name System (DNS) do?",
    "options": [
      "Encrypts web packets",
      "Translates human-readable domain names to numerical IP addresses",
      "Filters malicious URLs",
      "Allocates MAC addresses"
    ],
    "correct_answer": "B",
    "domain": "Network Services",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "DNS operates as an internet directory resolving hostnames (e.g. testoraquiz.com) to IP addresses."
  },
  {
    "id": "cse_q50",
    "question": "Which routing protocol is an Exterior Gateway Protocol used to route traffic across autonomous systems on the Internet?",
    "options": [
      "OSPF",
      "RIP",
      "BGP",
      "EIGRP"
    ],
    "correct_answer": "C",
    "domain": "Routing",
    "marks": 1.0,
    "negative_marks": 0.0,
    "explanation": "Border Gateway Protocol (BGP) is the standard path-vector protocol connecting autonomous Internet systems."
  }
]
    },
    {
        "title": "Class 12 Chemistry – Core Board & Entrance Qualifier",
        "description": "Exhaustive Class 12 Chemistry mock examination spanning Solutions, Electrochemistry, Chemical Kinetics, Coordination Compounds, d- and f-Block, Haloalkanes, Alcohols, Carbonyls, Amines, and Biomolecules.",
        "category": "School Examinations",
        "category_slug": "school-examinations",
        "subcategory": "Class 12 - Chemistry",
        "class_level": "Class 12",
        "subject": "Chemistry",
        "exam_type": "School Board",
        "difficulty": "Medium",
        "language": "English",
        "visibility_target": "all",
        "target_class": "Class 12",
        "status": "published",
        "price_inr": 0,
        "duration_minutes": 90,
        "total_questions": 50,
        "total_marks": 100.0,
        "marks_per_question": 2.0,
        "negative_marking": 0.0,
        "passing_marks": 40.0,
        "pass_percentage": 40,
        "display_order": 5,
        "instructions": "1. 90 minutes examination covering complete Class 12 Physical, Inorganic, and Organic Chemistry. 2. 50 questions, each carrying 2 marks. 3. Total marks: 100. 4. No negative marking.",
        "questions": [
  {
    "id": "c12_q1",
    "question": "Which of the following colligative properties is most suitable for determining the molar mass of polymers and proteins?",
    "options": [
      "Relative lowering of vapor pressure",
      "Elevation of boiling point",
      "Depression of freezing point",
      "Osmotic pressure"
    ],
    "correct_answer": "D",
    "domain": "Solutions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Osmotic pressure produces measurable magnitudes at room temperature even for very dilute macromolecular solutions."
  },
  {
    "id": "c12_q2",
    "question": "An azeotropic mixture of two liquids boils at a lower temperature than either of them when:",
    "options": [
      "It shows positive deviation from Raoult's law",
      "It shows negative deviation from Raoult's law",
      "It is an ideal solution",
      "Components have identical vapor pressures"
    ],
    "correct_answer": "A",
    "domain": "Solutions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "A minimum boiling azeotrope forms when strong positive deviations produce a vapor pressure maximum at a specific composition."
  },
  {
    "id": "c12_q3",
    "question": "The van 't Hoff factor (i) for complete dissociation of potassium sulfate K2SO4 in dilute solution is:",
    "options": [
      "1",
      "2",
      "3",
      "4"
    ],
    "correct_answer": "C",
    "domain": "Solutions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "K2SO4 dissociates into 2 K+ and 1 SO4^2- ions, giving 3 particles per formula unit (i = 3)."
  },
  {
    "id": "c12_q4",
    "question": "According to Henry's law, the solubility of a gas in a liquid is directly proportional to:",
    "options": [
      "Temperature of liquid",
      "Partial pressure of the gas above the liquid",
      "Density of liquid",
      "Atmospheric humidity"
    ],
    "correct_answer": "B",
    "domain": "Solutions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Henry's Law states p = K_H * x, where partial pressure of the gas is directly proportional to its mole fraction in solution."
  },
  {
    "id": "c12_q5",
    "question": "If 0.1 mol of solute is dissolved in 1 kg of solvent, the concentration of the solution is called:",
    "options": [
      "0.1 Molar",
      "0.1 Molal",
      "0.1 Normal",
      "0.1 Formal"
    ],
    "correct_answer": "B",
    "domain": "Concentration Terms",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Molality (m) is defined as moles of solute per kilogram of solvent (0.1 mol / 1 kg = 0.1 m)."
  },
  {
    "id": "c12_q6",
    "question": "The SI unit of molar conductivity (\u039b_m) is:",
    "options": [
      "S cm^-1",
      "S m^2 mol^-1",
      "S m^-1",
      "\u03a9^-1 m^-1"
    ],
    "correct_answer": "B",
    "domain": "Electrochemistry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Molar conductivity \u039b_m = \u03ba / c has SI units Siemens meter squared per mole (S m^2 mol^-1)."
  },
  {
    "id": "c12_q7",
    "question": "Kohlrausch's law of independent migration of ions is valid at:",
    "options": [
      "High concentrations",
      "Infinite dilution",
      "Any concentration",
      "Saturation point"
    ],
    "correct_answer": "B",
    "domain": "Electrochemistry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "At infinite dilution, interionic interactions become negligible, allowing each ion to migrate independently."
  },
  {
    "id": "c12_q8",
    "question": "During discharge of a lead-acid storage battery, which substance is formed at both electrodes?",
    "options": [
      "PbO2",
      "PbSO4",
      "Pb",
      "H2SO4"
    ],
    "correct_answer": "B",
    "domain": "Batteries",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Both lead anode and lead dioxide cathode react with sulfuric acid to produce lead(II) sulfate (PbSO4) and water."
  },
  {
    "id": "c12_q9",
    "question": "How many Coulombs of charge are required to reduce 1 mole of Al3+ to Al metal?",
    "options": [
      "96,500 C",
      "193,000 C",
      "289,500 C",
      "579,000 C"
    ],
    "correct_answer": "C",
    "domain": "Faraday's Laws",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Al3+ + 3e- -> Al. 1 mole of Al requires 3 Faradays of charge = 3 * 96,500 C = 289,500 C."
  },
  {
    "id": "c12_q10",
    "question": "The cell reaction is spontaneous in the forward direction when:",
    "options": [
      "\u0394G\u00b0 > 0 and E\u00b0_cell < 0",
      "\u0394G\u00b0 < 0 and E\u00b0_cell > 0",
      "\u0394G\u00b0 = 0",
      "E\u00b0_cell = 0"
    ],
    "correct_answer": "B",
    "domain": "Thermodynamics",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Spontaneity requires negative Gibbs free energy change (\u0394G\u00b0 = -n F E\u00b0_cell < 0), meaning E\u00b0_cell must be positive."
  },
  {
    "id": "c12_q11",
    "question": "For a first-order chemical reaction, the half-life period (t_1/2) is:",
    "options": [
      "Directly proportional to initial concentration",
      "Inversely proportional to initial concentration",
      "Independent of initial concentration",
      "Proportional to square root of concentration"
    ],
    "correct_answer": "C",
    "domain": "Chemical Kinetics",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "For first order, t_1/2 = 0.693 / k, which is strictly independent of initial reactant concentration [A]_0."
  },
  {
    "id": "c12_q12",
    "question": "The slope of the Arrhenius plot of ln(k) versus 1/T equals:",
    "options": [
      "-E_a / R",
      "E_a / R",
      "-E_a / (2.303 R)",
      "A / R"
    ],
    "correct_answer": "A",
    "domain": "Arrhenius Equation",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "ln(k) = ln(A) - (E_a / R)(1/T). Plotting ln(k) vs 1/T yields a straight line with slope -E_a / R."
  },
  {
    "id": "c12_q13",
    "question": "In a zero-order reaction, the unit of rate constant k is identical to the unit of:",
    "options": [
      "Reaction rate (mol L^-1 s^-1)",
      "Time (s^-1)",
      "Concentration (mol L^-1)",
      "Dimensionless"
    ],
    "correct_answer": "A",
    "domain": "Reaction Kinetics",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Rate = k [A]^0 = k. Thus k has the same dimensions as rate: mol L^-1 s^-1."
  },
  {
    "id": "c12_q14",
    "question": "A catalyst accelerates a chemical reaction primarily by:",
    "options": [
      "Increasing collision frequency only",
      "Lowering the activation energy barrier",
      "Shifting the chemical equilibrium position",
      "Increasing reactant enthalpy"
    ],
    "correct_answer": "B",
    "domain": "Catalysis",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "A catalyst provides an alternative reaction pathway with a lower activation energy (E_a)."
  },
  {
    "id": "c12_q15",
    "question": "The molecularity of an elementary reaction CANNOT be:",
    "options": [
      "1",
      "2",
      "3",
      "0 or a fraction"
    ],
    "correct_answer": "D",
    "domain": "Reaction Mechanisms",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Molecularity represents the number of colliding species in an elementary step and must be a positive integer (cannot be 0 or fractional)."
  },
  {
    "id": "c12_q16",
    "question": "If the rate of a reaction doubles when concentration of reactant is quadrupled, the reaction order is:",
    "options": [
      "0",
      "0.5 (Half-order)",
      "1",
      "2"
    ],
    "correct_answer": "B",
    "domain": "Reaction Order",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Rate2 / Rate1 = ([A]2 / [A]1)^n -> 2 = (4)^n -> 2 = 2^(2n) -> 2n = 1 -> n = 1/2."
  },
  {
    "id": "c12_q17",
    "question": "Radioactive decay of unstable nuclides follows which order kinetics?",
    "options": [
      "Zero order",
      "First order",
      "Second order",
      "Pseudo-first order"
    ],
    "correct_answer": "B",
    "domain": "Nuclear Chemistry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "All natural and artificial radioactive decays proceed strictly via first-order kinetics."
  },
  {
    "id": "c12_q18",
    "question": "The minimum energy required by colliding reactant molecules to form products is called:",
    "options": [
      "Potential energy",
      "Activation energy",
      "Threshold energy",
      "Kinetic energy"
    ],
    "correct_answer": "C",
    "domain": "Collision Theory",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Threshold energy is the minimum total energy colliding molecules must possess to react (Threshold = Initial + Activation)."
  },
  {
    "id": "c12_q19",
    "question": "In a pseudo-first-order reaction, one of the reactants is:",
    "options": [
      "Present in large excess (e.g. solvent)",
      "A gaseous catalyst",
      "Insoluble in water",
      "Completely unreactive"
    ],
    "correct_answer": "A",
    "domain": "Chemical Kinetics",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Hydrolysis of ester in water behaves as pseudo-first-order because water is in large excess, keeping its concentration virtually constant."
  },
  {
    "id": "c12_q20",
    "question": "For reaction A -> B, rate constant k = 2.0 x 10^-3 s^-1. What is the order of reaction?",
    "options": [
      "Zero",
      "First",
      "Second",
      "Third"
    ],
    "correct_answer": "B",
    "domain": "Kinetics Units",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "The unit s^-1 uniquely identifies a first-order rate constant."
  },
  {
    "id": "c12_q21",
    "question": "The steady decrease in atomic and ionic radii across the lanthanoid series is termed:",
    "options": [
      "Actinoid contraction",
      "Lanthanoid contraction",
      "Shielding effect",
      "Inert pair effect"
    ],
    "correct_answer": "B",
    "domain": "Inorganic Chemistry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Poor shielding of nuclear charge by 4f electrons causes the regular reduction in ionic radius known as lanthanoid contraction."
  },
  {
    "id": "c12_q22",
    "question": "Which transition metal ion in aqueous solution is colorless due to lack of d-d transitions?",
    "options": [
      "Cu2+",
      "Fe3+",
      "Zn2+",
      "Cr3+"
    ],
    "correct_answer": "C",
    "domain": "Transition Metals",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Zn2+ has a fully filled d-subshell (3d^10). With no vacant d orbitals, d-d electron transitions cannot occur."
  },
  {
    "id": "c12_q23",
    "question": "The spin-only magnetic moment of an ion with 4 unpaired electrons is approximately:",
    "options": [
      "2.84 BM",
      "3.87 BM",
      "4.90 BM",
      "5.92 BM"
    ],
    "correct_answer": "C",
    "domain": "Magnetic Properties",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "\u03bc = \u221a(n(n + 2)) BM. For n = 4: \u03bc = \u221a(4(6)) = \u221a24 \u2248 4.90 Bohr Magnetons."
  },
  {
    "id": "c12_q24",
    "question": "What is the IUPAC name of coordination complex [Co(NH3)5(CO3)]Cl?",
    "options": [
      "Pentaamminecarbonatocobalt(III) chloride",
      "Carbonatopentaamminecobalt(II) chloride",
      "Pentaamminecobalt(III) carbonate chloride",
      "Cobalt pentaammine carbonate"
    ],
    "correct_answer": "A",
    "domain": "IUPAC Nomenclature",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Ligands are named alphabetically (ammine before carbonato), followed by metal with Roman oxidation number: pentaamminecarbonatocobalt(III) chloride."
  },
  {
    "id": "c12_q25",
    "question": "The coordination number and oxidation state of Fe in potassium ferricyanide K3[Fe(CN)6] are:",
    "options": [
      "6 and +2",
      "6 and +3",
      "4 and +2",
      "4 and +3"
    ],
    "correct_answer": "B",
    "domain": "Coordination Compounds",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "There are 6 cyanide ligands (coordination number = 6). 3(+1) + Fe + 6(-1) = 0 -> Fe = +3."
  },
  {
    "id": "c12_q26",
    "question": "Which type of isomerism is exhibited by [Co(NH3)5(SO4)]Br and [Co(NH3)5Br]SO4?",
    "options": [
      "Linkage isomerism",
      "Ionization isomerism",
      "Coordination isomerism",
      "Hydrate isomerism"
    ],
    "correct_answer": "B",
    "domain": "Isomerism",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "They yield different ions in solution (one gives BaSO4 precipitate with BaCl2, the other gives AgBr with AgNO3)."
  },
  {
    "id": "c12_q27",
    "question": "According to Crystal Field Theory, in an octahedral crystal field, the d-orbitals split into:",
    "options": [
      "t2g (triply degenerate, lower) and eg (doubly degenerate, higher)",
      "eg lower and t2g higher",
      "Five non-degenerate levels",
      "Two sets of equal energy"
    ],
    "correct_answer": "A",
    "domain": "Crystal Field Theory",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Octahedral ligand electrostatic repulsion raises eg orbitals (dx2-y2, dz2) above the t2g orbitals (dxy, dyz, dxz)."
  },
  {
    "id": "c12_q28",
    "question": "Potassium permanganate KMnO4 exhibits an intense purple color in solution due to:",
    "options": [
      "d-d transition",
      "Charge transfer from ligand to metal (LMCT)",
      "Polarization of water",
      "f-d transition"
    ],
    "correct_answer": "B",
    "domain": "Color of Complexes",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Mn is in the +7 oxidation state (d^0). Color arises from intense ligand-to-metal charge transfer (O2- -> Mn7+)."
  },
  {
    "id": "c12_q29",
    "question": "Which transition metal exhibits the highest oxidation state in its compounds?",
    "options": [
      "Manganese (+7)",
      "Osmium (+8)",
      "Iron (+6)",
      "Vanadium (+5)"
    ],
    "correct_answer": "B",
    "domain": "Transition Metals",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Osmium and Ruthenium attain the +8 oxidation state in oxides like OsO4."
  },
  {
    "id": "c12_q30",
    "question": "A polydentate ligand that binds to a central metal atom through two or more donor atoms to form a ring is a:",
    "options": [
      "Chelating ligand",
      "Ambidentate ligand",
      "Monodentate ligand",
      "Bridging ligand"
    ],
    "correct_answer": "A",
    "domain": "Coordination Chemistry",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Chelating ligands like ethylenediamine (en) or EDTA form stable ring structures with central metals."
  },
  {
    "id": "c12_q31",
    "question": "The SN2 reaction mechanism proceeds with:",
    "options": [
      "Complete retention of configuration",
      "Complete inversion of configuration (Walden inversion)",
      "Racemization (50:50 mixture)",
      "No change in stereochemistry"
    ],
    "correct_answer": "B",
    "domain": "Organic Mechanisms",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Backside nucleophilic attack opposite the leaving group forces complete inversion of stereochemical configuration."
  },
  {
    "id": "c12_q32",
    "question": "Which alkyl halide undergoes SN1 nucleophilic substitution most rapidly?",
    "options": [
      "Methyl chloride",
      "Ethyl chloride",
      "Isopropyl chloride",
      "tert-Butyl chloride"
    ],
    "correct_answer": "D",
    "domain": "Organic Mechanisms",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "SN1 rate is governed by carbocation stability. The tertiary carbocation (CH3)3C+ is highly stabilized by hyperconjugation and inductive effect."
  },
  {
    "id": "c12_q33",
    "question": "Reaction of chlorobenzene with sodium metal in dry ether to yield biphenyl is known as:",
    "options": [
      "Wurtz reaction",
      "Fittig reaction",
      "Wurtz-Fittig reaction",
      "Frankland reaction"
    ],
    "correct_answer": "B",
    "domain": "Named Reactions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "The coupling of two aryl halides using sodium metal in dry ether is the Fittig reaction."
  },
  {
    "id": "c12_q34",
    "question": "Phenol is more acidic than ethanol primarily because:",
    "options": [
      "Phenoxide ion is resonance-stabilized",
      "Ethanol has a larger molecular mass",
      "Ethoxide ion has more resonance forms",
      "Phenol contains an sp3 hybridized carbon"
    ],
    "correct_answer": "A",
    "domain": "Acidity of Phenols",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "The phenoxide conjugate base delocalizes negative charge across the aromatic ring, making phenol substantially more acidic."
  },
  {
    "id": "c12_q35",
    "question": "Lucas reagent used to differentiate primary, secondary, and tertiary alcohols is a mixture of:",
    "options": [
      "Anhydrous ZnCl2 and concentrated HCl",
      "Concentrated H2SO4 and HNO3",
      "Dilute HCl and Zn dust",
      "KMnO4 and H2SO4"
    ],
    "correct_answer": "A",
    "domain": "Alcohol Tests",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Lucas reagent (anhydrous ZnCl2 + conc. HCl) produces immediate turbidity with tertiary alcohols, within 5 mins for secondary, and not at room temperature for primary."
  },
  {
    "id": "c12_q36",
    "question": "Cannizzaro reaction is NOT given by which of the following aldehydes?",
    "options": [
      "Formaldehyde (HCHO)",
      "Benzaldehyde (C6H5CHO)",
      "Acetaldehyde (CH3CHO)",
      "Trimethylacetaldehyde ((CH3)3CCHO)"
    ],
    "correct_answer": "C",
    "domain": "Named Reactions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Cannizzaro reaction requires aldehydes having NO alpha-hydrogen atoms. Acetaldehyde contains three alpha-hydrogens and undergoes aldol condensation instead."
  },
  {
    "id": "c12_q37",
    "question": "The chemical reaction used to convert an amide into a primary amine with one less carbon atom is:",
    "options": [
      "Gabriel phthalimide synthesis",
      "Hoffmann bromamide degradation",
      "Clemmensen reduction",
      "Rosenmund reduction"
    ],
    "correct_answer": "B",
    "domain": "Named Reactions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Treatment of an amide with Br2 and alkali produces an amine with one fewer carbon: RCONH2 + Br2 + 4KOH -> RNH2 + K2CO3 + 2KBr + 2H2O."
  },
  {
    "id": "c12_q38",
    "question": "Which functional group test produces a silver mirror on the inner glass wall of a test tube?",
    "options": [
      "Fehling's test",
      "Tollens' test",
      "Benedict's test",
      "Biuret test"
    ],
    "correct_answer": "B",
    "domain": "Organic Analysis",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Aldehydes reduce ammoniacal silver nitrate (Tollens' reagent) to metallic silver while being oxidized to carboxylate ions."
  },
  {
    "id": "c12_q39",
    "question": "In aqueous solution, the correct order of basic strength of methyl-substituted amines is:",
    "options": [
      "(CH3)2NH > CH3NH2 > (CH3)3N > NH3",
      "(CH3)3N > (CH3)2NH > CH3NH2 > NH3",
      "CH3NH2 > (CH3)2NH > (CH3)3N > NH3",
      "NH3 > CH3NH2 > (CH3)2NH > (CH3)3N"
    ],
    "correct_answer": "A",
    "domain": "Amines Basicity",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Due to combined inductive effect, hydration stabilization, and steric hindrance, secondary dimethylamine is strongest: 2\u00b0 > 1\u00b0 > 3\u00b0 > NH3."
  },
  {
    "id": "c12_q40",
    "question": "Reduction of carbonyl compounds to alkanes using zinc amalgam and concentrated hydrochloric acid is:",
    "options": [
      "Clemmensen reduction",
      "Wolff-Kishner reduction",
      "Stephen reduction",
      "Birch reduction"
    ],
    "correct_answer": "A",
    "domain": "Named Reactions",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Clemmensen reduction converts aldehydes and ketones directly into hydrocarbon methylene groups (>C=O -> >CH2) using Zn(Hg)/HCl."
  },
  {
    "id": "c12_q41",
    "question": "The linkage connecting two monosaccharide units in a disaccharide or polysaccharide is called a:",
    "options": [
      "Peptide bond",
      "Glycosidic bond",
      "Phosphodiester bond",
      "Ester bond"
    ],
    "correct_answer": "B",
    "domain": "Biomolecules",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "An oxide linkage between two monosaccharide rings formed by loss of water is a glycosidic bond."
  },
  {
    "id": "c12_q42",
    "question": "Which nitrogenous base is present in RNA but NOT in DNA?",
    "options": [
      "Thymine",
      "Uracil",
      "Cytosine",
      "Adenine"
    ],
    "correct_answer": "B",
    "domain": "Nucleic Acids",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "RNA contains Uracil (U) in place of the Thymine (T) found in DNA."
  },
  {
    "id": "c12_q43",
    "question": "Amino acids in proteins are linked together by:",
    "options": [
      "Glycosidic bonds",
      "Peptide (amide) bonds",
      "Ether linkages",
      "Disulfide bridges only"
    ],
    "correct_answer": "B",
    "domain": "Proteins",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Peptide bonds (-CO-NH-) form between the alpha-amino group of one amino acid and the alpha-carboxyl group of another."
  },
  {
    "id": "c12_q44",
    "question": "Which of the following vitamins is water-soluble?",
    "options": [
      "Vitamin A",
      "Vitamin D",
      "Vitamin C",
      "Vitamin K"
    ],
    "correct_answer": "C",
    "domain": "Vitamins",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Vitamins B and C are water-soluble and must be regularly supplied in diet, unlike fat-soluble vitamins A, D, E, K."
  },
  {
    "id": "c12_q45",
    "question": "Denaturation of proteins disrupts which structural levels?",
    "options": [
      "Primary structure only",
      "Secondary and tertiary structures",
      "Primary, secondary, and tertiary structures",
      "None"
    ],
    "correct_answer": "B",
    "domain": "Proteins",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Denaturation unfolds the tertiary and secondary polypeptide architectures via heat or pH changes, leaving primary covalent peptide chains intact."
  },
  {
    "id": "c12_q46",
    "question": "The helical structure of DNA is stabilized primarily by:",
    "options": [
      "Covalent bonds",
      "Hydrogen bonds between complementary base pairs",
      "Ionic bonds",
      "Disulfide linkages"
    ],
    "correct_answer": "B",
    "domain": "Nucleic Acids",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Watson-Crick base pairing features two hydrogen bonds between Adenine and Thymine (A=T) and three between Guanine and Cytosine (G\u2261C)."
  },
  {
    "id": "c12_q47",
    "question": "An amino acid that cannot be synthesized by the human body and must be obtained from food is classified as:",
    "options": [
      "Essential amino acid",
      "Non-essential amino acid",
      "Acidic amino acid",
      "Neutral amino acid"
    ],
    "correct_answer": "A",
    "domain": "Biomolecules",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Essential amino acids (e.g. leucine, lysine, valine) cannot be synthesized de novo by humans and must be ingested."
  },
  {
    "id": "c12_q48",
    "question": "Which carbohydrate acts as the primary reserve energy storage polysaccharide in animals?",
    "options": [
      "Starch",
      "Glycogen",
      "Cellulose",
      "Amylopectin"
    ],
    "correct_answer": "B",
    "domain": "Carbohydrates",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Glycogen (animal starch) is stored in the liver and skeletal muscles to maintain glucose homeostasis."
  },
  {
    "id": "c12_q49",
    "question": "At its isoelectric point (pI), an amino acid exists predominantly as a:",
    "options": [
      "Positively charged cation",
      "Negatively charged anion",
      "Dipolar Zwitterion with net charge zero",
      "Neutral un-ionized molecule"
    ],
    "correct_answer": "C",
    "domain": "Amino Acids",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "At pI, the internal proton transfer yields a dipolar Zwitterion (+H3N-CHR-COO-) with zero net electrical mobility in an electric field."
  },
  {
    "id": "c12_q50",
    "question": "The deficiency of Vitamin D in children leads to the bone disease:",
    "options": [
      "Scurvy",
      "Rickets",
      "Night blindness",
      "Beri-beri"
    ],
    "correct_answer": "B",
    "domain": "Vitamins",
    "marks": 2.0,
    "negative_marks": 0.0,
    "explanation": "Vitamin D deficiency impairs calcium and phosphate mineralization in growing bones, resulting in childhood rickets."
  }
]
    }
]


CORPORATE_PLACEMENT_MOCK_TESTS = [
    {
        "company_name": "TCS",
        "company_slug": "tcs",
        "company_logo": "tcs",
        "title": "TCS NQT 2026 - Numerical & Reasoning Qualifier",
        "description": "Comprehensive corporate test pattern covering Quantitative Aptitude, Logical Reasoning, and Verbal Ability modeled after the latest TCS National Qualifier Test pattern.",
        "category": "Aptitude & Cognitive",
        "difficulty": "Medium",
        "price_inr": 9,
        "duration_minutes": 30,
        "total_questions": 10,
        "pass_percentage": 50,
        "display_order": 1,
        "questions": [
            {
                "id": "tcs_q1",
                "question": "If a sum of money doubles itself at compound interest in 5 years, in how many years will it become 8 times of itself at the same rate of interest?",
                "options": ["10 years", "12 years", "15 years", "20 years"],
                "correct_answer": "C",
                "explanation": "If money becomes 2^1 in 5 years, it will become 2^3 (= 8 times) in 3 * 5 = 15 years."
            },
            {
                "id": "tcs_q2",
                "question": "A train 180 meters long is running at a speed of 54 km/h. How many seconds will it take to pass a railway platform 120 meters long?",
                "options": ["15 seconds", "20 seconds", "25 seconds", "18 seconds"],
                "correct_answer": "B",
                "explanation": "Total distance = 180 + 120 = 300m. Speed = 54 * (5/18) = 15 m/s. Time = Distance / Speed = 300 / 15 = 20 seconds."
            },
            {
                "id": "tcs_q3",
                "question": "Find the missing number in the sequence: 4, 18, 48, 100, 180, ?",
                "options": ["244", "294", "312", "276"],
                "correct_answer": "B",
                "explanation": "Pattern: n^3 - n^2 for n=2,3,4,5,6,7. For n=7: 7^3 - 7^2 = 343 - 49 = 294."
            },
            {
                "id": "tcs_q4",
                "question": "Pointing to a photograph, Rohit said, 'She is the daughter of my grandfather's only son.' How is Rohit related to the girl in the photograph?",
                "options": ["Father", "Brother", "Cousin", "Uncle"],
                "correct_answer": "B",
                "explanation": "Grandfather's only son is Rohit's father. The daughter of Rohit's father is Rohit's sister, making Rohit her brother."
            },
            {
                "id": "tcs_q5",
                "question": "In a certain code language, 'COMPUTER' is written as 'RFUVQNPC'. How will 'MEDICINE' be written in that code?",
                "options": ["EOJDJEFM", "EOJDEJFM", "MFEJDJOE", "EOJDJFEM"],
                "correct_answer": "A",
                "explanation": "The first and last letters are swapped (M and E swap to E and M), and the intermediate letters are shifted by +1 in reverse order."
            },
            {
                "id": "tcs_q6",
                "question": "What is the time complexity of searching an element in a balanced Binary Search Tree (AVL tree)?",
                "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
                "correct_answer": "C",
                "explanation": "In a balanced BST like an AVL tree, the height is guaranteed to be O(log n), so search takes O(log n) time."
            },
            {
                "id": "tcs_q7",
                "question": "Which scheduling algorithm among the following is non-preemptive by default?",
                "options": ["Round Robin", "Shortest Remaining Time First (SRTF)", "First Come First Served (FCFS)", "Priority Scheduling (Preemptive)"],
                "correct_answer": "C",
                "explanation": "FCFS (First Come First Served) always executes processes to completion without preemption."
            },
            {
                "id": "tcs_q8",
                "question": "Choose the most appropriate synonym for the word 'PRAGMATIC':",
                "options": ["Idealistic", "Theoretical", "Practical", "Careless"],
                "correct_answer": "C",
                "explanation": "Pragmatic means dealing with things sensibly and realistically based on practical rather than theoretical considerations."
            },
            {
                "id": "tcs_q9",
                "question": "Two dice are rolled simultaneously. What is the probability that the sum of the numbers appearing on both dice is equal to 8?",
                "options": ["5/36", "1/6", "7/36", "1/9"],
                "correct_answer": "A",
                "explanation": "Pairs with sum = 8 are (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes out of 36. Probability = 5/36."
            },
            {
                "id": "tcs_q10",
                "question": "What does ACID stand for in Database Management Systems?",
                "options": [
                    "Atomicity, Consistency, Isolation, Durability",
                    "Accuracy, Consistency, Integrity, Dependency",
                    "Atomicity, Concurrency, Isolation, Durability",
                    "Access, Control, Identity, Data"
                ],
                "correct_answer": "A",
                "explanation": "ACID properties ensure reliable database transaction processing: Atomicity, Consistency, Isolation, and Durability."
            }
        ]
    },
    {
        "company_name": "Infosys",
        "company_slug": "infosys",
        "company_logo": "infosys",
        "title": "Infosys SP/DSE - Technical & Reasoning Mock",
        "description": "Specialist Programmer and Digital Specialist Engineer assessment covering Data Structures, Pseudocode Interpretation, and Analytical Problem Solving.",
        "category": "Technical & Logical",
        "difficulty": "Hard",
        "price_inr": 12,
        "duration_minutes": 35,
        "total_questions": 10,
        "pass_percentage": 50,
        "display_order": 2,
        "questions": [
            {
                "id": "inf_q1",
                "question": "What is the worst-case space complexity of QuickSort when implemented recursively with in-place partitioning?",
                "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
                "correct_answer": "C",
                "explanation": "In the worst case (unbalanced partitioning e.g. already sorted array), the call stack depth reaches O(n)."
            },
            {
                "id": "inf_q2",
                "question": "Consider an array A = [4, 5, 2, 10, 8]. What is the Next Greater Element for element 2?",
                "options": ["4", "5", "10", "8"],
                "correct_answer": "C",
                "explanation": "Looking to the right of element 2 in [4, 5, 2, 10, 8], the first greater element is 10."
            },
            {
                "id": "inf_q3",
                "question": "Which normal form guarantees the elimination of all transitive functional dependencies?",
                "options": ["First Normal Form (1NF)", "Second Normal Form (2NF)", "Third Normal Form (3NF)", "BCNF"],
                "correct_answer": "C",
                "explanation": "3NF requires the relation to be in 2NF and have no transitive dependencies on candidate keys."
            },
            {
                "id": "inf_q4",
                "question": "If x + 1/x = 3, what is the value of x^3 + 1/x^3?",
                "options": ["27", "18", "21", "24"],
                "correct_answer": "B",
                "explanation": "x^3 + 1/x^3 = (x + 1/x)^3 - 3*(x + 1/x) = 3^3 - 3(3) = 27 - 9 = 18."
            },
            {
                "id": "inf_q5",
                "question": "Which of the following data structures is typically used to implement Dijkstra's Shortest Path algorithm efficiently?",
                "options": ["Queue (FIFO)", "Stack (LIFO)", "Min-Heap / Priority Queue", "Circular Linked List"],
                "correct_answer": "C",
                "explanation": "A Min-Heap allows extracting the minimum distance vertex in O(log V) time, resulting in O((V + E) log V) total complexity."
            },
            {
                "id": "inf_q6",
                "question": "In Python, which function converts an iterable of key-value pairs directly into a dictionary?",
                "options": ["map()", "dict()", "set()", "zip()"],
                "correct_answer": "B",
                "explanation": "dict([('a', 1), ('b', 2)]) creates {'a': 1, 'b': 2}."
            },
            {
                "id": "inf_q7",
                "question": "Statement: 'All cars are vehicles. Some vehicles are electric.' Conclusion I: Some cars are electric. Conclusion II: All vehicles are cars.",
                "options": ["Only I follows", "Only II follows", "Neither I nor II follows", "Both I and II follow"],
                "correct_answer": "C",
                "explanation": "The electric vehicles might not intersect with cars, so Neither follows."
            },
            {
                "id": "inf_q8",
                "question": "In Java, what does the keyword 'final' applied to a class indicate?",
                "options": [
                    "The class cannot be instantiated.",
                    "The class cannot be subclassed/extended.",
                    "All methods inside the class must be static.",
                    "The class is eligible for garbage collection immediately."
                ],
                "correct_answer": "B",
                "explanation": "A final class in Java cannot be inherited by any other class (e.g. java.lang.String)."
            },
            {
                "id": "inf_q9",
                "question": "A man sells an article for ₹840 making a profit of 20%. What was the cost price of the article?",
                "options": ["₹680", "₹700", "₹720", "₹750"],
                "correct_answer": "B",
                "explanation": "Cost Price = Selling Price / (1 + Profit%) = 840 / 1.20 = ₹700."
            },
            {
                "id": "inf_q10",
                "question": "What is the primary role of the ARP (Address Resolution Protocol) in computer networking?",
                "options": [
                    "Translates MAC address to IP address",
                    "Translates IP address to physical MAC address",
                    "Resolves domain names to IP addresses",
                    "Provides secure encryption at Transport Layer"
                ],
                "correct_answer": "B",
                "explanation": "ARP maps a 32-bit logical IPv4 address to a 48-bit physical MAC address on a local area network."
            }
        ]
    },
    {
        "company_name": "HCLTech",
        "company_slug": "hcl",
        "company_logo": "hcl",
        "title": "HCLTech First Careers - Foundation Aptitude Test",
        "description": "Tailored for fresh engineering graduates covering Quantitative Techniques, Logical Deduction, Basic IT and Networking Concepts.",
        "category": "Aptitude & Tech Core",
        "difficulty": "Medium",
        "price_inr": 9,
        "duration_minutes": 30,
        "total_questions": 10,
        "pass_percentage": 50,
        "display_order": 3,
        "questions": [
            {
                "id": "hcl_q1",
                "question": "A person can finish a work in 12 days and B can finish the same work in 24 days. Working together, in how many days can they complete the work?",
                "options": ["6 days", "8 days", "10 days", "16 days"],
                "correct_answer": "B",
                "explanation": "1/12 + 1/24 = 3/24 = 1/8 work per day. They will complete it together in 8 days."
            },
            {
                "id": "hcl_q2",
                "question": "Which layer of the OSI reference model is responsible for end-to-end reliability and flow control?",
                "options": ["Network Layer", "Transport Layer", "Session Layer", "Data Link Layer"],
                "correct_answer": "B",
                "explanation": "The Transport Layer (Layer 4) handles end-to-end error recovery, flow control, and segmentation."
            },
            {
                "id": "hcl_q3",
                "question": "Find the odd one out: 27, 64, 125, 216, 343, 512, 729, 1001",
                "options": ["216", "343", "729", "1001"],
                "correct_answer": "D",
                "explanation": "All numbers are perfect cubes except 1001 (10^3 is 1000)."
            },
            {
                "id": "hcl_q4",
                "question": "In SQL, which clause is used to filter records resulting from a GROUP BY operation?",
                "options": ["WHERE", "ORDER BY", "HAVING", "LIMIT"],
                "correct_answer": "C",
                "explanation": "HAVING applies conditions to aggregated groups, whereas WHERE applies conditions before grouping."
            },
            {
                "id": "hcl_q5",
                "question": "A bag contains 5 red balls, 4 blue balls, and 3 green balls. One ball is drawn at random. What is the probability that it is NOT blue?",
                "options": ["1/3", "2/3", "5/12", "7/12"],
                "correct_answer": "B",
                "explanation": "Total balls = 12. Non-blue balls = 5 red + 3 green = 8. Probability = 8/12 = 2/3."
            },
            {
                "id": "hcl_q6",
                "question": "What is the result of the bitwise expression: (12 & 10) in decimal?",
                "options": ["8", "10", "12", "14"],
                "correct_answer": "A",
                "explanation": "12 in binary is 1100, 10 is 1010. 1100 & 1010 = 1000 in binary = 8 in decimal."
            },
            {
                "id": "hcl_q7",
                "question": "Choose the correctly spelled word:",
                "options": ["Accomodation", "Accommodation", "Acommodation", "Acomodation"],
                "correct_answer": "B",
                "explanation": "The correct spelling is 'Accommodation' with double 'c' and double 'm'."
            },
            {
                "id": "hcl_q8",
                "question": "Which of the following sorting algorithms is Stable by nature?",
                "options": ["Merge Sort", "Heap Sort", "Selection Sort", "Quick Sort"],
                "correct_answer": "A",
                "explanation": "Merge Sort preserves the relative order of equal elements and is intrinsically stable."
            },
            {
                "id": "hcl_q9",
                "question": "What does HTTP status code 403 signify?",
                "options": ["Not Found", "Unauthorized", "Forbidden", "Bad Gateway"],
                "correct_answer": "C",
                "explanation": "403 Forbidden indicates that the server understands the request but refuses to authorize it."
            },
            {
                "id": "hcl_q10",
                "question": "If North-East becomes South, and South-East becomes West, what will West become?",
                "options": ["North-East", "South-East", "North-West", "South"],
                "correct_answer": "A",
                "explanation": "Each direction is rotated 135 degrees clockwise. West rotated 135 degrees clockwise becomes North-East."
            }
        ]
    },
    {
        "company_name": "Wipro",
        "company_slug": "wipro",
        "company_logo": "wipro",
        "title": "Wipro Elite NLTH - Aptitude Qualifier (Free Access)",
        "description": "Free National Level Talent Hunt practice test designed to test quantitative problem solving, logical reasoning, and English grammar skills.",
        "category": "Aptitude & Quantitative",
        "difficulty": "Easy",
        "price_inr": 0,
        "duration_minutes": 25,
        "total_questions": 10,
        "pass_percentage": 50,
        "display_order": 4,
        "questions": [
            {
                "id": "wip_q1",
                "question": "The average of five consecutive even numbers is 34. What is the smallest of these numbers?",
                "options": ["28", "30", "32", "36"],
                "correct_answer": "B",
                "explanation": "For 5 consecutive numbers, average is the middle number: 30, 32, 34, 36, 38. Smallest is 30."
            },
            {
                "id": "wip_q2",
                "question": "What is the binary representation of the decimal number 35?",
                "options": ["100011", "100101", "100001", "101011"],
                "correct_answer": "A",
                "explanation": "35 = 32 + 2 + 1 = 100011 in base 2."
            },
            {
                "id": "wip_q3",
                "question": "Fill in the blank: Neither the teacher nor the students ______ present in the auditorium.",
                "options": ["was", "were", "is", "have"],
                "correct_answer": "B",
                "explanation": "When subjects are joined by 'neither... nor', the verb agrees with the closer subject ('students' -> 'were')."
            },
            {
                "id": "wip_q4",
                "question": "A shopkeeper marks an item 30% above cost price and allows a discount of 10%. What is his net gain percentage?",
                "options": ["17%", "20%", "23%", "15%"],
                "correct_answer": "A",
                "explanation": "Net multiplier = 1.30 * 0.90 = 1.17 -> 17% profit."
            },
            {
                "id": "wip_q5",
                "question": "Which protocol is primarily used for secure transfer of web pages over the internet?",
                "options": ["FTP", "SMTP", "HTTPS", "TELNET"],
                "correct_answer": "C",
                "explanation": "HTTPS (Hypertext Transfer Protocol Secure) encrypts communication using TLS/SSL."
            },
            {
                "id": "wip_q6",
                "question": "If CLOCK is coded as KCOLC, how will WATCH be coded?",
                "options": ["HCTAW", "HTCAW", "HCTWA", "WAHTC"],
                "correct_answer": "A",
                "explanation": "The word is simply reversed: WATCH -> HCTAW."
            },
            {
                "id": "wip_q7",
                "question": "Which of the following is a volatile memory?",
                "options": ["ROM", "Hard Disk Drive", "RAM", "Flash SSD"],
                "correct_answer": "C",
                "explanation": "RAM (Random Access Memory) requires power to maintain data; when power is lost, data is erased."
            },
            {
                "id": "wip_q8",
                "question": "What is the value of 15% of 240 + 25% of 120?",
                "options": ["56", "66", "72", "60"],
                "correct_answer": "B",
                "explanation": "15% of 240 = 36. 25% of 120 = 30. Total = 36 + 30 = 66."
            },
            {
                "id": "wip_q9",
                "question": "In Object-Oriented Programming, wrapping data and methods into a single unit is known as:",
                "options": ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction"],
                "correct_answer": "C",
                "explanation": "Encapsulation binds data members and member functions into a cohesive class container."
            },
            {
                "id": "wip_q10",
                "question": "A clock shows 3:00. What is the angle between the hour hand and the minute hand?",
                "options": ["45 degrees", "60 degrees", "90 degrees", "120 degrees"],
                "correct_answer": "C",
                "explanation": "At 3:00, the hour hand is at 3 (90 degrees from top) and minute hand is at 12 (0 degrees). Angle is 90 degrees."
            }
        ]
    },
    {
        "company_name": "Accenture",
        "company_slug": "accenture",
        "company_logo": "accenture",
        "title": "Accenture Cognitive & Communication Mock (Free Access)",
        "description": "Full practice test matching the Accenture on-campus placement assessment: Critical Thinking, Abstract Reasoning, and Technical Essentials.",
        "category": "Cognitive & Communication",
        "difficulty": "Easy",
        "price_inr": 0,
        "duration_minutes": 25,
        "total_questions": 10,
        "pass_percentage": 50,
        "display_order": 5,
        "questions": [
            {
                "id": "acc_q1",
                "question": "Choose the antonym for 'CANDID':",
                "options": ["Honest", "Deceitful", "Blunt", "Sincere"],
                "correct_answer": "B",
                "explanation": "Candid means straightforward and frank. The antonym is deceitful or secretive."
            },
            {
                "id": "acc_q2",
                "question": "If 8 men can build a wall in 10 days, how many men are required to build the same wall in 4 days?",
                "options": ["16", "20", "24", "12"],
                "correct_answer": "B",
                "explanation": "M1 * D1 = M2 * D2 -> 8 * 10 = M2 * 4 -> 80 = 4 * M2 -> M2 = 20 men."
            },
            {
                "id": "acc_q3",
                "question": "In Python, which keyword is used to handle exceptions?",
                "options": ["catch", "except", "throws", "rescue"],
                "correct_answer": "B",
                "explanation": "Python uses try...except blocks for error and exception handling."
            },
            {
                "id": "acc_q4",
                "question": "Which of the following is NOT an IP address in private address space?",
                "options": ["10.0.0.1", "172.16.0.5", "192.168.1.1", "8.8.8.8"],
                "correct_answer": "D",
                "explanation": "8.8.8.8 is Google's public DNS address; the other three are RFC 1918 private IPv4 ranges."
            },
            {
                "id": "acc_q5",
                "question": "Find the next letter in the series: B, D, G, K, P, ?",
                "options": ["S", "T", "V", "U"],
                "correct_answer": "C",
                "explanation": "Difference between alphabet positions: +2, +3, +4, +5, +6. P is 16; 16 + 6 = 22, which is letter V."
            },
            {
                "id": "acc_q6",
                "question": "What is the primary characteristic of an immutable object in software development?",
                "options": [
                    "Its state can be modified only inside its class.",
                    "Its state cannot be altered once it is created.",
                    "It cannot be accessed across different threads.",
                    "It has no member functions."
                ],
                "correct_answer": "B",
                "explanation": "An immutable object cannot have its internal state changed after construction."
            },
            {
                "id": "acc_q7",
                "question": "If a shirt marked at ₹500 is sold for ₹425, what is the discount percentage?",
                "options": ["12%", "15%", "18%", "20%"],
                "correct_answer": "B",
                "explanation": "Discount = ₹75. Percentage = (75 / 500) * 100 = 15%."
            },
            {
                "id": "acc_q8",
                "question": "In CSS, which property is used to create space INSIDE the border of an element?",
                "options": ["margin", "padding", "border-spacing", "outline"],
                "correct_answer": "B",
                "explanation": "Padding creates internal space within an element's border, while margin creates space outside."
            },
            {
                "id": "acc_q9",
                "question": "Which data structure follows the Last-In First-Out (LIFO) principle?",
                "options": ["Queue", "Tree", "Stack", "Linked List"],
                "correct_answer": "C",
                "explanation": "A Stack operates on LIFO (Last In First Out) principle."
            },
            {
                "id": "acc_q10",
                "question": "Identify the passive voice of: 'She wrote an insightful article.'",
                "options": [
                    "An insightful article was written by her.",
                    "An insightful article has been written by her.",
                    "An insightful article is written by her.",
                    "She was writing an insightful article."
                ],
                "correct_answer": "A",
                "explanation": "Past simple active 'wrote' transforms to past simple passive 'was written'."
            }
        ]
    },
    {
        "company_name": "TCS",
        "company_slug": "tcs",
        "company_logo": "tcs",
        "title": "TCS Digital - Advanced Quants & System Logic",
        "description": "High-package tier preparation for TCS Digital roles (₹7+ LPA) featuring advanced algorithms, data structures, and higher difficulty mathematical logic.",
        "category": "Coding & DSA",
        "difficulty": "Hard",
        "price_inr": 12,
        "duration_minutes": 40,
        "total_questions": 10,
        "pass_percentage": 50,
        "display_order": 6,
        "questions": [
            {
                "id": "tcs_d1",
                "question": "What is the time complexity of the Floyd-Warshall all-pairs shortest path algorithm on a graph with V vertices?",
                "options": ["O(V^2)", "O(V^3)", "O(V log V)", "O(E log V)"],
                "correct_answer": "B",
                "explanation": "Floyd-Warshall uses three nested loops over V vertices, giving O(V^3) time complexity."
            },
            {
                "id": "tcs_d2",
                "question": "Which of the following problems is known to be NP-Complete?",
                "options": ["Shortest Path in Weighted DAG", "Minimum Spanning Tree", "Traveling Salesperson Problem (Decision version)", "Matrix Chain Multiplication"],
                "correct_answer": "C",
                "explanation": "The decision version of the Traveling Salesperson Problem (TSP) is a classic NP-Complete problem."
            },
            {
                "id": "tcs_d3",
                "question": "How many trailing zeros are there at the end of 100! (100 factorial)?",
                "options": ["20", "22", "24", "25"],
                "correct_answer": "C",
                "explanation": "Trailing zeros = floor(100/5) + floor(100/25) = 20 + 4 = 24 zeros."
            },
            {
                "id": "tcs_d4",
                "question": "In a max-heap with N elements, what is the time complexity to insert a new element?",
                "options": ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
                "correct_answer": "B",
                "explanation": "Insertion places the element at the end and heapifies up along the tree height of O(log N)."
            },
            {
                "id": "tcs_d5",
                "question": "What is the remainder when 3^100 is divided by 7?",
                "options": ["1", "2", "4", "6"],
                "correct_answer": "C",
                "explanation": "By Fermat's Little Theorem: 3^6 ≡ 1 (mod 7). 100 = 6 * 16 + 4. 3^100 ≡ 3^4 ≡ 81 ≡ 4 (mod 7)."
            },
            {
                "id": "tcs_d6",
                "question": "Which design pattern ensures a class has only one instance and provides a global access point to it?",
                "options": ["Factory Method", "Singleton", "Adapter", "Observer"],
                "correct_answer": "B",
                "explanation": "The Singleton pattern restricts instantiation to a single unique object instance."
            },
            {
                "id": "tcs_d7",
                "question": "In modern operating systems, what is 'thrashing'?",
                "options": [
                    "A deadlock involving three or more processes",
                    "CPU spending more time paging in and out than executing instructions",
                    "Excessive disk fragmentation causing I/O stalls",
                    "Network packet collision on Ethernet"
                ],
                "correct_answer": "B",
                "explanation": "Thrashing occurs when high page fault frequency causes the OS to spend more time swapping pages than executing code."
            },
            {
                "id": "tcs_d8",
                "question": "What is the prefix notation (Polish notation) for the infix expression: (A + B) * (C - D)?",
                "options": ["* + A B - C D", "+ A B * - C D", "A B + C D - *", "* A + B - C D"],
                "correct_answer": "A",
                "explanation": "(A + B) -> + A B; (C - D) -> - C D. Combined with * -> * + A B - C D."
            },
            {
                "id": "tcs_d9",
                "question": "A box contains 6 black balls and 4 white balls. Two balls are drawn one after another without replacement. What is the probability that both are black?",
                "options": ["1/3", "2/5", "3/10", "1/2"],
                "correct_answer": "A",
                "explanation": "P(1st black) = 6/10 = 3/5. P(2nd black) = 5/9. Combined = (3/5) * (5/9) = 3/9 = 1/3."
            },
            {
                "id": "tcs_d10",
                "question": "Which of the following is true about TCP vs UDP?",
                "options": [
                    "UDP provides guaranteed delivery and retransmission.",
                    "TCP is connectionless and has lower latency.",
                    "TCP provides reliable, ordered stream delivery using handshakes and acknowledgments.",
                    "UDP uses 3-way handshake before sending datagrams."
                ],
                "correct_answer": "C",
                "explanation": "TCP is connection-oriented, providing reliable, in-order byte stream delivery with flow and congestion control."
            }
        ]
    }
]


def seed_mock_test_types(db: Session) -> dict:
    """
    Seeds initial scalable test types and returns a mapping from slug to type object.
    """
    type_map = {}
    try:
        for t_data in INITIAL_TEST_TYPES:
            existing = db.query(MockTestType).filter(
                MockTestType.slug == t_data["slug"],
                MockTestType.is_deleted == False
            ).first()

            if not existing:
                t_obj = MockTestType(
                    name=t_data["name"],
                    slug=t_data["slug"],
                    description=t_data["description"],
                    icon=t_data["icon"],
                    badge_color=t_data["badge_color"],
                    requires_chapter=t_data["requires_chapter"],
                    requires_topic=t_data["requires_topic"],
                    requires_pyq_metadata=t_data["requires_pyq_metadata"],
                    requires_section=t_data["requires_section"],
                    is_speed_test=t_data["is_speed_test"],
                    is_practice=t_data["is_practice"],
                    is_active=True,
                    display_order=t_data["display_order"],
                    created_at=now_utc(),
                    updated_at=now_utc()
                )
                db.add(t_obj)
                db.flush()
                type_map[t_obj.slug] = t_obj
                logger.info(f"Created test type: {t_obj.name}")
            else:
                type_map[existing.slug] = existing
        db.commit()
    except Exception as e:
        logger.error(f"Error seeding test types: {e}")
        db.rollback()
    return type_map


def seed_mock_test_categories(db: Session) -> dict:
    """
    Seeds initial dynamic categories and returns a mapping from slug to category object.
    """
    category_map = {}
    try:
        for cat_data in INITIAL_CATEGORIES:
            existing = db.query(MockTestCategory).filter(
                MockTestCategory.slug == cat_data["slug"],
                MockTestCategory.is_deleted == False
            ).first()

            if not existing:
                cat = MockTestCategory(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    description=cat_data["description"],
                    category_type=cat_data["category_type"],
                    subcategories_json=json.dumps(cat_data["subcategories"]),
                    is_active=True,
                    display_order=cat_data["display_order"],
                    created_at=now_utc(),
                    updated_at=now_utc()
                )
                db.add(cat)
                db.flush()
                category_map[cat.slug] = cat
                logger.info(f"Created category: {cat.name}")
            else:
                category_map[existing.slug] = existing
        db.commit()
    except Exception as e:
        logger.error(f"Error seeding categories: {e}")
        db.rollback()
    return category_map


def seed_initial_mock_tests(db: Session):
    """
    Seeds the initial complete educational mock tests, categories, and test types.
    """
    try:
        # 1. Seed categories and test types
        cat_map = seed_mock_test_categories(db)
        type_map = seed_mock_test_types(db)

        # 2. Update existing mock tests with default test_type if missing
        default_flm = type_map.get("full-length-mock")
        default_sw = type_map.get("subject-wise")
        for existing_t in db.query(MockTest).all():
            if not existing_t.test_type or existing_t.test_type == "Full-Length Mock Test":
                if "Fundamentals" in existing_t.title or "Physics" in existing_t.title:
                    existing_t.test_type = "Subject-Wise Test"
                    if default_sw:
                        existing_t.test_type_id = default_sw.id
                else:
                    existing_t.test_type = "Full-Length Mock Test"
                    if default_flm:
                        existing_t.test_type_id = default_flm.id
            if not existing_t.difficulty_distribution_json:
                existing_t.difficulty_distribution_json = json.dumps({"Easy": 20.0, "Medium": 50.0, "Hard": 30.0})

        # 3. Seed Academic Mock Tests (sample tests, 50 questions each)
        for t_data in SAMPLE_ACADEMIC_MOCK_TESTS:
            existing = db.query(MockTest).filter(
                MockTest.title == t_data["title"],
                MockTest.is_deleted == False
            ).first()

            if not existing:
                questions = t_data.get("questions", [])
                cat_id = cat_map.get(t_data.get("category_slug"))
                category_id_val = cat_id.id if cat_id else None

                t_type_name = "Full-Length Mock Test"
                t_type_slug = "full-length-mock"
                if "Fundamentals" in t_data["title"] or "Class 11 Physics" in t_data["title"]:
                    t_type_name = "Subject-Wise Test"
                    t_type_slug = "subject-wise"

                type_obj = type_map.get(t_type_slug)
                type_id_val = type_obj.id if type_obj else None

                test = MockTest(
                    category_id=category_id_val,
                    category=t_data["category"],
                    subcategory=t_data.get("subcategory"),
                    test_type_id=type_id_val,
                    test_type=t_type_name,
                    class_level=t_data.get("class_level"),
                    subject=t_data.get("subject"),
                    exam_type=t_data.get("exam_type"),
                    engineering_branch=t_data.get("engineering_branch"),
                    company_name="Testora National Mocks",
                    company_slug="testora_national",
                    title=t_data["title"],
                    description=t_data["description"],
                    difficulty=t_data["difficulty"],
                    language=t_data.get("language", "English"),
                    difficulty_distribution_json=json.dumps({"Easy": 20.0, "Medium": 50.0, "Hard": 30.0}),
                    visibility_target=t_data.get("visibility_target", "all"),
                    target_class=t_data.get("target_class"),
                    target_section="mock_test_library",
                    status=t_data.get("status", "published"),
                    price_inr=0,
                    price_paise=0,
                    is_free=True,
                    duration_minutes=t_data["duration_minutes"],
                    total_questions=len(questions),
                    total_marks=t_data["total_marks"],
                    marks_per_question=t_data["marks_per_question"],
                    negative_marking=t_data["negative_marking"],
                    passing_marks=t_data["passing_marks"],
                    pass_percentage=t_data["pass_percentage"],
                    instructions=t_data.get("instructions"),
                    questions_json=json.dumps(questions),
                    display_order=t_data["display_order"],
                    is_active=True,
                    attempts_count=0,
                    created_at=now_utc(),
                    updated_at=now_utc()
                )
                db.add(test)
                logger.info(f"Seeded mock test: {test.title} ({len(questions)} Qs)")
            else:
                if not getattr(existing, "target_section", None):
                    existing.target_section = "mock_test_library"

        
        # 4. Seed Corporate Placement Mock Tests (TCS NQT ₹9, Infosys ₹12, HCLTech ₹9, TCS Digital ₹12, Wipro, Accenture)
        corp_cat = cat_map.get("corporate-placement")
        corp_cat_id = corp_cat.id if corp_cat else None
        flm_type = type_map.get("full-length-mock")
        flm_type_id = flm_type.id if flm_type else None

        for c_data in CORPORATE_PLACEMENT_MOCK_TESTS:
            existing_c = db.query(MockTest).filter(
                MockTest.title == c_data["title"],
                MockTest.is_deleted == False
            ).first()

            c_questions = c_data.get("questions", [])
            p_inr = c_data.get("price_inr", 0)

            if not existing_c:
                c_test = MockTest(
                    category_id=corp_cat_id,
                    category="Corporate Placement Tests",
                    subcategory=c_data.get("company_name", "Corporate"),
                    test_type_id=flm_type_id,
                    test_type="Full-Length Mock Test",
                    class_level="Engineering / Graduate",
                    subject=c_data.get("category", "Aptitude & Technical"),
                    exam_type="Corporate Placement",
                    engineering_branch="All Branches",
                    company_name=c_data["company_name"],
                    company_slug=c_data["company_slug"],
                    company_logo=c_data.get("company_logo"),
                    title=c_data["title"],
                    description=c_data["description"],
                    difficulty=c_data.get("difficulty", "Medium"),
                    language="English",
                    difficulty_distribution_json=json.dumps({"Easy": 30.0, "Medium": 50.0, "Hard": 20.0}),
                    visibility_target="all",
                    target_section="placement_tests",
                    status="published",
                    price_inr=p_inr,
                    price_paise=p_inr * 100,
                    is_free=(p_inr <= 0),
                    duration_minutes=c_data.get("duration_minutes", 30),
                    total_questions=len(c_questions),
                    total_marks=float(len(c_questions)),
                    marks_per_question=1.0,
                    negative_marking=0.0,
                    passing_marks=float(len(c_questions)) * (c_data.get("pass_percentage", 50) / 100.0),
                    pass_percentage=c_data.get("pass_percentage", 50),
                    instructions=f"1. {c_data['company_name']} Corporate Placement Qualifier. 2. Contains {len(c_questions)} questions. 3. 1 mark per correct answer. No negative marking. 4. Complete within {c_data.get('duration_minutes', 30)} minutes.",
                    questions_json=json.dumps(c_questions),
                    display_order=c_data.get("display_order", 10),
                    is_active=True,
                    attempts_count=0,
                    created_at=now_utc(),
                    updated_at=now_utc()
                )
                db.add(c_test)
                logger.info(f"Seeded corporate placement test: {c_test.title} (₹{p_inr})")
            else:
                existing_c.price_inr = p_inr
                existing_c.price_paise = p_inr * 100
                existing_c.is_free = (p_inr <= 0)
                existing_c.target_section = "placement_tests"
                if not existing_c.category_id and corp_cat_id:
                    existing_c.category_id = corp_cat_id
                if not existing_c.test_type_id and flm_type_id:
                    existing_c.test_type_id = flm_type_id

        db.commit()
        logger.info("Successfully verified and seeded mock tests catalogue.")
    except Exception as e:
        logger.error(f"Error seeding mock tests: {e}")
        db.rollback()
