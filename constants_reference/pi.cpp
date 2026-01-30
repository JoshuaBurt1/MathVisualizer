#include <iostream>
#include <vector>
#include <cmath>
#include <chrono>
#include <iomanip>
#include <string>

using namespace std;
using namespace std::chrono;

class PiCalculations {
public:
    static void runCalculations() {
        // High precision constant for comparison
        const double standard = 3.1415926535897932384626;
        const long double standard_ld = 3.14159265358979323846264338327950288419716939937510L;

        cout << fixed << setprecision(50);

        // 1. Madhava-Leibniz series
        auto start1 = high_resolution_clock::now();
        double piCalc1 = 0;
        for (int i = 0; i <= 10000; i++) {
            piCalc1 += (2.0 / ((4.0 * i + 1.0) * (4.0 * i + 3.0)));
        }
        piCalc1 *= 4.0;
        auto end1 = high_resolution_clock::now();
        printResult("Madhava-Leibniz Sum", piCalc1, standard, duration_cast<nanoseconds>(end1 - start1).count());

        // 2. Nilakantha series
        auto start2 = high_resolution_clock::now();
        double piCalc2 = 3.0;
        double piCalc3 = 0.0;
        for (double i = 3; i <= 1476; i += 4) {
            piCalc2 += 4.0 / ((i * i * i) - i);
            piCalc3 -= 4.0 / (((i + 2) * (i + 2) * (i + 2)) - (i + 2));
        }
        double finalPi2 = piCalc2 + piCalc3;
        auto end2 = high_resolution_clock::now();
        printResult("Nilakantha series", finalPi2, standard, duration_cast<nanoseconds>(end2 - start2).count());

        // 3. Viete's Formula
        // Formula: 2/pi = sqrt(2)/2 * sqrt(2+sqrt(2))/2 * sqrt(2+sqrt(2+sqrt(2)))/2 ...
        auto startViete = high_resolution_clock::now();
        long double product = 1.0L;
        long double lastSqrt = 0.0L;
        for (int i = 0; i < 25; i++) {
            lastSqrt = sqrt(2.0L + lastSqrt);
            product *= (lastSqrt / 2.0L);
        }
        long double piViete = 2.0L / product;
        auto endViete = high_resolution_clock::now();
        printResult("Viete's Formula", piViete, standard_ld, duration_cast<nanoseconds>(endViete - startViete).count());

        // 4. Wallis product
        auto start3 = high_resolution_clock::now();
        double piCalc4 = 1.0;
        for (int i = 1; i <= 10000; i++) {
            piCalc4 *= ((4.0 * i * i) / ((4.0 * i * i) - 1.0));
        }
        double finalPi3 = 2.0 * piCalc4;
        auto end3 = high_resolution_clock::now();
        printResult("Wallis Product", finalPi3, standard, duration_cast<nanoseconds>(end3 - start3).count());

        // 5. Wallis product squares
        auto start4 = high_resolution_clock::now();
        double piCalc5 = 1.0;
        double piCalc6 = 1.0;
        for (double i = 2; i <= 20000; i += 2) {
            piCalc5 *= (((i + 1.0) * (i + 1.0) - 1.0) / ((i + 1.0) * (i + 1.0)));
            piCalc6 *= ((i * i) / (i * i - 1.0));
        }
        double finalPi4 = 2.0 * piCalc5 + piCalc6;
        auto end4 = high_resolution_clock::now();
        printResult("Wallis Product squares", finalPi4, standard, duration_cast<nanoseconds>(end4 - start4).count());

        // 6. Brouncker formula
        auto start5 = high_resolution_clock::now();
        double piCalc8 = 1.0;
        for (double i = 20001; i >= 1; i -= 2) {
            piCalc8 = (i * i) / (2.0 + piCalc8);
        }
        piCalc8 = 4.0 * (1.0 / (1.0 + piCalc8));
        auto end5 = high_resolution_clock::now();
        printResult("Brouncker formula", piCalc8, standard, duration_cast<nanoseconds>(end5 - start5).count());

        // 7. Bailey–Borwein–Plouffe (BBP)
        auto start6 = high_resolution_clock::now();
        double piBBP = 0.0;
        double sixteenPowK = 1.0; // Running power of 16

        for (int k = 0; k < 10; k++) {
            double term = (4.0 / (8 * k + 1) - 2.0 / (8 * k + 4) - 
                        1.0 / (8 * k + 5) - 1.0 / (8 * k + 6));
            piBBP += term / sixteenPowK;
            sixteenPowK *= 16.0; // Simple multiplication is much faster than pow()
        }
        auto end6 = high_resolution_clock::now();
        printResult("BBP Algorithm", piBBP, standard, duration_cast<nanoseconds>(end6 - start6).count());

        // 8. BBP (long double)
        auto start7 = high_resolution_clock::now();
        long double piLD = 0.0;
        for (int k = 0; k < 20; k++) {
            long double term = (4.0L / (8 * k + 1) - 2.0L / (8 * k + 4) - 1.0L / (8 * k + 5) - 1.0L / (8 * k + 6));
            piLD += term * pow(1.0L / 16.0L, k);
        }
        auto end7 = high_resolution_clock::now();
        printResult("BBP Long Double", piLD, standard_ld, duration_cast<nanoseconds>(end7 - start7).count());

        // 9. Gauss-Legendre
        auto startGL = high_resolution_clock::now();
        long double a = 1.0L;
        long double b = 1.0L / sqrt(2.0L);
        long double t = 0.25L;
        long double p = 1.0L;
        for (int i = 0; i < 3; i++) { 
            long double a_next = (a + b) / 2.0L;
            b = sqrt(a * b);
            t -= p * pow(a - a_next, 2);
            a = a_next;
            p = 2.0L * p;
        }
        long double piGL = pow(a + b, 2) / (4.0L * t);
        auto endGL = high_resolution_clock::now();
        printResult("Gauss-Legendre", piGL, standard_ld, duration_cast<nanoseconds>(endGL - startGL).count());

        // 10 & 11: Something to do with: Elliptic Curve, Vector Addition in Geometric space, Heegner Numbers (Class 1 corresponds to a square grid: 1*1-(4*41), 1*1-(4*17), 1*1-(4*11), 1*1-(4*5), 1*1-(4*3))
        // Heegner Number (Class 2: 58)
        // Formula: 1/pi = (sqrt(8)/9801) * sum( ((4k)!/(k!)^4) * ((1103+26390k)/(396^4k)) )
        // Parts: 
        // (sqrt(8)/9801)  ->  Scale/Normalizer: relates to how the modular curve "folds" onto itself.
        // ((4k)!/(k!)^4)  ->  The Grid: combinatorics of the grid
        // (1103 + 26390k) ->  The Curve: this linear equation ($A + Bk$) defines the specific angle at which we are slicing the geometry to find pi
        // 1/(396^4k)      ->  Exponential zoom: with every k, you are zooming in on the circumference of the circle by a factor of 396^4
        auto startRam = high_resolution_clock::now();
        long double ramSum = 0.0L;
        auto fact = [](int n) {
            long double res = 1.0L;
            for (int i = 2; i <= n; i++) res *= i;
            return res;
        };

        for (int k = 0; k < 2; k++) {
            long double num = fact(4 * k) * (1103.0L + 26390.0L * k);
            long double den = pow(fact(k), 4) * pow(396.0L, 4 * k);
            ramSum += num / den;
        }
        long double piRam = 1.0L / ((sqrt(8.0L) / 9801.0L) * ramSum);
        auto endRam = high_resolution_clock::now();
        printResult("Ramanujan Algorithm", piRam, standard_ld, duration_cast<nanoseconds>(endRam - startRam).count());

        // 11. Chudnovsky Algorithm
        // Heegner Number (Class 1: 163)
        // Formula: 1/pi = 12 * sum( (-1)^k * (6k)! * (13591409 + 545140134k) / ((3k)! * (k!)^3 * 640320^(3k+3/2)) )
        auto startChudMulti = high_resolution_clock::now();

        long double sum = 0.0L;
        for (int k = 0; k < 2; k++) {
            auto fact = [](int n) {
                long double res = 1.0L;
                for (int i = 2; i <= n; i++) res *= i;
                return res;
            };
            long double num = pow(-1.0L, k) * fact(6 * k) * (13591409.0L + 545140134.0L * k);
            long double den = fact(3 * k) * pow(fact(k), 3) * pow(640320.0L, 3.0L * k + 1.5L);
            sum += num / den;
        }
        long double piChudMulti = 1.0L / (12.0L * sum);
        auto endChudMulti = high_resolution_clock::now();
        printResult("Chudnovsky Algorithm", piChudMulti, standard_ld, duration_cast<nanoseconds>(endChudMulti - startChudMulti).count());
    }

private:
    static void printResult(string label, long double value, long double standard, long long time) {
        cout << label << endl;
        cout << fixed << setprecision(20) << "Pi:        " << value << endl;
        cout << scientific << setprecision(20) << "Deviation: " << (value - standard) << endl;
        cout << fixed << setprecision(0) << "Time taken: " << time << " ns\n" << endl;
    }
};

int main() {
    PiCalculations::runCalculations();
    return 0;
}