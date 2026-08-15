import dotenv from 'dotenv';
dotenv.config({path:"./config.env"});
import express from "express";
import cors from "cors";
import pool from "./db.js";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
const app = express();

export class Course {
  constructor(id, name, credit, type, semester, taken, elective) {
    this.cId = id;
    this.cName = name;
    this.credit = credit;
    this.type = type;
    this.semester = semester;
    this.taken = taken;
    this.elective = elective;
  }
}

export class Instructor {
  constructor(id, name, role, badday, courses) {
    this.iId = id;
    this.iName = name;
    this.role = role;
    this.badday = badday;
    this.courses = courses;
    this.assignedCount = 0;
    this.assignedLabs = 0;
  }
}

export class Room {
  constructor(id, type, capacity, taken) {
    this.rId = id;
    this.type = type;
    this.capacity = capacity;
    this.taken = taken;
  }
}

export class TimeSlot {
  constructor(day, startTime, endTime, taken) {
    this.day = day;
    this.startTime = startTime;
    this.endTime = endTime;
    this.taken = taken;
  }
}

export class Section {
  constructor(sid, scount, courses, group, semester) {
    this.sid = sid;
    this.semester = semester;
    this.scount = scount;
    this.group = group;
    this.courses = courses;
  }
}

export class Lecture {
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
    empty = true,
    iselective
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
    this.isempty = empty;
    this.iselective = iselective;
  }
}
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });


async function insertCSVToDB(filePath, tableName) {
  return new Promise((resolve, reject) => {
    const rows = [];
    console.log(`reading csv for table ${tableName}: ${filePath}`);

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", async () => {
        try {
          for (const row of rows) {
            const normalizedRow = {};
            for (const key of Object.keys(row)) {
              const cleanKey = key
                .trim()
                .replace(/\uFEFF/g, "")
                .toLowerCase();
              normalizedRow[cleanKey] = row[key];
            }

            const columns = Object.keys(normalizedRow).join(", ");
            const values = Object.values(normalizedRow);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

            const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
            await pool.query(query, values);
          }

          fs.unlinkSync(filePath);
          console.log(`CSV data inserted into ${tableName} and file deleted.`);
          resolve();
        } catch (err) {
          console.error(`Error inserting ${tableName}:`, err);
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
      console.log("clearing all tables");
      await Promise.all([
        pool.query("DELETE FROM cspassignment.timeslots"),
        pool.query("DELETE FROM cspassignment.section"),
        pool.query("DELETE FROM cspassignment.courses"),
        pool.query("DELETE FROM cspassignment.instructor"),
        pool.query("DELETE FROM cspassignment.rooms"),
      ]);
      console.log("tables cleared.");

      const files = req.files;

      if (files.course)
        await insertCSVToDB(files.course[0].path, "cspassignment.courses");
      if (files.instructor)
        await insertCSVToDB(
          files.instructor[0].path,
          "cspassignment.instructor"
        );
      if (files.room)
        await insertCSVToDB(files.room[0].path, "cspassignment.rooms");
      if (files.timeslot)
        await insertCSVToDB(files.timeslot[0].path, "cspassignment.timeslots");
      if (files.section)
        await insertCSVToDB(files.section[0].path, "cspassignment.section");

      res.json({ status: "upload is successful!!!!!!!!!" });
    } catch (error) {
      console.error("upload failed:", error);
      res.status(500).json({ error: "upload failed" });
    }
  }
);

app.get("/courses", async (req, res) => {
  const result = await pool.query("select * from cspassignment.courses");
  res.json(result.rows);
});
app.get("/instructors", async (req, res) => {
  const result = await pool.query("select * from cspassignment.instructor");
  res.json(result.rows);
});
app.get("/rooms", async (req, res) => {
  const result = await pool.query("select * from cspassignment.rooms");
  res.json(result.rows);
});
app.get("/timeslots", async (req, res) => {
  const result = await pool.query("select * from cspassignment.timeslots");
  res.json(result.rows);
});
app.get("/sections", async (req, res) => {
  const result = await pool.query("select * from cspassignment.section");
  res.json(result.rows);
});
app.get("/lectures", async (req, res) => {
  const result = await pool.query(
    "select *  from cspassignment.lectures l join cspassignment.instructor i  on  i.instructorid =l.instructor "
  );
  res.json(result.rows);
});

let courses = [];
let instructors = [];
let rooms = [];
let slots = [];
let sections = [];
let lectures = [];

export async function loadData() {
  courses = [];
  instructors = [];
  rooms = [];
  slots = [];
  sections = [];
  lectures = [];

  var seconds = 0;

  function incrementSeconds() {
    seconds += 1;
    return seconds;
  }

  const start = Date.now();

  const thetime = setInterval(incrementSeconds, 1000);

  try {
    console.log("Starting loadData...");

    const [cresults, inresults, rresults, tresults, sresults] =
      await Promise.all([
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
      const section = new Section(
        s.sectionid,
        s.studentcount,
        s.courses,
        s.group,
        s.semester
      );
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
    console.log("Time elapsed: " + (Date.now() - start) / 1000 + " seconds");

    clearInterval(thetime);
  } catch (err) {
    console.error("Error in loadData:", err);
  }
}

const PORT = 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await loadData();
});

export function constraintprop(lectures, results) {
  if (lectures.length === 0) return results;
  for (let l of lectures) {
    results = results.filter((r) => {
      if (l.type.toLowerCase() === "lecture") {
        if (
          (l.instructorid === r.instructorid &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.room === r.roomid &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.section === r.groupname &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.section === r.sectionid &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.section === r.sectionid &&
            l.section === r.groupname &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.courseid === r.courseid &&
            l.type === r.type &&
            l.section === r.groupname) ||
          (l.section === r.groupname &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.instructorid === r.instructorid &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime &&
            l.room === r.roomid)
        ) {
          return false;
        } else {
          return true;
        }
      } else if (l.type.toLowerCase() === "lab") {
        if (
          (l.instructorid === r.instructorid &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.room === r.roomid &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.section === l.sectionid &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime) ||
          (l.coursename === r.coursename && l.section === r.sectionid) ||
          ((r.sectionid === l.section || r.groupname === l.section) &&
            l.timeslot === r.day &&
            l.start === r.starttime &&
            l.end === r.endtime)
        ) {
          return false;
        } else {
          return true;
        }
      }
    });
  }
  return results;
}

export async function cspSolve(courses, instructors, rooms, slots, sections) {
  const roomUsage = {};
  const slotUsage = {};
  await pool.query("delete from cspassignment.lectures");
  let lectures = [];
  let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
  const sad = [];
  for (let c of courses) {
    let results, co;
    if (c.type.toLowerCase() === "lecture") {
      const profs = await pool.query(
        `select DISTINCT instructorid FROM cspassignment.instructor WHERE $1 = ANY(STRING_TO_ARRAY(qualifiedcourses, ', ')) AND LOWER(role) = 'professor';`,
        [c.cId]
      );
      const professorIds = profs.rows.map((r) => r.instructorid);
      let man = await course_giver(professorIds, instructors);
      console.log("Chosen professor for course " + c.cId + ": " + man);
      if (!man) {

        const myiid = "unkprof" + c.cId ;
        const instructor = new Instructor(
          myiid,
          "xxxx" + c.cId ,
          "Professor",
          null,
          c.cId
        );
        instructors.push(instructor);
        await pool.query(
          `insert into cspassignment.instructor (instructorid,name,role,nonpreferredslots,qualifiedcourses) values($1,$2,$3,$4,$5);`,
          [myiid, "xxxx" + c.cId , "Professor", null, c.cId]
        );
      };
      try {
        const result = await pool.query(
          `SELECT s.groupname, i.instructorid, i.name, c.courseid, c.coursename, c.type, r.roomid, t."day", t.starttime, t.endtime,s.sectionid
           FROM cspassignment.instructor i
           JOIN cspassignment.courses c ON TRIM(c.courseid) = ANY(STRING_TO_ARRAY(REPLACE(i.qualifiedcourses, ' ', ''), ','))
           JOIN cspassignment.section s ON s.semester = c.semester
           JOIN cspassignment.rooms r ON lower(r.type) = lower(c."type")
           JOIN cspassignment.timeslots t ON (i.nonpreferredslots IS NULL OR NOT (t."day" = ANY(STRING_TO_ARRAY(REPLACE(i.nonpreferredslots, ' ', ''), ','))))
           WHERE lower(i.role) = 'professor' AND c.courseid = $1
           AND lower(c."type") = 'lecture'
           AND lower(TRIM(c.courseid)) = ANY(STRING_TO_ARRAY(lower(REPLACE(s.courses, ' ', '')), ','))
           AND i.instructorid= $2
           GROUP BY s.groupname, i.instructorid, i.name, c.courseid, c.coursename, c.type, r.roomid, t."day", t.starttime, t.endtime, s.sectionid
           ORDER BY RANDOM();`,
          [c.cId, man]
        );
        results = result.rows;
      } catch (err) {
        continue;
      }
      if (results.length === 0) continue;

      try {
        const count = await pool.query(
          `select count(distinct s.groupname) from cspassignment."section" s join cspassignment.courses c on lower(TRIM($2)) = ANY(STRING_TO_ARRAY(lower(REPLACE(s.courses, ' ', '')), ',')) where s.semester =$1`,
          [c.semester, c.cId]
        );
        co = count.rows;
      } catch (err) {}

      let sectionCount = parseInt(co[0]?.count, 10);
      for (let i = 0; i < sectionCount; i++) {
        let filtered = constraintprop(lectures, results);
        if (filtered.length === 0) filtered = results;
        results = filtered;
        const chosen = results[Math.floor(Math.random() * results.length)];

        lectures.push(
          new Lecture(
            chosen.courseid,
            chosen.coursename,
            chosen.type,
            chosen.instructorid,
            chosen.name,
            chosen.roomid,
            chosen.day,
            chosen.groupname,
            chosen.starttime,
            chosen.endtime,
            false
          )
        );

        await pool.query(
          `insert into cspassignment.lectures (id,course,instructor,room,timeslot,section,starttime,endtime) values($1,$2,$3,$4,$5,$6,$7,$8);`,
          [
            chosen.courseid,
            chosen.coursename,
            chosen.instructorid,
            chosen.roomid,
            chosen.day,
            chosen.groupname,
            chosen.starttime,
            chosen.endtime,
          ]
        );
      }
    } else if (c.type.toLowerCase() === "lab") {
      const profs = await pool.query(
        `select DISTINCT instructorid FROM cspassignment.instructor WHERE $1 = ANY(STRING_TO_ARRAY(qualifiedcourses, ', ')) AND LOWER(role) = 'assistant';`,
        [c.cId]
      );
      let theday = days[Math.floor(Math.random() * 5)];
      const assitantIds = profs.rows.map((r) => r.instructorid);
      let x = 0;

      if (assitantIds.length === 0) {
        for (let j = 1; j <= 2; j++) {
          x++;
          const iid = "unkass" + c.cId + x;
          const instructor = new Instructor(
            iid,
            "xxxx" + c.cId + x,
            "Assistant",
            null,
            c.cId
          );
          instructors.push(instructor);
          await pool.query(
            `insert into cspassignment.instructor (instructorid,name,role,nonpreferredslots,qualifiedcourses) values($1,$2,$3,$4,$5);`,
            [iid, "xxxx" + c.cId + x, "Assistant", null, c.cId]
          );
        }
      } else if (assitantIds.length === 1) {
        x++;
        const iid = "unkass" + c.cId + x;
        const instructor = new Instructor(
          iid,
          "xxxx" + c.cId + x,
          "Assistant",
          null,
          c.cId
        );
        instructors.push(instructor);
        await pool.query(
          `insert into cspassignment.instructor (instructorid,name,role,nonpreferredslots,qualifiedcourses) values($1,$2,$3,$4,$5);`,
          [iid, "xxxx" + c.cId + x, "Assistant", null, c.cId]
        );
      }

      let results = [];
      try {
        const result = await pool.query(
          `SELECT s.groupname, s.sectionid, i.instructorid, i.name, c.courseid, c.coursename, c.type, r.roomid, t."day", t.starttime, t.endtime, c.elective
           FROM cspassignment.instructor i
           JOIN cspassignment.courses c ON TRIM(c.courseid) = ANY(STRING_TO_ARRAY(REPLACE(i.qualifiedcourses, ' ', ''), ','))
           JOIN cspassignment.section s ON s.semester = c.semester
           JOIN cspassignment.rooms r ON lower(r.type) = lower(c."type")
           JOIN cspassignment.timeslots t ON (i.nonpreferredslots IS NULL OR NOT (t."day" = ANY(STRING_TO_ARRAY(REPLACE(i.nonpreferredslots, ' ', ''), ','))))
           WHERE lower(i.role) = 'assistant' AND c.courseid = $1
           AND lower(c."type") = 'lab'
           AND lower(TRIM(c.courseid)) = ANY(STRING_TO_ARRAY(lower(REPLACE(s.courses, ' ', '')), ','))
           ORDER BY RANDOM();`,
          [c.cId]
        );
        results = result.rows;
      } catch (err) {
        continue;
      }
      if (results.length === 0) continue;

      let sectionCount = 0;
      try {
        const count = await pool.query(
          `select count(distinct s.sectionid) from cspassignment."section" s join cspassignment.courses c on lower(TRIM($2)) = ANY(STRING_TO_ARRAY(lower(REPLACE(s.courses, ' ', '')), ',')) where s.semester =$1`,
          [c.semester, c.cId]
        );
        sectionCount = parseInt(count.rows[0]?.count, 10);
      } catch (err) {}

      for (let i = 0; i < sectionCount; i++) {
        let filtered = constraintprop(lectures, results);
        if (filtered.length === 0) filtered = results;
        filtered.sort((a, b) => {
          const roomA = roomUsage[a.roomid] || 0;
          const roomB = roomUsage[b.roomid] || 0;
          const slotA = slotUsage[a.day + "_" + a.starttime] || 0;
          const slotB = slotUsage[b.day + "_" + b.starttime] || 0;
          return roomA + slotA - (roomB + slotB);
        });
        const chosen = filtered[0];
        roomUsage[chosen.roomid] = (roomUsage[chosen.roomid] || 0) + 1;
        slotUsage[chosen.day + "_" + chosen.starttime] =
          (slotUsage[chosen.day + "_" + chosen.starttime] || 0) + 1;
        lectures.push(
          new Lecture(
            chosen.courseid,
            chosen.coursename,
            chosen.type,
            chosen.instructorid,
            chosen.name,
            chosen.roomid,
            chosen.day,
            chosen.sectionid,
            chosen.starttime,
            chosen.endtime,
            false
          )
        );
        await pool.query(
          `insert into cspassignment.lectures (id,course,instructor,room,timeslot,section,starttime,endtime) values($1,$2,$3,$4,$5,$6,$7,$8);`,
          [
            chosen.courseid,
            chosen.coursename,
            chosen.instructorid,
            chosen.roomid,
            chosen.day,
            chosen.sectionid,
            chosen.starttime,
            chosen.endtime,
          ]
        );
      }
    }
  }

  return lectures;
}

export async function course_giver(instructorIds, instructors) {
  if (instructorIds.length === 0) return null;
  if (instructorIds.length === 1) return instructorIds[0];

  let min = {
    course_count: Infinity,
    instructorid: "",
  };

  let course_prof_count = [];

  for (let i = 0; i < instructorIds.length; i++) {
    let response = await pool.query(
      `select 
          instructorid,  
          array_length(STRING_TO_ARRAY(REPLACE(qualifiedcourses, ' ', ''), ','), 1)
          AS course_count  
       from cspassignment.instructor  
       where "role" = 'Professor' AND instructorid=$1;`,
      [instructorIds[i]]
    );

    course_prof_count.push(response.rows[0]);
  }

  for (let item of course_prof_count) {
    if (item.course_count < min.course_count) {
      min.course_count = item.course_count;
      min.instructorid = item.instructorid;
    }
  }

  return min.instructorid;
}

app.get("/generate-schedule", async (req, res) => {
  try {
    const lectures = await loadData();
    res.json(lectures);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate schedule" });
  }
});
