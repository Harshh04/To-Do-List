//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash") ;


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://harshin416:Openit004@cluster0.lf00ccc.mongodb.net/?retryWrites=true&w=majority",{useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => console.log("Database connection established successfully!"))
  .catch(err => console.error("Database connection error:", err));

const itemsSchema = {
  name : String
} ;

const Item = mongoose.model("Item",itemsSchema) ;
const task1 = new Item({name : "Buy Food"}) ;
const task2 = new Item({name : "Cook Food"}) ;
const task3 = new Item({name : "Eat Food"}) ;

const defaultItems = [task1,task2,task3] ;

const listSchema = {
    name: String ,
    items : [itemsSchema]
}

const List = mongoose.model("List",listSchema) ;

app.get("/", function(req, res) {
  let foundItems = Item.find({})
  .then(foundItems => {
    if(foundItems.length === 0 )
    {
      Item.insertMany(defaultItems)
      .then(() => console.log("Default items inserted successfully!"))
      .catch(err => console.error("Error inserting default items:", err));
    }
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  })
  .catch(err => {
    console.error("Error finding items:", err);
  });


});

app.post("/", function(req, res){
  const item = req.body.newItem;
  const listName = req.body.list ;

  const newItem = new Item({name: item});
  
  if(listName === "Today")
  {
    newItem.save()
    .then(() => {
      console.log("New item added successfully!");
      res.redirect("/");
    })
    .catch(err => console.error("Error adding new item:", err));
  }

  else
  {
    List.findOne({name : listName})
    .then(result => {
      result.items.push(newItem) ;
      result.save() ;
      res.redirect("/"+ listName)
    })
  }
  
});

app.post("/delete" , function(req,res)
{
  const checkedItemId = (req.body.checkbox) ;
  const listName = req.body.listName ;

  if(listName === "Today")
  {
    Item.findOneAndDelete({ _id: checkedItemId })
    .then(result => {console.log("Deleted Successfully :",result.name)})
    .catch(err=>{console.log(err) ;})
    res.redirect("/") ;
  }
  else
  {
    List.findOneAndUpdate({name : listName},{$pull: {items : {_id : checkedItemId}}})
    .then(foundList=>{res.redirect("/"+listName)})
    .catch(err=>{console.log(err)})
  }
  
})


app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:customListName" , function(req,res)
{   

  const customListName = _.capitalize(req.params.customListName) ;

  List.findOne({name : customListName})
  .then(foundList => {
    if(!foundList)
    {
      const list = new List({
        name : customListName ,
        items : defaultItems ,
      }) ;
    
      list.save() ;

      res.render("list",{listTitle : list.name , newListItems : list.items})
    }

    else 
    {
      console.log("List Exists") ;
      res.render("list",{listTitle : foundList.name , newListItems : foundList.items})
    }
  }) 
  .catch(err=>{console.log(err) ;})

})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
