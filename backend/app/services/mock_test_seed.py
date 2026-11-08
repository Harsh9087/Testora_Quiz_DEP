import json
import logging
from sqlalchemy.orm import Session
from app.models.mock_test import MockTest
from app.utils.timezone import now_utc

logger = logging.getLogger(__name__)

INITIAL_MOCK_TESTS = [
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


def seed_initial_mock_tests(db: Session):
    """
    Seeds initial company placement tests into database if not already present.
    """
    try:
        count = db.query(MockTest).count()
        if count == 0:
            logger.info("Seeding initial corporate placement mock tests (TCS, Infosys, HCL, Wipro, Accenture)...")
            for t_data in INITIAL_MOCK_TESTS:
                questions = t_data.get("questions", [])
                test = MockTest(
                    company_name=t_data["company_name"],
                    company_slug=t_data["company_slug"],
                    company_logo=t_data["company_logo"],
                    title=t_data["title"],
                    description=t_data["description"],
                    category=t_data["category"],
                    difficulty=t_data["difficulty"],
                    price_inr=t_data["price_inr"],
                    price_paise=t_data["price_inr"] * 100,
                    is_free=(t_data["price_inr"] == 0),
                    duration_minutes=t_data["duration_minutes"],
                    total_questions=len(questions),
                    pass_percentage=t_data["pass_percentage"],
                    questions_json=json.dumps(questions),
                    display_order=t_data["display_order"],
                    is_active=True,
                    attempts_count=0,
                    created_at=now_utc(),
                    updated_at=now_utc()
                )
                db.add(test)
            db.commit()
            logger.info(f"Successfully seeded {len(INITIAL_MOCK_TESTS)} company placement mock tests.")
    except Exception as e:
        logger.error(f"Error seeding mock tests: {e}")
