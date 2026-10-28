#include <iostream>
using namespace std;

// ----------------- Node Class -----------------
class Node {
private:
    int data;
    Node* next;
    Node* prev;

public:
    // Constructor
    Node(int value) {
        data = value;
        next = nullptr;// nullptr: Same as NULL from class
        prev = nullptr;
    }

    // Implement encapsulation: Getters and setters
    //You can observe their usage from the code below
  
};

// ----------------- Circular Doubly Linked List -----------------
class CircularDoublyLinkedList {
private:
    Node* head;
    Node* tail;

public:
    // Constructor
    CircularDoublyLinkedList() {
        head = nullptr;
        tail = nullptr;
    }

    // Destructor to free memory
    ~CircularDoublyLinkedList() {
        if (!head) return;

        Node* current = head;
        do {
            Node* nextNode = current->getNext();
            delete current;
            current = nextNode;
        } while (current != head);

        head = nullptr;
        tail = nullptr;
    }

    // Insert at head
    void insertAtHead(int value) {
        Node* newNode = new Node(value);

        if (!head) {
            head = newNode;
            tail = newNode;
            head->setNext(head);
            head->setPrev(head);
        } else {
            newNode->setNext(head);
            newNode->setPrev(tail);
            tail->setNext(newNode);
            head->setPrev(newNode);
            head = newNode;
        }
    }

    // Insert at tail
    void insertAtTail(int value) {
        Node* newNode = new Node(value);

        if (!head) {
            head = newNode;
            tail = newNode;
            head->setNext(head);
            head->setPrev(head);
        } else {
            newNode->setPrev(tail);
            newNode->setNext(head);
            tail->setNext(newNode);
            head->setPrev(newNode);
            tail = newNode;
        }
    }

    // Delete a node by value
    void deleteNode(int value) {
        if (!head) {
            cout << "List is empty!" << endl;
            return;
        }

        Node* current = head;
        do {
            if (current->getData() == value) {
                if (current == head && current == tail) {
                    // Single node
                    delete current;
                    head = nullptr;
                    tail = nullptr;
                } else if (current == head) {
                    head = head->getNext();
                    head->setPrev(tail);
                    tail->setNext(head);
                    delete current;
                } else if (current == tail) {
                    tail = tail->getPrev();
                    tail->setNext(head);
                    head->setPrev(tail);
                    delete current;
                } else {
                    Node* prevNode = current->getPrev();
                    Node* nextNode = current->getNext();
                    prevNode->setNext(nextNode);
                    nextNode->setPrev(prevNode);
                    delete current;
                }
                return;
            }
            current = current->getNext();
        } while (current != head);

        cout << "Value not found!" << endl;
    }

    // Search for a value
    bool search(int value) {
        if (!head) return false;

        Node* current = head;
        do {
            if (current->getData() == value) return true;
            current = current->getNext();
        } while (current != head);

        return false;
    }

    // Display list
    void display() {
        if (!head) {
            cout << "List is empty!" << endl;
            return;
        }

        Node* current = head;
        do {
            cout << current->getData() << " ";
            current = current->getNext();
        } while (current != head);
        cout << endl;
    }
};

// ----------------- Main Function with Menu -----------------
int main() {
    CircularDoublyLinkedList list;
    int choice, value;

    do {
        cout << "\n--- Circular Doubly Linked List Menu ---\n";
        cout << "1. Insert at Head\n";
        cout << "2. Insert at Tail\n";
        cout << "3. Delete a Node\n";
        cout << "4. Search for a Value\n";
        cout << "5. Display List\n";
        cout << "0. Exit\n";
        cout << "Enter choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                cout << "Enter value: ";
                cin >> value;
                list.insertAtHead(value);
                break;
            case 2:
                cout << "Enter value: ";
                cin >> value;
                list.insertAtTail(value);
                break;
            case 3:
                cout << "Enter value to delete: ";
                cin >> value;
                list.deleteNode(value);
                break;
            case 4:
                cout << "Enter value to search: ";
                cin >> value;
                if (list.search(value))
                    cout << "Found " << value << endl;
                else
                    cout << value << " not found!" << endl;
                break;
            case 5:
                cout << "List: ";
                list.display();
                break;
            case 0:
                cout << "Exiting..." << endl;
                break;
            default:
                cout << "Invalid choice!" << endl;
        }
    } while (choice != 0);

    return 0;
}

