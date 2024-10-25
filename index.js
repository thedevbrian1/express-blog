import express from "express";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

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
app.get("/", async (req, res) => {
  // Fetch blogs from the db
  let db = client.db("blog");
  let collection = db.collection("blog");

  let blogs = await collection.find().toArray();
  console.log({ blogs });

  res.render("index", { title: "Blog", blogs });
});

// New blog route
app.get("/new-post", (req, res) => {
  res.render("newPost", { title: "New post" });
});

// Individual blog route
app.get("/posts/:id", async (req, res) => {
  // Get the blog id from the request
  let id = req.params.id;

  let db = client.db("blog");
  let collection = db.collection("blog");

  let blog = await collection.findOne({ _id: new ObjectId(id) });

  console.log({ blog });
  res.render("post", { title: blog.title, blog });
});

// Route for editing a post
app.get("/posts/:id/edit", async (req, res) => {
  let id = req.params.id;
  let db = client.db("blog");
  let collection = db.collection("blog");

  let blog = await collection.findOne({ _id: new ObjectId(id) });

  console.log({ blog });
  res.render("editPost", { title: blog.title, blog });
});

// Route for handling creation of new posts
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

app.post("/add-comment", async (req, res) => {
  let body = req.body;

  let id = body.id;
  let intent = body.intent;

  let db = client.db("blog");
  let collection = db.collection("blog");

  if (intent === "like-and-dislike") {
    // Handle likes and dislikes

    let action = body._action;
    console.log({ action });

    if (action === "like") {
      let result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: {
            likes: 1,
          },
        }
      );
      console.log({ result });
    } else if (action === "dislike") {
      let result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: {
            likes: -1,
          },
        }
      );
      console.log({ result });
    }

    res.send("ok");
  } else if (intent === "comment") {
    // Handle comments

    // Validation
    if (!body.username || !body.comment) {
      return res.status(400).render("error", {
        message: "Invalid input data. Check your form and submit again",
      });
    }

    let comment = {
      username: body.username,
      comment: body.comment,
    };

    // Add comment to the blog post

    let result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } }
    );
    console.log({ result });
    res.redirect(`/posts/${id}`);
  }
});

app.listen(port, () => console.log(`Server running at port ${port}`));
