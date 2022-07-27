const express = require('express');
const mongoose = require("mongoose");
const _ = require('lodash');
const app = express();
const port = 3000;

let db_credentials = {
    dbUser: process.env.MONGO_DB_USER,
    dbPass: process.env.MONGO_DB_PASS
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
console.log(db_credentials);
mongoose.connect(`mongodb+srv://${db_credentials.dbUser}:${db_credentials.dbPass}@cluster0.wlamz.mongodb.net/todolistDB?retryWrites=true&w=majority`);

const itemsSchema = { name: String };

const Item = mongoose.model('Item', itemsSchema);

const brushTeeth = new Item({
    name: "Brush Teeth"
});

const doYoga = new Item({
    name: "Do Yoga"
});

const shower = new Item({
    name: "Shower"
});

const defaultItems = [brushTeeth, doYoga, shower];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get('/', (req, res) => {
    
    Item.find({}, (err, results) => {

        if(results.length === 0) {
            Item.insertMany(defaultItems, (err) => {
                if(err) {
                    console.log(err);
                } else {
                    console.log("Successfully added items to DB");
                }
            });
            res.redirect('/');
        } 
        else if(err) {
            console.log(err);
        } else {
            res.render('list', {listTitle: 'Today', newListItem: results});
        }
    });
});

app.post('/', (req, res) => {
   
    const itemName = req.body.newToDoItem;
    const listName = req.body.listTitle;

    const item = Item({
        name: itemName
    });

    if(listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, foundList) => {
            if(err) {
                console.log(err);
            } else{
                console.log(foundList)
                foundList.items.push(item);
                foundList.save();
                res.redirect(`/${listName}`);
            }
        })
    }
});

app.get('/:customListName', (req, res) => {
    const customListName = _.capitalize(req.params.customListName);
    const list = new List({
        name: customListName,
        items: defaultItems
    })

    List.findOne({name: customListName}, (err, result) => {
        if(err) {
            console.log(err);
        } else if(!result) {
            list.save();
            res.redirect(`/${customListName}`);
        } else {
            res.render('list', {listTitle: customListName, newListItem: result.items});
        }
    });
   
});

app.post('/delete', (req, res) => {
    const listTitle = req.body.listTitle;
    const checkboxId = req.body.checkbox;

    if(listTitle === "Today") {
        Item.deleteOne({_id: checkboxId}, (err) => {
            if(err) {
                console.log(err);
            } else {
                console.log("Deleted from DB");
                res.redirect('/');
            }
        }); 
    } else {
        List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: checkboxId}}}, (err) => {
            if(!err) {
                res.redirect("/" + listTitle);
            } else {
                console.log(err);
            }
        });
    }
    
});



app.get('/about', (req, res) => {
    res.render("about");
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))