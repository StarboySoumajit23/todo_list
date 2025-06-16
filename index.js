import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
const app = express();
const port = 4000;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "goals",
  password: "Soumajit@123",
  port: 3000,
});
db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let items = [];
app.get("/lists/:listName", async (req, res) => {
  const listName = req.params.listName;

  try {
    const result = await db.query("SELECT * FROM items WHERE list = $1 ORDER BY id ASC", [listName]);
    const items = result.rows;
    res.render("index.ejs", {
      listTitle: listName,
      listItems: items,
    });
  } catch (err) {
    console.log(err);
  }
});

// app.get("/", async(req, res) => {
//   try{
//      const result = await db.query("SELECT * FROM items ORDER BY id ASC");
//     items = result.rows;
//     res.render("index.ejs", {
//     listTitle: "Today",
//     listItems: items,
//   });
//   }catch(err){
//     console.log(err);
//   }
  
// });

// app.post("/add", async(req, res) => {
//   const item = req.body.newItem;
  
//   try{
// await db.query("INSERT INTO items (title) VALUES($1)",[item]);
// res.redirect("/");
//   }catch(err){
//     console.log(err);
//   }
// });
app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  const list = req.body.listName; // Hidden input in form

  try {
    await db.query("INSERT INTO items (title, list) VALUES($1, $2)", [item, list]);
    res.redirect(`/lists/${list}`);
  } catch (err) {
    console.log(err);
  }
});

app.get("/", (req, res) => {
  res.redirect("/lists/Today");
});

// app.post("/edit", async(req, res) => {
//    const item = req.body.updatedItemTitle;
//   const id = req.body.updatedItemId;
//  try{
// await db.query("UPDATE items SET title=$1 WHERE id=$2",[item,id]);
// res.redirect("/");
//   }catch(err){
//     console.log(err);
//   }
// });

// app.post("/delete",async(req, res) => {
// const id = req.body.updatedItemId;
//  try{
// await db.query("DELETE FROM items WHERE id=$1",[id]);
// res.redirect("/");
//   }catch(err){
//     console.log(err);
//   }
// });
app.post("/edit", async (req, res) => {
  const item = req.body.updatedItemTitle;
  const id = req.body.updatedItemId;
  const list = req.body.listName;

  try {
    await db.query("UPDATE items SET title=$1 WHERE id=$2", [item, id]);
    res.redirect(`/lists/${list}`);
  } catch (err) {
    console.log(err);
  }
});

app.post("/delete", async (req, res) => {
  const id = req.body.updatedItemId;
  const list = req.body.listName;

  try {
    await db.query("DELETE FROM items WHERE id=$1", [id]);
    res.redirect(`/lists/${list}`);
  } catch (err) {
    console.log(err);
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
