// Function to get all books available in the shop
function getAllBooks(books) {
    return new Promise((resolve, reject) => {
        // Assuming 'books' is an array containing all the books
        if (books && books.length > 0) {
            resolve(books);
        } else {
            reject(new Error('No books found'));
        }
    });
}

module.exports = {
    getAllBooks
};
