#include <iostream>
#include <cmath>
#include <limits>
using namespace std;

// ----------------- Constants -----------------
const double EARTH_RADIUS_KM = 6371.0; // Earth's radius for Haversine formula

// ----------------- Node Class -----------------
// Each Node represents a waypoint (latitude, longitude, timestamp)
class Node {
private:
    double latitude;
    double longitude;
    long timestamp;   // we’ll use a simple number to represent order/time
    Node* next;

public:
    // Constructor
    Node(double lat, double lon, long time) 
        : latitude(lat), longitude(lon), timestamp(time), next(NULL) {}

    // Getters
    double getLatitude() const { return latitude; }
    double getLongitude() const { return longitude; }
    long getTimestamp() const { return timestamp; }
    Node* getNext() const { return next; }

    // Setters
    void setLatitude(double lat) { latitude = lat; }
    void setLongitude(double lon) { longitude = lon; }
    void setTimestamp(long time) { timestamp = time; }
    void setNext(Node* n) { next = n; }
};

// ----------------- Helper Functions -----------------
// Convert degrees to radians
double toRadians(double degree) {
    return degree * M_PI / 180.0;
}

// Haversine formula to calculate distance between two coordinates
double haversine(double lat1, double lon1, double lat2, double lon2) {
    lat1 = toRadians(lat1);
    lon1 = toRadians(lon1);
    lat2 = toRadians(lat2);
    lon2 = toRadians(lon2);

    double dLat = lat2 - lat1;
    double dLon = lon2 - lon1;

    double a = pow(sin(dLat / 2), 2) +
               cos(lat1) * cos(lat2) * pow(sin(dLon / 2), 2);
    double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
}

// ----------------- GPSRoute (Linked List) -----------------
class GPSRoute {
private:
    Node* head;  // start of the linked list

public:
    // Constructor
    GPSRoute() : head(NULL) {}

    // Destructor to free memory
    ~GPSRoute() {
        Node* current = head;
        while (current) {
            Node* temp = current;
            current = current->getNext();
            delete temp;
        }
    }

    // (i) Insert waypoint (sorted by timestamp)
    void insertWaypoint(double lat, double lon, long timestamp) {
        Node* newNode = new Node(lat, lon, timestamp);

        // If list is empty OR new node is earliest
        if (!head || timestamp < head->getTimestamp()) {
            newNode->setNext(head);
            head = newNode;
            return;
        }

        // Traverse until correct position found
        Node* current = head;
        while (current->getNext() && current->getNext()->getTimestamp() < timestamp) {
            current = current->getNext();
        }

        newNode->setNext(current->getNext());
        current->setNext(newNode);
    }

    // (ii) Calculate total distance traveled
    double totalDistance() {
        if (!head || !head->getNext()) return 0.0;

        double total = 0.0;
        Node* current = head;
        while (current->getNext()) {
            total += haversine(
                current->getLatitude(), current->getLongitude(),
                current->getNext()->getLatitude(), current->getNext()->getLongitude()
            );
            current = current->getNext();
        }
        return total;
    }

    // (iii) Find nearest point to given location
    Node* findNearest(double lat, double lon) {
        if (!head) return NULL;

        Node* nearest = head;
        double minDist = numeric_limits<double>::max();

        Node* current = head;
        while (current) {
            double dist = haversine(lat, lon, current->getLatitude(), current->getLongitude());
            if (dist < minDist) {
                minDist = dist;
                nearest = current;
            }
            current = current->getNext();
        }
        return nearest;
    }

    // (iv) Delete duplicate consecutive waypoints
    void deleteDuplicates() {
        if (!head) return;

        Node* current = head;
        while (current->getNext()) {
            if (current->getLatitude() == current->getNext()->getLatitude() &&
                current->getLongitude() == current->getNext()->getLongitude()) {
                Node* duplicate = current->getNext();
                current->setNext(duplicate->getNext());
                delete duplicate; // free memory
            } else {
                current = current->getNext();
            }
        }
    }

    // (v) Reverse the route
    void reverse() {
        Node* prev = NULL;
        Node* current = head;
        Node* next = NULL;

        while (current) {
            next = current->getNext();
            current->setNext(prev);
            prev = current;
            current = next;
        }
        head = prev;
    }

    // Display the route
    void display() {
        Node* current = head;
        while (current) {
            cout << "(" << current->getLatitude() << ", "
                 << current->getLongitude() << ") "
                 << "Timestamp: " << current->getTimestamp() << endl;
            current = current->getNext();
        }
    }
};

// ----------------- Main Program -----------------
int main() {
    GPSRoute route;

    // Insert waypoints (out of order, list will keep them sorted by timestamp)
    route.insertWaypoint(-29.31, 27.48, 3);
    route.insertWaypoint(-29.32, 27.50, 1);
    route.insertWaypoint(-29.31, 27.48, 2); // duplicate coordinates
    route.insertWaypoint(-29.33, 27.52, 4);

    cout << "Original Route:" << endl;
    route.display();

    // Calculate total distance
    cout << "\nTotal Distance: " << route.totalDistance() << " km" << endl;

    // Find nearest point
    Node* nearest = route.findNearest(-29.31, 27.49);
    if (nearest) {
        cout << "\nNearest to (-29.31, 27.49): (" 
             << nearest->getLatitude() << ", "
             << nearest->getLongitude() << ")" << endl;
    }

    // Remove duplicates
    cout << "\nDeleting Duplicates..." << endl;
    route.deleteDuplicates();
    route.display();

    // Reverse route
    cout << "\nReversing Route..." << endl;
    route.reverse();
    route.display();

    return 0;
}

