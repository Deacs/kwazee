// http://howtonode.org/express-mongodb

var express = require('express');
// var ArticleProvider = require('./articleprovider-memory.js').ArticleProvider;
var ArticleProvider = require('./articleprovider-mongodb.js').ArticleProvider;

// var app = module.exports = express.createServer(); // DEPRECATED
var app = express();

// Configuration
app.configure(function() {
  app.set('views', __dirname +'/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStock: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

var articleProvider = new ArticleProvider('localhost', 27017);

// Routes
app.get('/', function(req, res) {
  articleProvider.findAll(function(error, docs) {
    res.render('index.jade', {
      title: 'Blog',
      articles:docs
    });
  });
});

app.get('/blog/new', function(req, res) {
  res.render('blog_new.jade', {
    title: 'New Post'
  });
});

app.post('/blog/new', function(req, res) {
  articleProvider.save({
    title: req.param('title'),
    body: req.param('body')
  }, function(error, docs) {
    res.redirect('/')
  });
});

app.get('/blog/:id', function(req, res) {
  articleProvider.findById(req.params.id, function(error, article) {
    res.render('blog_show.jade', {
      id: article._id,
      title: article.title,
      article: article,
      // Always ensure that we have a value for the comments
      // Prevents the template throwing an error when there are 
      // no comments stored against the article
      comments: typeof article.comments !== "undefined" ? article.comments : []
    });
  });
});

app.get('/blog/delete/:id', function(req, res) {
  articleProvider.removeArticle(
    req.params.id
    , function(error, docs) {
      res.redirect('/');
    });
});

app.post('/blog/updatePost', function(req, res) {
  articleProvider.updateArticle(
    req.param('_id'),
    {
      title:  req.param('title'),
      body:   req.param('body')
    }, function(error, docs) {
      res.redirect('/blog/' + req.param('_id'));
  });
});

app.post('/blog/addComment', function(req, res) {
  articleProvider.addCommentToArticle(req.param('_id'), {
    id: new Date().getTime(),
    person: req.param('person'),
    comment: req.param('comment'),
    created_at: new Date()
    }, function(error, docs) {
      res.redirect('/blog/' + req.param('_id'));
    });
});

// New: remove a comment from a post
app.get('/blog/removeComment/:id/:commentIndex', function(req, res) {
  articleProvider.findById(req.params.id, function(error, article) {
    articleProvider.removeArticleComment(req.param('id'), article, req.param('commentIndex'), function(error, docs) {
      res.redirect('/blog/'+req.param('id'));
      res.end();
    });
  });
});

app.listen(3000);
console.log("Express server listening in %s mode", app.settings.env);
// console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
