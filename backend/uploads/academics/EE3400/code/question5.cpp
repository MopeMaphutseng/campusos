#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <ctime>

using namespace std;

struct Transaction {
    int transactionID;
    double amount;
    string date; // Format: YYYY-MM-DD
    string type; // "Deposit" or "Withdrawal"
    Transaction* prev;
    Transaction* next;
};

// Basic date format check (YYYY-MM-DD)
bool isValidDate(const string& date) {
    if (date.length() != 10) return false;
    return date[4] == '-' && date[7] == '-';
}

// Ensure amount is positive
bool isValidAmount(double amount) {
    return amount > 0;
}

// Convert string to int safely
int toInt(const string& s) {
    stringstream ss(s);
    int val;
    ss >> val;
    return val;
}

// Convert string to double safely
double toDouble(const string& s) {
    stringstream ss(s);
    double val;
    ss >> val;
    return val;
}

// Calculate balance
double calculateBalance(Transaction* head) {
    double balance = 0;
    while (head) {
        if (head->type == "Deposit") balance += head->amount;
        else if (head->type == "Withdrawal") balance -= head->amount;
        head = head->next;
    }
    return balance;
}

// Detect overdraft
bool detectOverdraft(Transaction* head) {
    double balance = 0;
    while (head) {
        if (head->type == "Deposit") balance += head->amount;
        else if (head->type == "Withdrawal") balance -= head->amount;
        if (balance < 0) return true;
        head = head->next;
    }
    return false;
}

// Find largest transaction
Transaction* findLargest(Transaction* head) {
    Transaction* largest = NULL;
    double maxAmount = 0;
    while (head) {
        if (head->amount > maxAmount) {
            maxAmount = head->amount;
            largest = head;
        }
        head = head->next;
    }
    return largest;
}

// Check if date is older than 1 year (approximate)
bool isOlderThanOneYear(const string& dateStr) {
    int year, month, day;
    sscanf(dateStr.c_str(), "%d-%d-%d", &year, &month, &day);

    time_t now = time(NULL);
    struct tm* now_tm = localtime(&now);

    if (year < now_tm->tm_year + 1900 - 1) return true;
    if (year == now_tm->tm_year + 1900 - 1 && month < now_tm->tm_mon + 1) return true;
    if (year == now_tm->tm_year + 1900 - 1 && month == now_tm->tm_mon + 1 && day < now_tm->tm_mday) return true;

    return false;
}

// Delete old transactions
void deleteOldTransactions(Transaction*& head) {
    Transaction* current = head;
    while (current) {
        if (isOlderThanOneYear(current->date)) {
            Transaction* toDelete = current;
            if (toDelete->prev) toDelete->prev->next = toDelete->next;
            if (toDelete->next) toDelete->next->prev = toDelete->prev;
            if (toDelete == head) head = toDelete->next;
            current = current->next;
            delete toDelete;
        } else {
            current = current->next;
        }
    }
}

// Print last 5 transactions
void printMiniStatement(Transaction* tail) {
    int count = 0;
    while (tail && count < 5) {
        cout << tail->transactionID << " | " << tail->type << " | "
             << tail->amount << " | " << tail->date << endl;
        tail = tail->prev;
        count++;
    }
}

// Save to file
void saveToFile(Transaction* head, const string& filename) {
    ofstream file(filename.c_str());
    while (head) {
        file << head->transactionID << "," << head->amount << ","
             << head->date << "," << head->type << endl;
        head = head->next;
    }
    file.close();
}

// Load from file
void loadFromFile(Transaction*& head, Transaction*& tail, const string& filename) {
    ifstream file(filename.c_str());
    string line;
    while (getline(file, line)) {
        stringstream ss(line);
        string idStr, amountStr, date, type;
        getline(ss, idStr, ',');
        getline(ss, amountStr, ',');
        getline(ss, date, ',');
        getline(ss, type, ',');

        Transaction* newTx = new Transaction;
        newTx->transactionID = toInt(idStr);
        newTx->amount = toDouble(amountStr);
        newTx->date = date;
        newTx->type = type;
        newTx->prev = newTx->next = NULL;

        if (!head) {
            head = tail = newTx;
        } else {
            tail->next = newTx;
            newTx->prev = tail;
            tail = newTx;
        }
    }
    file.close();
}

// Main program
int main() {
    Transaction* head = NULL;
    Transaction* tail = NULL;

    loadFromFile(head, tail, "transactions.txt");

    int choice;
    do {
        cout << "\n--- Bank Transaction Menu ---\n";
        cout << "1. Add Transaction\n2. View Balance\n3. Detect Overdraft\n";
        cout << "4. Largest Transaction\n5. Delete Old Transactions\n";
        cout << "6. Mini Statement\n0. Exit\nChoice: ";
        cin >> choice;

        if (choice == 1) {
            int id;
            double amount;
            string date, type;
            cout << "Enter ID, Amount, Date (YYYY-MM-DD), Type (Deposit/Withdrawal): ";
            cin >> id >> amount >> date >> type;

            if (!isValidAmount(amount) || !isValidDate(date) ||
                (type != "Deposit" && type != "Withdrawal")) {
                cout << "Invalid input.\n";
                continue;
            }

            Transaction* newTx = new Transaction;
            newTx->transactionID = id;
            newTx->amount = amount;
            newTx->date = date;
            newTx->type = type;
            newTx->prev = newTx->next = NULL;

            if (!head) head = tail = newTx;
            else {
                tail->next = newTx;
                newTx->prev = tail;
                tail = newTx;
            }
        } else if (choice == 2) {
            cout << "Balance: " << calculateBalance(head) << endl;
        } else if (choice == 3) {
            cout << (detectOverdraft(head) ? "Overdraft detected!\n" : "No overdraft.\n");
        } else if (choice == 4) {
            Transaction* largest = findLargest(head);
            if (largest)
                cout << "Largest: " << largest->transactionID << " | " << largest->amount << endl;
        } else if (choice == 5) {
            deleteOldTransactions(head);
            cout << "Old transactions deleted.\n";
        } else if (choice == 6) {
            printMiniStatement(tail);
        }
    } while (choice != 0);

    saveToFile(head, "transactions.txt");
    cout << "Transactions saved. Goodbye!\n";
    return 0;
}

