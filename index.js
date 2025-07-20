import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
const app = express();
app.set("view engine", "ejs");
app.set("views", "./views");
import dotenv from "dotenv";
dotenv.config();

const port = 4000;
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required by Supabase
});

db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
console.log("Connected to:", process.env.DATABASE_URL);

let items = [];

app.get("/login", (req, res) => {
  res.render("login.ejs"); // Create this form to collect username
});

app.post("/login", async (req, res) => {
const username = req.body.username;

  // Simulate login or create user if not exists
  let user = await db.query("SELECT * FROM users WHERE username = $1", [username]);

  if (user.rows.length === 0) {
    await db.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, "test123"]);
    user = await db.query("SELECT * FROM users WHERE username = $1", [username]);
  }

  const userId = user.rows[0].id;
  res.redirect(`/lists/Today?username=${username}`);
});
app.get("/lists/:listName", async (req, res) => {
  const listName = req.params.listName;
  const username = req.query.username;

  if (!username) {
    return res.status(400).send("Missing username");
  }

  try {
    const userResult = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const userId = userResult.rows[0]?.id;

    if (!userId) {
      return res.status(404).send("User not found");
    }

    const itemsResult = await db.query(
      "SELECT * FROM items WHERE list = $1 AND user_id = $2 ORDER BY id ASC",
      [listName, userId]
    );

    res.render("index.ejs", {
      listTitle: listName,
      listItems: itemsResult.rows,
      username: username
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});




app.post("/add", async (req, res) => {
  const { newItem: item, listName: list, username } = req.body;

  try {
    const user = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const userId = user.rows[0].id;

   await db.query("INSERT INTO items (title, list, user_id, username) VALUES($1, $2, $3, $4)", [item, list, userId, username]);

    res.redirect(`/lists/${list}?username=${username}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to add item.");
  }
});



app.get("/", (req, res) => {
  res.redirect("/login");
});


app.post("/edit", async (req, res) => {
  const { updatedItemTitle: item, updatedItemId: id, listName: list, username } = req.body;

  try {
    const user = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const userId = user.rows[0].id;

    await db.query(
      "UPDATE items SET title = $1 WHERE id = $2 AND user_id = $3",
      [item, id, userId]
    );
    res.redirect(`/lists/${list}?username=${username}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to edit item.");
  }
});

app.post("/delete", async (req, res) => {
  const { updatedItemId: id, listName: list, username } = req.body;

  try {
    const user = await db.query("SELECT id FROM users WHERE username = $1", [username]);
    const userId = user.rows[0].id;

    await db.query("DELETE FROM items WHERE id = $1 AND user_id = $2", [id, userId]);
    res.redirect(`/lists/${list}?username=${username}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to delete item.");
  }
});
app.get("/all-lists", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT items.title, items.list, users.username
      FROM items
      JOIN users ON items.user_id = users.id
      ORDER BY users.username, items.list, items.id
    `);

    res.render("all-lists.ejs", { allItems: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch all to-do lists.");
  }
});




app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
