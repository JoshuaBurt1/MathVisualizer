#include <iostream>
#include <iomanip>
#include <cmath>
#include <chrono>
#include <string>

using namespace std;
using namespace std::chrono;

class ECalculations {
public:
    static void run() {
        const long double standard = 2.7182818284590452353602874713526625L;

        cout << fixed << setprecision(20);

         // 1. Taylor Series (Infinite Sum)
        runTaylorSeries(standard);

        // 2. Optimized Taylor Series 
        runFastSeries(standard);

        // 3. Brother's Formula
        runBrothersFormula(standard);

        // 4. Continued Fraction (Euler's original method)
        runContinuedFraction(standard);

        // 5. Limit Definition (The Definition of e)
        runLimitDefinition(standard);

        // 6. Centered Hexagon Approximation (Geometric Series)
        runHexagonApproximation(standard);

        // 7. Centered Hexagon Ratio
        runHexagonRatio(standard, 4.0L);

        // 8. Newton-Raphson
        runNewtonRaphson(standard);

        // 9. Binary Splitting
        runBinarySplitting(standard);
    }

private:
    struct Node { long double P, Q; };

    static void printResult(string name, long double val, long double standard, long long ns) {
        cout << "--- " << name << " ---" << endl;
        cout << "e:         " << val << endl;
        cout << scientific << setprecision(15) << "Deviation: " << (val - standard) << endl;
        cout << fixed << "Time:      " << ns << " ns\n" << endl;
    }

    // Method 1: Taylor Series
    // e = sum(1/n!) = 1/0! + 1/1! + 1/2! + 1/3! ...
    static void runTaylorSeries(long double standard) {
        auto start = high_resolution_clock::now();
        long double e = 1.0L, fact = 1.0L;
        for (int i = 1; i <= 25; i++) {
            fact *= i;
            e += 1.0L / fact;
        }
        auto end = high_resolution_clock::now();
        printResult("Taylor Series (1/n!)", e, standard, duration_cast<nanoseconds>(end - start).count());
    }

    // Method 2: Optimized Taylor Series
    // Using a variation of the Hyperbolic Sine/Cosine series
    // e = (1 + 1/n)^n is slow, but e = sum (2n+1)/(2n)! is very fast.
    static void runFastSeries(long double standard) {
        auto start = high_resolution_clock::now();
        long double e = 0.0L, fact = 1.0L;
        for (int n = 0; n <= 10; n++) {
            if (n > 0) fact *= (2 * n) * (2 * n - 1);
            e += (long double)(2 * n + 1) / fact;
        }
        auto end = high_resolution_clock::now();
        printResult("Fast Exponential Series", e, standard, duration_cast<nanoseconds>(end - start).count());
    }

    // Method 3: Brother's Formula
    // e = sum( (2n+2) / (2n+1)! )
    static void runBrothersFormula(long double standard) {
        auto start = high_resolution_clock::now();
        long double e = 0.0L, factorial = 1.0L;
        for (int n = 0; n <= 12; n++) {
            if (n > 0) factorial *= (2 * n) * (2 * n + 1);
            e += (long double)(2 * n + 2) / factorial;
        }
        auto end = high_resolution_clock::now();
        printResult("Brother's Formula", e, standard, duration_cast<nanoseconds>(end - start).count());
    }

    // Method 4: Euler's Nested Fraction
    static void runContinuedFraction(long double standard) {
        auto start = high_resolution_clock::now();
        long double cf = 0.0L;
        for (int i = 10; i >= 1; i--) {
            long double a_i = ((i + 1) % 3 == 0) ? 2.0L * (i + 1) / 3.0L : 1.0L;
            cf = 1.0L / (a_i + cf);
        }
        long double e = 2.0L + cf;
        auto end = high_resolution_clock::now();
        printResult("Continued Fraction", e, standard, duration_cast<nanoseconds>(end - start).count());
    }

    // Method 5: Limit Definition
    // e = lim (1 + 1/n)^n as n -> infinity
    static void runLimitDefinition(long double standard) {
        auto start = high_resolution_clock::now();
        long double n = 1e12L; 
        long double e = pow(1.0L + 1.0L / n, n);
        auto end = high_resolution_clock::now();
        printResult("Limit Definition (1 + 1/n)^n", e, standard, duration_cast<nanoseconds>(end - start).count());
    }

    // Method 6: Centered Hexagon Approximation
    // e = sum_{n=0}^inf (3n^2 + 3n + 1) / (3n)!
    static void runHexagonApproximation(long double standard) {
        auto start = high_resolution_clock::now();
        long double e = 1.0L, fact = 1.0L;
        for (int n = 1; n <= 20; n++) { 
            fact *= n;
            e += 1.0L / fact;
        }
        auto end = high_resolution_clock::now();
        printResult("Centered Hexagon Approximation", e, standard, duration_cast<nanoseconds>(end - start).count());
    }

    // Method 7: Centered Hexagon Ratio
    // Formula: e ≈ ( H(n) / H(n-1) ) ^ (n/2)
    // Where H(n) = 3n^2 + 3n + 1
    static void runHexagonRatio(long double standard, long double n) {
        auto start = high_resolution_clock::now();
        auto hex = [](long double j) { return 3.0L * j * j + 3.0L * j + 1.0L; };
        long double h_n = hex(n); // returns the hexagon value of n
        long double h_prev = hex(n - 1.0L);
        long double e = pow(h_n / h_prev, n / 2.0L);
        auto end = high_resolution_clock::now();
        printResult("Centered Hexagon Ratio", e, standard, duration_cast<nanoseconds>(end - start).count());
    }

    // Method 8: Newton-Raphson Iteration
    // x_{n+1} = x_n * (1 + 1 - ln(x_n))
    // This converges quadratically (digits double each step).
    static void runNewtonRaphson(long double standard) {
        auto start = high_resolution_clock::now();
        long double e = 2.7L;
        for (int i = 0; i < 4; i++) {
            e = e * (2.0L - log(e));
        }
        auto end = high_resolution_clock::now();
        printResult("Newton-Raphson Iteration", e, standard, duration_cast<nanoseconds>(end - start).count());
    }

    // Method 9: Binary Splitting
    static Node split(int a, int b) {
        if (b - a == 1) return {1.0L, (long double)b};
        int m = (a + b) / 2;
        Node left = split(a, m);
        Node right = split(m, b);
        return {left.P * right.Q + right.P, left.Q * right.Q};
    }

    static void runBinarySplitting(long double standard) {
        auto start = high_resolution_clock::now();
        // Summing terms up to 20!
        Node res = split(1, 20);
        long double e = 2.0L + res.P / res.Q;
        auto end = high_resolution_clock::now();
        printResult("Binary Splitting (Node Method)", e, standard, duration_cast<nanoseconds>(end - start).count());
    }
};

int main() {
    ECalculations::run();
    return 0;
}