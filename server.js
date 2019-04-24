var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");
var bodyparser = require("body-parser");
var path = require('path');

// var request = require("request");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server

var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {useNewUrlParser: true});


// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  console.log("scrape article");

    // First, we grab the body of the html with axios
    axios.get("https://sfbay.craigslist.org/").then(function(response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);
      console.log("scrape article", response);

      // Now, we grab every h2 within an article tag, and do the following:
      $(".result-row").each(function(i, element) {
        // Save an empty result object
        var article = {};
  
        // Add the text and href of every link, and save them as properties of the result object
        article.image = $(this)
          .children("a")
          .attr("href");

        article.link = $(this)
          .find("result-title")
          .attr("href");
  
        article.title = $(this)
          .find("result-title")
          .text();
            console.log("scrape article", article);

        // Create a new Article using the `result` object built from scraping
        db.Article.create(article)
          .then(function(dbArticle) {
            // View the added result in the console
            console.log(dbArticle);
          })
          .catch(function(err) {
            // If an error occurred, log it
            console.log(err);
          });
      });
  
      // Send a message to the client
      res.send("Scrape Complete");
    });
  });

  // Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
      .then(function(dbNote) {
        // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
      })
      .then(function(dbArticle) {
        // If we were able to successfully update an Article, send it back to the client
        res.json(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

app.get("/articles", function(req, res)
{
    console.log("inside git all route");

    db.Article.find({})
    .then(function(dbArticle) {
        console.log("dbArticle", dbArticle);
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
}); 
  
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Survey page
app.get('/note', function(req, res) {
  res.sendFile(path.join(__dirname, '../public/note.html'));
});

app.listen(PORT, function(){
    console.log("listening on" + PORT)
})

