import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import pool from "./db.js";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

class Course {
  constructor(id, name, credit, type, semester,  taken,elective) {
    this.cId = id;
    this.cName = name;
    this.credit = credit;
    this.type = type;
    this.semester = semester;
    this.taken = taken;
    this.elective=elective
  }
}

class Instructor {
  constructor(id, name, role, badday, courses) {
    this.iId = id;
    this.iName = name;
    this.role = role;
    this.badday = badday;
    this.courses = courses;
  }
}

class Room {
  constructor(id, type, capacity, taken) {
    this.rId = id;
    this.type = type;
    this.capacity = capacity;
    this.taken = taken;
  }
}

class TimeSlot {
  constructor(day, startTime, endTime, taken) {
    this.day = day;
    this.startTime = startTime;
    this.endTime = endTime;
    this.taken = taken;
  }
}

class Section {
  constructor(sid, semester, scount, group) {
    this.sid = sid;
    this.semester = semester;
    this.scount = scount;
    this.group = group;
  }
}

class Lecture {
  constructor(
    courseid,
    coursename,
    type,
    instructorid,
    instructorname,
    room,
    timeslot,
    section,
    start,
    end,
    empty = true
    ,iselective
  ) {
    this.courseid = courseid;
    this.coursename = coursename;
    this.type = type;
    this.instructorname = instructorname;
    this.instructorid = instructorid;
    this.room = room;
    this.timeslot = timeslot;
    this.section = section;
    this.start = start;
    this.end = end;
    this.isempty = empty
    this.iselective=iselective
  }
}
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });



async function insertCSVToDB(filePath, tableName) {
  return new Promise((resolve, reject) => {
    const rows = [];
    console.log(`Reading CSV for table ${tableName}: ${filePath}`);
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          for (const row of rows) {
            const columns = Object.keys(row).join(", ");
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
            const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
            await pool.query(query, values);
          }
          fs.unlinkSync(filePath);
          console.log(`CSV data inserted into ${tableName} and file deleted.`);
          resolve();
        } catch (err) {
          console.error(`Error inserting CSV into ${tableName}:`, err);
          reject(err);
        }
      })
      .on("error", (err) => {
        console.error("CSV read error:", err);
        reject(err);
      });
  });
}

app.post(
  "/upload",
  upload.fields([
    { name: "course", maxCount: 1 },
    { name: "instructor", maxCount: 1 },
    { name: "room", maxCount: 1 },
    { name: "timeslot", maxCount: 1 },
    { name: "section", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("Clearing all tables...");
      await Promise.all([
        pool.query("DELETE FROM cspassignment.timeslots"),
        pool.query("DELETE FROM cspassignment.section"),
        pool.query("DELETE FROM cspassignment.courses"),
        pool.query("DELETE FROM cspassignment.instructor"),
        pool.query("DELETE FROM cspassignment.rooms"),
      ]);
      console.log("Tables cleared.");

      const files = req.files;

      if (files.course) await insertCSVToDB(files.course[0].path, "cspassignment.courses");
      if (files.instructor) await insertCSVToDB(files.instructor[0].path, "cspassignment.instructor");
      if (files.room) await insertCSVToDB(files.room[0].path, "cspassignment.rooms");
      if (files.timeslot) await insertCSVToDB(files.timeslot[0].path, "cspassignment.timeslots");
      if (files.section) await insertCSVToDB(files.section[0].path, "cspassignment.section");

      res.json({ status: "Upload successful" });
    } catch (error) {
      console.error("Upload failed:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

app.get("/courses", async (req, res) => {
  const result = await pool.query("SELECT * FROM cspassignment.courses");
  res.json(result.rows);
});
app.get("/instructors", async (req, res) => {
  const result = await pool.query("SELECT * FROM cspassignment.instructor");
  res.json(result.rows);
});
app.get("/rooms", async (req, res) => {
  const result = await pool.query("SELECT * FROM cspassignment.rooms");
  res.json(result.rows);
});
app.get("/timeslots", async (req, res) => {
  const result = await pool.query("SELECT * FROM cspassignment.timeslots");
  res.json(result.rows);
});
app.get("/sections", async (req, res) => {
  const result = await pool.query("SELECT * FROM cspassignment.section");
  res.json(result.rows);
});
app.get("/lectures", async (req, res) => {
  const result =lectures;
  res.json(result.rows);
});


let courses = [];
let instructors = [];
let rooms = [];
let slots = [];
let sections = [];
let lectures = [];

async function loadData() {
  try {
    console.log("Starting loadData...");

    const [cresults, inresults, rresults, tresults, sresults] = await Promise.all([
      pool.query("SELECT * FROM cspassignment.courses"),
      pool.query("SELECT * FROM cspassignment.instructor"),
      pool.query("SELECT * FROM cspassignment.rooms"),
      pool.query("SELECT * FROM cspassignment.timeslots"),
      pool.query("SELECT * FROM cspassignment.section"),
    ]);

    for (let c of cresults.rows) {
      const course = new Course(
        c.courseid,
        c.coursename,
        c.credits,
        c.type,
        c.semester,
        false,
        c.elective
      );
      courses.push(course);
    }

    for (let s of sresults.rows) {
      const section = new Section(s.sectionid, s.semester, s.studentcount, s.group);
      sections.push(section);
    }

    for (let i of inresults.rows) {
      const instructor = new Instructor(
        i.instructorid,
        i.name,
        i.role,
        i.nonpreferredslots,
        i.qualifiedcourses.split(",").map((x) => x.trim())
      );
      instructors.push(instructor);
    }

    for (let r of rresults.rows) {
      const room = new Room(r.roomid, r.type, r.capacity, false);
      rooms.push(room);
    }

    for (let t of tresults.rows) {
      const slot = new TimeSlot(t.day, t.starttime, t.endtime, false);
      slots.push(slot);
    }

    let result = await cspSolve(courses, instructors, rooms, slots, sections);
       
    console.log("\nCSP Finished:\n", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error in loadData:", err);
  }
}

const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await loadData();
});


// function constraintprop(lectures, results) {
//   //prettier off
//   if (lectures.length === 0) return results;
//   for (let l of lectures){
//     results = results.filter(
//       (r) => {
//         if (l.type.toLowerCase() === "lecture") {
          
//           if (  (l.instructorid === r.instructorid && l.timeslot === r.day && l.start === r.starttime && l.end === r.endtime)
//   || (l.room === r.roomid && l.timeslot === r.day && l.start === r.starttime && l.end === r.endtime)
//   || (l.section.includes(r.sectionid) && l.timeslot === r.day && l.start === r.starttime && l.end === r.endtime)
//             || (l.coursename === r.coursename && l.section === r.groupname) || ((l.section === r.groupname) && (l.timeslot === r.day) && (l.start === r.starttime) && (l.end === r.endtime)
//             ||(l.instructorid === r.instructorid && l.timeslot === r.day && l.start === r.starttime && l.end === r.endtime&&l.room === r.roomid ))
//           ) {
//             return false;
//           } else {
//             return true;
//         }

          
//         } else if (l.type.toLowerCase()==="lab") {
//            if (   (l.instructorid === r.instructorid && l.timeslot === r.day && l.start === r.starttime && l.end === r.endtime)
//                || (l.room === r.roomid && l.timeslot === r.day && l.start === r.starttime && l.end === r.endtime)
//              || (l.section === l.sectionid && l.timeslot === r.day && l.start === r.starttime && l.end === r.endtime)
//            ||(l.coursename === r.coursename && l.section === r.sectionid)) {
//             return false;
//           } else {
//             return true;
//         } 
//         }

//       })
     
//   }
//   return results;
// }
function constraintprop(lectures, results) {
  if (lectures.length === 0) return results;

  return results.filter((r) => {
    const isElective = r.elective != null && r.elective !== ""; // true only if elective field exists

    for (let l of lectures) {
      const sameTime =
        l.timeslot === r.day &&
        l.start === r.starttime &&
        l.end === r.endtime;

      // --- ELECTIVE RULES ---
      if (isElective && l.section === r.groupname) {
        // electives can overlap in time with same group
        // as long as they have DIFFERENT instructor and DIFFERENT room
        if (
          (l.instructorid === r.instructorid && sameTime) ||
          (l.room === r.roomid && sameTime)
        ) {
          return false; // conflict
        }
        continue; // otherwise allowed
      }

      // --- LECTURE RULES ---
      if (l.type.toLowerCase() === "lecture") {
        if (
          (l.instructorid === r.instructorid && sameTime) ||
          (l.room === r.roomid && sameTime) ||
          (l.section.includes?.(r.sectionid) && sameTime) ||
          (l.coursename === r.coursename && l.section === r.groupname) ||
          ((l.section === r.groupname) && sameTime) ||
          (l.instructorid === r.instructorid &&
            sameTime &&
            l.room === r.roomid)
        ) {
          return false;
        }
      }

      // --- LAB RULES ---
      else if (l.type.toLowerCase() === "lab") {
        if (
          (l.instructorid === r.instructorid && sameTime) ||
          (l.room === r.roomid && sameTime) ||
          (l.section === r.sectionid && sameTime) ||
          (l.coursename === r.coursename && l.section === r.sectionid)
        ) {
          return false;
        }
      }
    }

    return true;
  });
}



async function cspSolve(courses, instructors, rooms, slots, sections) {
 await pool.query(`delete from cspassignment.lectures`);

  let lectures = [];
 
  let days = ["Sunday","Monday","Tuesday","wednesday","Thursday"];

  for (let c of courses) {

    let results,co;

    if (c.type.toLowerCase() === "lecture") {

const profs = await pool.query(`
  select DISTINCT instructorid
  FROM cspassignment.instructor
  WHERE $1 = ANY(STRING_TO_ARRAY(qualifiedcourses, ', '))
    AND LOWER(role) = 'professor';
`, [c.cId]);

const professorIds = profs.rows.map(r => r.instructorid);

    let man=  course_giver(professorIds,instructors);
      if (!man) {
  console.warn(`No instructor assigned for ${c.cName}, skipping`);
  continue;
}

      try {
        const result = await pool.query(
          `SELECT   
    s.groupname,
    s.sectionid, 
    i.instructorid,  
    i.name ,  
    c.courseid,  
    c.coursename,  
    c.type ,  
    r.roomid,  
    t."day",  
    t.starttime,  
    t.endtime ,
     c.elective 
FROM cspassignment.instructor i  
JOIN cspassignment.courses c  
    ON TRIM(c.courseid) = ANY(STRING_TO_ARRAY(REPLACE(i.qualifiedcourses, ' ', ''), ','))
JOIN cspassignment.section s  
    ON s.semester = c.semester  
JOIN cspassignment.rooms r  
    ON lower(r.type) = lower(c."type")
JOIN cspassignment.timeslots t  
    ON (i.nonpreferredslots IS NULL 
        OR NOT (t."day" = ANY(STRING_TO_ARRAY(REPLACE(i.nonpreferredslots, ' ', ''), ','))))
WHERE   
    lower(i.role) = 'professor'  
    AND c.courseid = $1  
    AND lower(c."type") = 'lecture'
    and i.instructorid=$2
GROUP BY   
    s.groupname, i.instructorid, i.name, c.courseid, c.coursename, c.type,  
    r.roomid, t."day", t.starttime, t.endtime,s.sectionid,c.elective
ORDER BY   
    s.groupname, i.name,
    s.sectionid,
    CASE  
        WHEN t."day" = 'Monday' THEN 2 
        WHEN t."day" = 'Tuesday' THEN 3 
        WHEN t."day" = 'Wednesday' THEN 4 
        WHEN t."day" = 'Thursday' THEN 5 
        WHEN t."day" = 'Friday' THEN 6 
        WHEN t."day" = 'Saturday' THEN 7 
        WHEN t."day" = 'Sunday' THEN 1 
        ELSE 8 
    END,
    t.starttime, t.endtime, r.roomid;
`,
          [c.cId,man]);
       results = result.rows;
      } catch (err) {
        console.error(err);
        continue;
      }
      try {
        const count = await pool.query(`select  count(distinct s.groupname) from cspassignment."section" s where semester=$1 ; `, [c.semester]);
              co = count.rows;
      } catch (err) { console.log(err) }
let sectionCount = parseInt(co[0]?.count, 10);

      for (let i = 0; i < sectionCount; i++){
        
        let filtered = constraintprop(lectures, results);
   //       console.log(filtered );

if (filtered.length === 0) {
  console.warn(`All filtered out for ${c.cName}, reverting to unfiltered results.`);
  filtered = results;
}
results = filtered;


lectures.push(
    new Lecture(
        results[0].courseid,
        results[0].coursename,
        results[0].type,
        results[0].instructorid,
        results[0].name,
        results[0].roomid,
        results[0].day,
        results[0].groupname,
        results[0].starttime,
      results[0].endtime,
        false
    )
        );

        await pool.query(`insert into  cspassignment.lectures (id,course,instructor,room,timeslot,section,starttime,endtime)
          values($1,$2,$3,$4,$5,$6,$7,$8);
          `,[ results[0].courseid,results[0].coursename,results[0].instructorid,results[0].roomid,results[0].day,results[0].groupname,results[0].starttime,results[0].endtime]);

      }
     console.log(lectures);

   
    } else if (c.type.toLowerCase() === "lab") {
      const profs = await pool.query(`
  select DISTINCT instructorid
  FROM cspassignment.instructor
  WHERE $1 = ANY(STRING_TO_ARRAY(qualifiedcourses, ', '))
    AND LOWER(role) = 'assistant';
`, [c.cId]);
      let theday = days[Math.floor(Math.random() * 5)];

      const assitantIds = profs.rows.map(r => r.instructorid);
   //   console.log(assitantIds.length);
       let x = 0;
      if (assitantIds.length === 0) {

        x++;
         let instructor = new Instructor(
        "unkass"+c.cId+x,
           "xxxxx"+c.cId+x,
           "Assistant",
           theday,
         c.cId
        );
        instructors.push(instructor); 
        let iid = "unkass"+c.cId + x ;

let profs = await pool.query(`
  insert into cspassignment.instructor (instructorid,name,role,nonpreferredslots,qualifiedcourses)
   values($1,$2,$3,$4,$5);
`, [iid,"xxxx","Assistant",theday,c.cId]);
theday = days[Math.floor(Math.random() * 5)];
        x++;
         instructor = new Instructor(
        "unkass"+c.cId+x,
           "xxxxx"+c.cId+x,
           "Assistant",
           theday,
         c.cId
        );
        instructors.push(instructor); 
        iid = "unkass"+c.cId + x ;

 profs = await pool.query(`
  insert into cspassignment.instructor (instructorid,name,role,nonpreferredslots,qualifiedcourses)
   values($1,$2,$3,$4,$5);
`, [iid,"xxxx","Assistant",theday,c.cId]);
        
      } else if (assitantIds.length === 1) {
         x++;
         const instructor = new Instructor(
        "unkass"+c.cId+x,
           "xxxxx"+c.cId+x,
           "Assistant",
           theday,
         c.cId
        );
        instructors.push(instructor); 
        let iid = "unkass"+c.cId + x ;

const profs = await pool.query(`
  insert into cspassignment.instructor (instructorid,name,role,nonpreferredslots,qualifiedcourses)
   values($1,$2,$3,$4,$5);
`, [iid,"xxxx","Assistant",theday,c.cId]);
        
      }

 
      try {
        const result = await pool.query(
          `SELECT 
  sub.groupname,
  sub.sectionid,
  sub.instructorid,
  sub.name,
  sub.courseid,
  sub.coursename,
  sub.type,
  sub.roomid,
  sub.day,
  sub.starttime,
  sub.endtime,
   sub.elective
FROM (
  SELECT 
    s.sectionid,
    s.groupname,
    i.instructorid,
    i.name,
    c.courseid,
    c.coursename,
    c.type,
    r.roomid,
    t."day",
    t.starttime,
    t.endtime,
     c.elective,
    ROW_NUMBER() OVER (PARTITION BY s.sectionid ORDER BY RANDOM()) AS rn
  FROM cspassignment.instructor i
  JOIN cspassignment.courses c
    ON TRIM(c.courseid) = ANY(STRING_TO_ARRAY(REPLACE(i.qualifiedcourses, ' ', ''), ','))
  JOIN cspassignment.section s
    ON s.semester = c.semester
  JOIN cspassignment.rooms r
    ON lower(r.type) = lower(c."type")
  JOIN cspassignment.timeslots t
    ON (i.nonpreferredslots IS NULL
        OR NOT (t."day" = ANY(STRING_TO_ARRAY(REPLACE(i.nonpreferredslots, ' ', ''), ','))))
  WHERE
    lower(i.role) = 'assistant'
    AND c.courseid = $1
    AND lower(c."type") = 'lab'
) AS sub
ORDER BY 
  sub.groupname,
  sub.sectionid,
  sub.rn,
  CASE 
    WHEN sub.day = 'Sunday' THEN 1
    WHEN sub.day = 'Monday' THEN 2
    WHEN sub.day = 'Tuesday' THEN 3
    WHEN sub.day = 'Wednesday' THEN 4
    WHEN sub.day = 'Thursday' THEN 5
    WHEN sub.day = 'Friday' THEN 6
    WHEN sub.day = 'Saturday' THEN 7
    ELSE 8
  END,
  sub.starttime,
  sub.endtime;

`,
          [c.cId]
        );
        results = result.rows;
      } catch (err) {
        console.error(err);
        continue;
      }
        try {
        const count = await pool.query(`select  count(distinct s.sectionid) from cspassignment."section" s where semester=$1 `, [c.semester]);
        co = count.rows;
      }catch(err){console.log(err)}
let sectionCount = parseInt(co[0]?.count, 10);

      for (let i = 0; i<sectionCount;i++){
let filtered = constraintprop(lectures, results);
if (filtered.length === 0) {
  console.warn(`All filtered out for ${c.cName}, reverting to unfiltered results.`);
  filtered = results;
}
        results = filtered;
        
    const assignedRow = filtered.find(r => !lectures.some(l => l.section === r.sectionid && l.timeslot === r.day));
 if (!assignedRow) {
        console.warn(`No available timeslot for section ${i} of ${c.cName}`);
        continue;
    }

       // console.log(results[0].courseid);
        lectures.push(
        new Lecture(
          assignedRow.courseid,
          assignedRow.coursename,
          assignedRow.type,
          assignedRow.instructorid,
          assignedRow.name,
          assignedRow.roomid,
          assignedRow.day,
         assignedRow.sectionid,
          assignedRow.starttime,
          assignedRow.endtime,
          false
        )
        );
              await pool.query(`insert into  cspassignment.lectures (id,course,instructor,room,timeslot,section,starttime,endtime)
          values($1,$2,$3,$4,$5,$6,$7,$8);
          `,[ assignedRow.courseid,assignedRow.coursename,assignedRow.instructorid,assignedRow.roomid,assignedRow.day,assignedRow.sectionid,assignedRow.starttime,assignedRow.endtime]);

      }


  
    }
  

   
  }

  console.log(...lectures);
  return lectures;
}

function course_giver(instructorIds, instructors) {
  if (!Array.isArray(instructorIds) || instructorIds.length === 0) {
    console.error("course_giver: no instructor IDs provided");
    return null;
  }

  if (instructorIds.length === 1) return instructorIds[0];

  const loads = instructorIds.map(id => {
    const inst = instructors.find(i => i.iId === id);
    if (!inst) {
      console.warn(`course_giver: instructor ${id} not found in the instructor list`);
      return { id, load: Infinity }; 
    }
    return { id, load: inst.courses.length };
  });

  const minLoad = Math.min(...loads.map(l => l.load));

  const leastLoaded = loads.find(l => l.load === minLoad);

  if (!leastLoaded) {
    console.error("course_giver: could not find least loaded instructor");
    return null;
  }

  return leastLoaded.id;
}
