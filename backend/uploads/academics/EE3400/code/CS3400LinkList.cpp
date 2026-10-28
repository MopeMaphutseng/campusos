// C++ program to implement singly linked list using encapsulated Node class
#include <iostream>
using namespace std;

// ========================
// Node class
// ========================
class Node {
private:
    int data;        // Made private for encapsulation
    Node* next;      // Made private for encapsulation

public:
    // Default constructor
    Node() : data(0), next(NULL) {}

    // Parameterized constructor
    Node(int value) : data(value), next(NULL) {}

    // Getter for data
    int getData() const {
        return data;
    }

    // Setter for data
    void setData(int value) {
        data = value;
    }

    // Getter for next pointer
    Node* getNext() const {
        return next;
    }

    // Setter for next pointer
    void setNext(Node* node) {
        next = node;
    }
};

// ========================
// LinkedList class
// ========================
class LinkedList {
private:
    Node* head;   // Still private, only LinkedList manages it

public:
    // Default constructor
    LinkedList() : head(NULL) {}
    
    // Destructor to free memory
    ~LinkedList() {
        Node* current = head;
        while (current != NULL) {
            Node* temp = current;
            current = current->getNext();
            delete temp;
        }
        cout << "LinkedList destroyed. All memory freed.\n";
    }

    // Function to insert at the start
    void insertAtHead(int value) {
        Node* newNode = new Node(value);
        newNode->setNext(head); // use setter instead of direct access
        head = newNode;
    }

    // Function to insert at the end
    void insertAtEnd(int value) {
        Node* newNode = new Node(value);
        if (head == NULL) {
            head = newNode;
            return;
        }
        Node* last = head;
        while (last->getNext() != NULL) {
            last = last->getNext();
        }
        last->setNext(newNode); // use setter
    }

    // Function to delete a node by value
    void deleteNode(int value) {
        if (head == NULL) {
            cout << "List is empty.\n";
            return;
        }

        // Case 1: Delete head node
        if (head->getData() == value) {
            Node* temp = head;
            head = head->getNext(); // move head
            delete temp;
            cout << "Node with value " << value << " deleted from head.\n";
            return;
        }

        // Case 2: Delete middle or last node
        Node* prev = NULL;
        Node* curr = head;
        while (curr != NULL && curr->getData() != value) {
            prev = curr;
            curr = curr->getNext();
        }

        if (curr == NULL) {
            cout << "Value " << value << " not found in list.\n";
            return;
        }

        prev->setNext(curr->getNext());
        delete curr;
        cout << "Node with value " << value << " deleted.\n";
    }

    // Function to search for a node
    bool search(int value) {
        Node* current = head;
        while (current != NULL) {
            if (current->getData() == value) {
                return true;
            }
            current = current->getNext();
        }
        return false;
    }

    // Function to print the list
    void print() {
        if (head == NULL) {
            cout << "List empty\n";
            return;
        }

        Node* temp = head;
        while (temp != NULL) {
            cout << temp->getData() << " "; // use getter
            temp = temp->getNext();
        }
        cout << endl;
    }
};

// ========================
// Main function with menu
// ========================
int main() {
    LinkedList list;
    int choice, value;

    do {
        cout << "\n=== MENU ===\n";
        cout << "1. Insert element at head\n";
        cout << "2. Insert element at tail\n";
        cout << "3. Delete element\n";
        cout << "4. Search for element\n";
        cout << "5. Display all elements\n";
        cout << "6. Exit\n";
        cout << "Enter choice: ";
        cin >> choice;

        switch (choice) {
            case 1:
                cout << "Enter value to insert at head: ";
                cin >> value;
                list.insertAtHead(value);
                break;

            case 2:
                cout << "Enter value to insert at tail: ";
                cin >> value;
                list.insertAtEnd(value);
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
                    cout << value << " found in the list.\n";
                else
                    cout << value << " not found in the list.\n";
                break;

            case 5:
                list.print();
                break;

            case 6:
                cout << "Exiting program...\n";
                break;

            default:
                cout << "Invalid choice! Try again.\n";
        }
    } while (choice != 6);
    cout << "Creating list...\n";
    {
        LinkedList list; // List created

        list.insertAtHead(10);
        list.insertAtHead(20);
        list.insertAtEnd(30);

        cout << "Current list: ";
        list.print();

        cout << "Exiting inner scope...\n";
    } // List goes out of scope ? destructor is called automatically

    cout << "Back in main, list is destroyed.\n";

    return 0;
}

