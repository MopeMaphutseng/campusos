//Mzwandile Hlapisi 202321287
//Rearabetsoe Monyako 202321246
//Teboho Montle 202407866
//Kabelo Lekhanya 202402333

#include <iostream>
#include <string>
using namespace std;

// Linked List for Transaction History

struct Transaction {
    string userID;
    string bookTitle;
    string action; // Borrowed / Returned
    Transaction* next;
};

class TransactionList {
private:
    Transaction* head;
public:
    TransactionList() { head = NULL; }

    // Add a transaction to the linked list (Borrow/Return)
    void addTransaction(string userID, string bookTitle, string action) {
        Transaction* newNode = new Transaction{userID, bookTitle, action, NULL};
        if (head == NULL) head = newNode;
        else {
            Transaction* temp = head;
            while (temp->next != NULL) temp = temp->next;
            temp->next = newNode;
        }
    }

    // Display all transactions
    void displayTransactions() {
        Transaction* temp = head;
        cout << "\n--- Transaction History ---\n";
        while (temp != NULL) {
            cout << "User: " << temp->userID << " | Book: " << temp->bookTitle
                 << " | Action: " << temp->action << endl;
            temp = temp->next;
        }
    }
};


// Queue for Waiting List

struct QueueNode {
    string userID;
    QueueNode* next;
};

class Queue {
private:
    QueueNode* front;
    QueueNode* rear;
public:
    Queue() { front = rear = NULL; }

    // Check if queue is empty
    bool isEmpty() { return front == NULL; }

    // Enqueue user into waiting list
    void enqueue(string userID) {
        QueueNode* newNode = new QueueNode{userID, NULL};
        if (rear == NULL) {
            front = rear = newNode;
        } else {
            rear->next = newNode;
            rear = newNode;
        }
    }

    // Dequeue next user from waiting list
    string dequeue() {
        if (isEmpty()) return "";
        QueueNode* temp = front;
        string user = temp->userID;
        front = front->next;
        if (front == NULL) rear = NULL;
        delete temp;
        return user;
    }
};

// BST for Book Indexing

struct Book {
    string title;
    string author;
    bool available;
    Queue waitingList; // Queue for reservations
    Book* left;
    Book* right;
};

class BST {
public:
    Book* root;
    BST() { root = NULL; }

    // Insert book into BST (indexed by title)
    Book* insert(Book* node, string title, string author) {
        if (node == NULL) {
            Book* newBook = new Book{title, author, true, Queue(), NULL, NULL};
            return newBook;
        }
        if (title < node->title)
            node->left = insert(node->left, title, author);
        else if (title > node->title)
            node->right = insert(node->right, title, author);
        return node;
    }

    // Wrapper to add book
    void addBook(string title, string author) {
        root = insert(root, title, author);
        cout << "Book added successfully.\n";
    }

    // Search BST for book by title
    Book* search(Book* node, string title) {
        if (node == NULL || node->title == title)
            return node;
        if (title < node->title)
            return search(node->left, title);
        return search(node->right, title);
    }

    // Display all books in-order (alphabetical)
    void inorder(Book* node) {
        if (node != NULL) {
            inorder(node->left);
            cout << "Title: " << node->title << " | Author: " << node->author
                 << " | Available: " << (node->available ? "Yes" : "No") << endl;
            inorder(node->right);
        }
    }

    void displayBooks() {
        cout << "\n--- Library Books ---\n";
        inorder(root);
    }
};

// Hash Table for Quick Lookup

#define TABLE_SIZE 10

struct HashEntry {
    string key;
    Book* book;
    HashEntry* next;
};

class HashTable {
private:
    HashEntry* table[TABLE_SIZE];

    // Simple hash function using sum of ASCII values
    int hashFunc(string key) {
        int hash = 0;
        for (int i = 0; i < key.length(); i++)
            hash += key[i];
        return hash % TABLE_SIZE;
    }

public:
    HashTable() {
        for (int i = 0; i < TABLE_SIZE; i++)
            table[i] = NULL;
    }

    // Insert book into hash table for fast lookup
    void insert(string key, Book* book) {
        int index = hashFunc(key);
        HashEntry* newEntry = new HashEntry{key, book, NULL};
        if (table[index] == NULL)
            table[index] = newEntry;
        else {
            HashEntry* temp = table[index];
            while (temp->next != NULL) temp = temp->next;
            temp->next = newEntry;
        }
    }

    // Search book by title in hash table
    Book* search(string key) {
        int index = hashFunc(key);
        HashEntry* temp = table[index];
        while (temp != NULL) {
            if (temp->key == key) return temp->book;
            temp = temp->next;
        }
        return NULL;
    }
};

// Library Management System

class LibrarySystem {
private:
    BST bst;                  // BST for book indexing
    HashTable hashTable;      // Hash table for fast lookup
    TransactionList transactions; // Linked list for transaction history

public:
    // Add new book
    void addBook() {
        string title, author;
        cout << "Enter book title: ";
        getline(cin >> ws, title);
        cout << "Enter author: ";
        getline(cin >> ws, author);

        bst.addBook(title, author);         // Add to BST
        Book* newBook = bst.search(bst.root, title);
        hashTable.insert(title, newBook);   // Add to Hash Table
    }

    // Borrow a book
    void borrowBook() {
        string userID, title;
        cout << "Enter your User ID: ";
        getline(cin >> ws, userID);
        cout << "Enter book title: ";
        getline(cin >> ws, title);

        Book* book = bst.search(bst.root, title); // Search in BST
        if (book == NULL) {
            cout << "Book not found.\n";
            return;
        }

        if (book->available) {
            book->available = false;
            transactions.addTransaction(userID, title, "Borrowed"); // Linked list log
            cout << "Book borrowed successfully.\n";
        } else {
            book->waitingList.enqueue(userID); // Queue for waitlist
            cout << "Book already borrowed. You have been added to the waiting list.\n";
        }
    }

    // Return a book
    void returnBook() {
        string userID, title;
        cout << "Enter your User ID: ";
        getline(cin >> ws, userID);
        cout << "Enter book title: ";
        getline(cin >> ws, title);

        Book* book = bst.search(bst.root, title); // Search in BST
        if (book == NULL) {
            cout << "Book not found.\n";
            return;
        }

        book->available = true;
        transactions.addTransaction(userID, title, "Returned"); // Linked list log
        cout << "Book returned successfully.\n";

        // Check waiting list queue
        if (!book->waitingList.isEmpty()) {
            string nextUser = book->waitingList.dequeue(); // Queue dequeue
            book->available = false;
            transactions.addTransaction(nextUser, title, "Borrowed (from queue)");
            cout << "Book automatically borrowed by next user in queue: " << nextUser << endl;
        }
    }

    // Search for a book
    void searchBook() {
        string title;
        cout << "Enter book title to search: ";
        getline(cin >> ws, title);

        Book* book = hashTable.search(title); // Fast lookup via hash table
        if (book == NULL)
            cout << "Book not found.\n";
        else
            cout << "Book found - Title: " << book->title
                 << " | Author: " << book->author
                 << " | Available: " << (book->available ? "Yes" : "No") << endl;
    }

    // Display all books
    void showAllBooks() {
        bst.displayBooks(); // In-order traversal of BST
    }

    // Display transaction history
    void showTransactions() {
        transactions.displayTransactions(); // Linked list display
    }

    // Console menu
    void menu() {
        int choice;
        do {
            cout << "\n==== NUL SMART LIBRARY SYSTEM ====\n";
            cout << "1. Add Book\n";
            cout << "2. Borrow Book\n";
            cout << "3. Return Book\n";
            cout << "4. Search Book\n";
            cout << "5. Show All Books\n";
            cout << "6. Show Transactions\n";
            cout << "0. Exit\n";
            cout << "Enter choice: ";
            cin >> choice;
            cin.ignore();

            switch (choice) {
                case 1: addBook(); break;
                case 2: borrowBook(); break;
                case 3: returnBook(); break;
                case 4: searchBook(); break;
                case 5: showAllBooks(); break;
                case 6: showTransactions(); break;
                case 0: cout << "Exiting system...\n"; break;
                default: cout << "Invalid choice.\n";
            }
        } while (choice != 0);
    }
};

// Main Function
int main() {
    LibrarySystem system;
    system.menu(); // Run the system menu
    return 0;
}

