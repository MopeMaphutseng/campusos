#include <iostream>
#include <cmath>
using namespace std;

// ---------------- Feature Extraction ----------------

void extractFeatures(double input[], double features[], int N) {
    for (int i = 0; i < N; i++) {
        features[i] = input[i] * input[i];
    }
}

// ---------------- Reference Comparison ----------------

double compareFeatures(double features[], double reference[], int N) {
    double diff = 0;
    for (int i = 0; i < N; i++) {
        diff += fabs(features[i] - reference[i]); 
    }
    return diff;
}
// ---------------- Diagnostic Output ----------------
void giveDiagnosis(double score, double threshold) {
    if (score < threshold) {
        cout << "Possible TB detected, you seek medical testing(Tsa mo hlahlobela TB)" << endl;
    } else {
        cout << "Cough not consistent with TB(Ha u na TB)" << endl;
    }
}

int main() {
    const int N = 8;
    double coughSignal[N]   = {1, 0, 1, 0, 1, 1, 0, 0}; // input signal from the microphone
    double reference[N]     = {1, 0, 1, 0, 1, 0, 1, 0}; // stored TB-positive pattern
    double features[N];

    // Step 1: Extract features
    extractFeatures(coughSignal, features, N);

    cout << "Extracted features: ";
    for (int i = 0; i < N; i++) cout << features[i] << " ";
    cout << endl;

    // Step 2: Compare with reference
    double score = compareFeatures(features, reference, N);
    cout << "Similarity score: " << score << endl;

    // Step 3: Diagnosis
    double threshold = 2.0;
    giveDiagnosis(score, threshold);

    return 0;
}
