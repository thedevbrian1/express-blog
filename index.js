import express from "express";
import "dotenv/config";
import { MongoClient } from "mongodb";

let port = 3000;

let app = express();

// Use static assets
app.use(express.static("public"));

// Set templating engine
app.set("views", "./views");
app.set("view engine", "pug");

// Body parser
app.use(express.urlencoded({ extended: true }));

// MongoDB connection string
let uri = `mongodb+srv://hik75638:${process.env.MONGODB_PASSWORD}@cluster0.wwmwp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

let client = new MongoClient(uri);

// Home route
app.get("/", (req, res) => {
  res.render("index", { title: "Blog" });
});

// New blog route
app.get("/new-post", (req, res) => {
  res.render("new-post", { title: "New post" });
});

app.post("/new-post", async (req, res) => {
  let body = req.body;

  // Validation
  if (
    !body.title ||
    !body.content ||
    !body.image ||
    !body["author-name"] ||
    !body["author-image"]
  ) {
    return res.status(400).render("error", {
      message: "Invalid input data. Check your form and submit again",
    });
  }

  let blogObj = {
    title: body.title,
    content: body.content,
    image: body.image,
    author_name: body["author-name"],
    author_image: body["author-image"],
  };

  // Create a post document in the db
  let db = client.db("blog");
  let collection = db.collection("blog");

  let result = await collection.insertOne(blogObj);
  console.log({ result });

  res.redirect("/");
});

app.listen(port, () => console.log(`Server running at port ${port}`));
