---
layout: post
title:  "Switching to MySQL from MongoDB in Node.js"
date:   2016-05-05 18:53:54 -0500
categories: express javascript mysql node-js
---
There are a lot of resources on the web on how to set up a Node.js / Express server with MongoDB for basic CRUD operations. I usually deal with relational data however, and prefer something like MySQL. So I switched this <a href="http://coenraets.org/blog/2012/10/nodecellar-sample-application-with-backbone-js-twitter-bootstrap-node-js-express-and-mongodb/" target="_blank">Node Cellar sample app</a> from Mongo to MySQL using the <a href="https://www.npmjs.com/package/express-myconnection" target="_blank">express-myconnection</a> NPM package.

Install and require the <strong>mysql</strong> and <strong>express-myconnection</strong> packages in your project using NPM.  The MySQL connection can be set up in your Node server along with Express. This assumes you already have an Express server set up.

{% highlight js %}
var app = express();

var connection  = require('express-myconnection'),
    mysql = require('mysql');

app.use(

    connection(mysql,{
        host     : 'example.com',
        user     : 'youruser',
        password : 'YOURPASSWORD',
        port	 : 3306,
        database : 'yourdb'
    },'request')

);
{% endhighlight %}

Below are the MySQL CRUD operations, with the MongoDB equivalent commented out for comparison. Following along with the <a href="http://coenraets.org/blog/2012/10/nodecellar-sample-application-with-backbone-js-twitter-bootstrap-node-js-express-and-mongodb/" target="_blank">Node Cellar sample app</a>, this replaces most of <em>wines.js</em>. Note the addition of the <em>next</em> parameter to return errors to the Node server.

{% highlight js %}
exports.findById = function(req, res, next) {
    var id = req.params.id;
    console.log('Retrieving wine: ' + id);
    /*
    db.collection('wines', function(err, collection) {
        collection.findOne({'_id':new BSON.ObjectID(id)}, function(err, item) {
            res.send(item);
        });
    });*/
   
    req.getConnection(function (err, conn){
        if (err) return next(&quot;Cannot connect to mysql&quot;);
        var query = conn.query(&quot;SELECT * FROM Wines WHERE _id = ?&quot;, id, function(err, rows) {
	    	if(err){
	            console.log(err);
	            return next(&quot;Mysql error, check your query&quot;);
	       } else {
	       		console.log(rows[0]);
	       }
	        
		  res.send(rows[0]);
        });
     });
};

exports.findAll = function(req, res, next) {
	console.log('Retrieving all wines');
	/*
    db.collection('wines', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });*/
   
    req.getConnection(function (err, conn){
        if (err) return next(&quot;Cannot connect to mysql&quot;);
        var query = conn.query(&quot;SELECT * FROM Wines&quot;, function(err, rows) {
	    	if(err){
	            console.log(err);
	            return next(&quot;Mysql error, check your query&quot;);
	         }
			 res.send(rows);
        });
     });
};

exports.addWine = function(req, res, next) {
    var wine = req.body;
    console.log('Adding wine: ' + JSON.stringify(wine));
    /*
    delete wine._id;  
    db.collection('wines', function(err, collection) {
        collection.insert(wine, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                res.send(result[0]);
            }
        });
    });*/
     
    req.getConnection(function (err, conn){
        if (err) return next(&quot;Cannot connect to mysql&quot;);
        var query = conn.query(&quot;INSERT INTO Wines SET ? &quot;, wine, function(err, rows) {
	    	if(err){
	            console.log(err);
	            return next(&quot;Mysql error, check your query&quot;);
	        } else {
	       		console.log(&quot;Data inserted with Id: &quot; + rows.insertId);
	        }
          wine._id = rows.insertId;
		  res.send(wine);
        });
     });
}

exports.updateWine = function(req, res, next) {
    var id = req.params.id;
    var wine = req.body;
    delete wine._id;
    console.log('Updating wine: ' + id);
    console.log(JSON.stringify(wine));
    /*
    db.collection('wines', function(err, collection) {
        collection.update({'_id':new BSON.ObjectID(id)}, wine, {safe:true}, function(err, result) {
            if (err) {
                console.log('Error updating wine: ' + err);
                res.send({'error':'An error has occurred'});
            } else {
                console.log('' + result + ' document(s) updated');
                res.send(wine);
            }
        });
    });*/
   
    req.getConnection(function (err, conn){
        if (err) return next(&quot;Cannot connect to mysql&quot;);
        var query = conn.query(&quot;UPDATE Wines SET ? WHERE _id = ?&quot;, [wine,id], function(err, rows) {
	    	if(err){
	            console.log(err);
	            return next(&quot;Mysql error, check your query&quot;);
	        } else {
	       		console.log(&quot;Data updated, rows affected: &quot; + rows.affectedRows);
	        }
		  res.send(wine);
        });
     });
}

exports.deleteWine = function(req, res, next) {
    var id = req.params.id;
    console.log('Deleting wine: ' + id);
    /*
    db.collection('wines', function(err, collection) {
        collection.remove({'_id':new BSON.ObjectID(id)}, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred - ' + err});
            } else {
                console.log('' + result + ' document(s) deleted');
                res.send(req.body);
            }
        });
    });*/
   
    req.getConnection(function (err, conn){
        if (err) return next(&quot;Cannot connect to mysql&quot;);
        var query = conn.query(&quot;DELETE FROM Wines WHERE _id = ?&quot;, id, function(err, rows) {
	    	if(err){
	            console.log(err);
	            return next(&quot;Mysql error, check your query&quot;);
	        } else {
	       		console.log(&quot;Data deleted, rows affected: &quot; + rows.affectedRows);
	        }
		  res.send(req.body);
        });
     });
}

{% endhighlight %}