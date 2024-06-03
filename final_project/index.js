const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;
const { getAllBooks } = require('./general.js');

const app = express();

app.use(express.json());


// Configure session middleware
app.use(session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true
  }));
  
  // Mock users data
  const users = [];
  
  // Mock books data
  const books = [
    { isbn: '123456789', title: 'Book 1', author: 'Author 1', reviews: [] },
    { isbn: '987654321', title: 'Book 2', author: 'Author 2', reviews: [] }
    // More books...
  ];
  
  // Authentication middleware using session
  app.use("/customer/auth/*", function auth(req, res, next) {
    // Check if user is authenticated
    if (!req.session.authenticated) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    next(); // Proceed to next middleware
  });

// Route to get book reviews based on ISBN
app.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books.find(book => book.isbn === isbn);
    if (book) {
      res.send(book.reviews);
    } else {
      res.status(404).send('Book not found');
    }
});

// Route to get all books available in the shop
app.get('/', async (req, res) => {
    try {
        const allBooks = await getAllBooks(books); // Pass the 'books' array to the function
        res.send(JSON.stringify(allBooks, null, 2)); // Use JSON.stringify for neat output
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to get book details based on title
app.get('/title/:title', function (req, res) {
    const title = req.params.title;
    const book = books.find(book => book.title === title);
    if (book) {
      res.send(JSON.stringify(book, null, 2)); // Use JSON.stringify for neat output
    } else {
      res.status(404).send('Book not found');
    }
  });

  // Route to get book details based on author
app.get('/author/:author', function (req, res) {
    const author = req.params.author;
    const authorBooks = books.filter(book => book.author === author);
    if (authorBooks.length > 0) {
      res.send(authorBooks);
    } else {
      res.status(404).send('Books by author not found');
    }
  });
  
  

// Route to register a new user
app.post('/register', function (req, res) {
    const { username, password } = req.body;
  
    // Check if username and password are provided
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
  
    // Check if username already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
  
    // Register the new user
    const newUser = { username, password };
    users.push(newUser);
  
    res.status(201).json({ message: 'User registered successfully', user: newUser });
});



// Route to login as a registered user
app.post('/customer/login', function (req, res) {
    const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check if username exists and password matches
    const user = users.find(user => user.username === username && user.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token and save it in session
    const token = jwt.sign({ username }, 'secret_key');
    req.session.token = token;

    res.status(200).json({ message: 'Login successful', token });
});

// Route to add or modify a book review
app.post('/addReview/:isbn', function (req, res) {
    const { review } = req.query;
    const { username } = req.session;

    // Check if review and username are provided
    if (!review || !username) {
        return res.status(400).json({ message: 'Review and username are required' });
    }

    const isbn = req.params.isbn;

    // Find the book by ISBN
    const bookIndex = books.findIndex(book => book.isbn === isbn);

    // If the book is not found, return a 404 error
    if (bookIndex === -1) {
        return res.status(404).json({ message: 'Book not found' });
    }

    // Check if the user has already reviewed the book
    const existingReviewIndex = books[bookIndex].reviews.findIndex(r => r.username === username);

    // If the user has already reviewed the book, update the review
    if (existingReviewIndex !== -1) {
        books[bookIndex].reviews[existingReviewIndex].review = review;
    } else { // Otherwise, add a new review
        books[bookIndex].reviews.push({ username, review });
    }

    res.status(200).json({ message: 'Review added or modified successfully' });
});

// Route to delete a book review
app.delete('/auth/review/:isbn', (req, res) => {
    const { username } = req.session;
    const isbn = req.params.isbn;

    // Find the book by ISBN
    const bookIndex = books.findIndex(book => book.isbn === isbn);

    // If the book is not found, return a 404 error
    if (bookIndex === -1) {
        return res.status(404).json({ message: 'Book not found' });
    }

    // Find the index of the review by the current user
    const reviewIndex = books[bookIndex].reviews.findIndex(review => review.username === username);

    // If the review by the current user is not found, return a 404 error
    if (reviewIndex === -1) {
        return res.status(404).json({ message: 'Review not found for the current user' });
    }

    // Remove the review by the current user
    books[bookIndex].reviews.splice(reviewIndex, 1);

    res.status(200).json({ message: 'Review deleted successfully' });
});





const PORT = 5000;

app.listen(PORT, () => console.log("Server is running"));