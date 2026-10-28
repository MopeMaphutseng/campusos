#include <iostream>
#include <vector>
using namespace std;

// Function to compute dot product of two vectors
double dotProduct(const vector<double>& a, const vector<double>& b) {
    double sum = 0.0;
    for (size_t i = 0; i < a.size(); i++) {
        sum += a[i] * b[i];  // Multiply-Accumulate (MAC) operation
    }
    return sum;
}

int main() {
    // Example: input voiceprint vs stored template
    vector<double> input   = {0.2, 0.5, 0.1, 0.7, 0.3};
    vector<double> stored  = {0.1, 0.6, 0.2, 0.8, 0.4};

    double similarity = dotProduct(input, stored);

    cout << "Similarity score = " << similarity << endl;

    // In real systems, compare score against a threshold
    if (similarity > 1.0)
        cout << "Voice accepted. Device unlocked!" << endl;
    else
        cout << "Voice rejected. Access denied." << endl;

    return 0;
}

