# 📅 College Timetable Generator (CSP Solver)

An automated academic schedule optimizer built for the **Intelligent Systems** course (Fall 2025). The system uses Constraint Satisfaction Problem (CSP) algorithms to generate complete, conflict-free college timetables across all levels, exporting the result directly into an interactive HTML schedule (`rooms_schedule.html`).

Sample output 
file:///home/totos_aboelshuur/Downloads/rooms_schedule%20(7).html

---

## 🛠️ Tech Stack & Architecture

- **Backend:** Node.js & Express.js
- **Algorithm:** Constraint Satisfaction Problem (CSP) Engine
- **Input Format:** CSV files (`section.csv`, `TimeSlots.csv`, `coursats.csv`, `Rooms.csv`, `Instructor.csv`)
- **Output:** Interactive HTML Schedule (`rooms_schedule.html`)
- sample output =  https://host-html-user.com/p/k58rwl

---

## 🎯 Core Constraints & Rules

1. **Instructor Constraints:** Prevents double-booking instructors, respects `nonPreferredSlots`, and assigns courses only to qualified instructors listed in `QualifiedCourses`.
2. **Student Section Constraints:** Ensures student sections (`SectionID`) do not have overlapping course sessions.
3. **Room Allocation Constraints:** Matches student cohort sizes (`StudentCount`) to room capacity (`Capacity`) and session types (Lectures vs. Labs).

---

## ⚙️ Setup & Configuration

### 1. Clone the Repository
```bash
git clone [https://github.com/totosborhany/Csp-project.git](https://github.com/totosborhany/Csp-project.git)
cd Csp-project

2. Install Dependencies
Bash

npm install

3. Environment Variables

Create a .env file in the root directory and add your credentials:
Code snippet

DATABASE_USERNAME=your_db_username
DATABASE_NAME=your_db_name
DATABASE_PASSWORD=your_db_password

📄 Input CSV File Schemas

Place the following CSV files in your project input directory:
Instructor.csv
Code snippet

InstructorID,Name,Role,nonPreferredSlots,QualifiedCourses
PROF01,Dr. Reda Elbasiony,Professor,Tuesday,CSC111
PROF02,Dr. Ayman Arafa,Professor,Sunday,"MTH111, ACM215, MTH121, CNC320, CSC321"
PROF03,Dr. Adel Fathy,Professor,Wednesday,"PHY113, PHY123"

coursats.csv
Code snippet

CourseID,CourseName,Credits,Type,Semester,elective
LRA401,Japanese Language (1),1,Lecture,1,
LRA101,Japanese Culture,2,Lecture,1,
LRA104,Music and Technology,2,Lecture,1,LRA105

section.csv
Code snippet

SectionID,StudentCount,Courses,Groupname,Semester
L1g1S1,20,"LRA401,LRA101,LRA104,PHY113,ECE111,MTH111,CSC111,LRA105",L1g1,1
L1g1S2,20,"LRA401,LRA101,LRA104,PHY113,ECE111,MTH111,CSC111,LRA105",L1g1,1

Rooms.csv
Code snippet

RoomID,Type,Capacity
R101,Lecture,80
R102,Lecture,80

TimeSlots.csv
Code snippet

Day,StartTime,EndTime
Sunday,9:00 AM,10:30 AM
Sunday,10:45 AM,12:15 PM

🚀 Execution & Output
1. Run the Application
Bash

npm start

2. View Output Schedule

The CSP engine processes the CSV inputs and generates the schedule. Open rooms_schedule.html in your web browser:
Bash

file:///path/to/project/rooms_schedule.html
