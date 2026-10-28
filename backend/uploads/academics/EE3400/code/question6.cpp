#include <iostream>
#include <stdexcept> // for exceptions
using namespace std;

/*
====================================================================================
    Linked List Trade-offs

    1. Singly Linked List:
        - Each node stores data + pointer to the next node.
        - Advantages:
            * Simple, uses less memory per node (only 1 pointer).
            * Efficient when insertion/deletion occurs mostly at the front.
        - Disadvantages:
            * No backward traversal.
            * Deleting a node at the end or searching backwards is slow.
        - Example: Undo/Redo stacks, simple queues.

    2. Doubly Linked List:
        - Each node stores data + pointer to next + pointer to previous.
        - Advantages:
            * Supports both forward and backward traversal.
            * Insertion/deletion is easier in the middle.
        - Disadvantages:
            * Extra memory for the "previous" pointer.
        - Example: Bank Transactions (our case):
            * You can move forward/backward through history of transactions.

    3. Circular Linked List:
        - Last node points back to the first node (can be singly or doubly circular).
        - Advantages:
            * Useful for continuous looping through elements.
            * Efficient for round-robin scheduling.
        - Disadvantages:
            * Slightly more complex implementation.
        - Example: Task scheduling in operating systems, music playlists.

    Summary:
        - Use Singly LinkedList when memory is tight and only forward traversal is needed.
        - Use Doubly LinkedList when you need both directions (ideal for transaction history).
        - Use Circular LinkedList when looping endlessly (like OS scheduling).
====================================================================================
*/

// ======================= Templated Node =======================
template <typename T>
class Node {
private:
    T data;
    Node<T>* next;
    Node<T>* prev;

public:
    Node(T value) : data(value), next(NULL), prev(NULL) {}

    // Getters
    T getData() const { return data; }
    Node<T>* getNext() const { return next; }
    Node<T>* getPrev() const { return prev; }

    // Setters
    void setData(T value) { data = value; }
    void setNext(Node<T>* nxt) { next = nxt; }
    void setPrev(Node<T>* prv) { prev = prv; }
};

// ======================= Templated Linked List =======================
template <typename T>
class DoublyLinkedList {
private:
    Node<T>* head;
    Node<T>* tail;

public:
    // Constructor
    DoublyLinkedList() : head(NULL), tail(NULL) {}

    // Destructor (frees memory)
    ~DoublyLinkedList() {
        while (head != NULL) {
            Node<T>* temp = head;
            head = head->getNext();
            delete temp;
        }
    }

    // Insert at end
    void insert(T value) {
        Node<T>* newNode = new Node<T>(value);

        if (!head) {
            head = tail = newNode;
        } else {
            tail->setNext(newNode);
            newNode->setPrev(tail);
            tail = newNode;
        }
    }

    // Delete from end
    void deleteLast() {
        if (!head) {
            throw runtime_error("Error: Cannot delete from an empty list!");
        }

        if (head == tail) {
            delete head;
            head = tail = NULL;
        } else {
            Node<T>* temp = tail;
            tail = tail->getPrev();
            tail->setNext(NULL);
            delete temp;
        }
    }

    // Display list
    void display() const {
        if (!head) {
            cout << "List is empty!" << endl;
            return;
        }

        Node<T>* current = head;
        while (current) {
            cout << current->getData() << " <-> ";
            current = current->getNext();
        }
        cout << "NULL" << endl;
    }
};

// ======================= Main Function =======================
int main() {
    try {
        DoublyLinkedList<int> list;

        cout << "Inserting values..." << endl;
        list.insert(10);
        list.insert(20);
        list.insert(30);
        list.display();

        cout << "Deleting last value..." << endl;
        list.deleteLast();
        list.display();

        cout << "Deleting all values..." << endl;
        list.deleteLast();
        list.deleteLast();

        // Trigger exception
        cout << "Attempting invalid delete..." << endl;
        list.deleteLast();

    } catch (const exception& e) {
        cerr << e.what() << endl;
    }

    return 0;
}

