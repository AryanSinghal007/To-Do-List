
const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/toDoListDB');

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item",itemsSchema)


const ListSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List",ListSchema)

const item1 = new Item({
    name: "Welcome to To-Do List Website",
});

const item2 = new Item({
  name: "<--- Hit the checkbox to delete",
});

const item3 = new Item({
  name: "Hit + to add items",
});

const defaultItems = [item1, item2, item3];

app.get("/", function(req, res) {

    Item.find()
    .then((FoundItems) => {
        if(FoundItems.length === 0){
            Item.insertMany(defaultItems)
                .then((insertedItems) => {
                    console.log('Items inserted');
                })
                .catch((error) => {
                    console.log('Error inserting Items:', error);
                });
            res.redirect("/");
        }else{
            res.render("list", {listTitle: day, newListItems: FoundItems});
        }
    })
    .catch((error) => {
        console.log(error);
    });

    const day = date.getDate();

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
        name: itemName,
  });
  const day = date.getDate();
  if(listName === day){
      item.save();
      res.redirect("/");
  }else{
      List.findOne({ name: listName })
          .then((foundList) => {
              foundList.items.push(item);
              foundList.save();
              res.redirect("/" + listName);
          })
  }
});

app.post("/delete", function(req, res){
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    const day = date.getDate();
    if(listName === day){
        Item.deleteOne({ _id: checkedItemID })
            .then(() => {
                console.log("Item deleted"); // Success
            })
            .catch((error) => {
                console.log(error); // Failure
            });
        res.redirect("/");
    }else{
        List.findOneAndUpdate(
            { name: listName },
            { $pull: { items: { _id: checkedItemID } } }
        )
            .then(() => {
                res.redirect("/" + listName);
            })
            .catch((error) => {
                console.log(error);
            });
    }
});

app.get("/:customListName", function (req, res) {
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({ name: customListName })
        .then((foundList) => {
            if (!foundList) {
                // create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        })
        .catch((error) => {
            console.log(error);
        });

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
