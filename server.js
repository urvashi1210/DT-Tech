const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const multer = require("multer"); // Add multer for handling file uploads
const path = require("path");

const app = express();
const port = 3000;

// Set up multer for storing uploaded files
const storage = multer.diskStorage({
  destination: "uploads/", // Directory to store uploaded files
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + fileExtension);
  },
});

const upload = multer({ storage });

// MongoDB connection parameters
const mongo_URI =
"mongodb+srv://urvashishukla1210:obcEiQx6oW2bYyBj@cluster0.cmsojbe.mongodb.net/";
const dbName = "user";

app.use(express.json());

// Function to establish a MongoDB connection
async function connectToDb() {
  const client = await MongoClient.connect(mongo_URI);
  return client.db(dbName);
}

// GET /api/v3/app/events - Get events by type or id
app.get('/api/v3/app/events', async (req, res) => {
  try {
    const { id, type, page, limit } = req.query;
    const db = await connectToDb();
    
    let query = {};
    if (id) {
      query._id = new ObjectId(id);
    }
    if (type) {
      query.type = type;
    }
    
    const events = await db.collection('events')
      .find(query)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .toArray();
      
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /events - Create an event and return the created event's id
app.post("/api/v3/app/events", upload.single("image"), async (req, res) => {
  try {
    const image = req.file; // 
    const eventData = req.body;
    const db = await connectToDb();
    const response = await db.collection("events").insertOne(eventData);

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// PUT /events/:id - Update an event
app.put("/api/v3/app/events/:id", upload.none(), async (req, res) => {
  try {
    const eventId = req.params.id;
    const updatedEventData = req.body;

    const { uid, name, tagline, schedule, description, moderator, category, sub_category, rigor_rank, attendees } = updatedEventData;


    const db = await connectToDb();
    await db
      .collection("events")
      .updateOne({ _id:new ObjectId(eventId) }, { $set: updatedEventData });

    res.json({ event_id: eventId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// DELETE /events/:id - Delete an event
app.delete("/api/v3/app/events/:id", async (req, res) => {
  try {
    const event_id = req.params.id;
    const db = await connectToDb();
    await db.collection("events").deleteOne({ _id: new ObjectId(event_id) });
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});