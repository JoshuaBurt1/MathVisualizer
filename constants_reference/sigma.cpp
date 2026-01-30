#include <iostream>
#include <iomanip>
#include <ctime>

// Calculate: (1/16)*k
double manual_pow_inv16(int k) {
    double res = 1.0;
    for (int i = 0; i < k; ++i) {
        res *= (1.0 / 16.0);
    }
    return res;
}

// Calculate pi
double calculate_pi_bbp() {
    double piBBP = 0.0;
    for (int k = 0; k < 10; k++) {
        double term1 = 4.0 / (8.0 * k + 1.0);
        double term2 = 2.0 / (8.0 * k + 4.0);
        double term3 = 1.0 / (8.0 * k + 5.0);
        double term4 = 1.0 / (8.0 * k + 6.0);
        double term = term1 - term2 - term3 - term4;
        
        term = term * manual_pow_inv16(k);
        piBBP += term;
    }
    return piBBP;
}

// Calculate square root
double manual_sqrt(double n) {
    if (n <= 0) return 0;
    double x = n;
    double y = 1.0;
    for (int i = 0; i < 15; i++) {
        x = (x + y) / 2.0;
        y = n / x;
    }
    return x;
}

// Taylor Series for e^(-t^2)
double f(double t) {
    double res = 1.0;
    double term = 1.0;
    double t2 = t * t;
    for (int i = 1; i <= 100; ++i) {
        term *= -t2 / i;
        res += term;
        if (term < 1e-18 && term > -1e-18) break;
    }
    return res;
}

// Integration of error function
double integrate_erf(double limit, double pi_val) {
    int n = 20000; 
    double h = limit / n;
    double integral_sum = f(0) + f(limit);
    
    for (int i = 1; i < n; i++) {
        double t = i * h;
        integral_sum += (i % 2 == 0) ? 2 * f(t) : 4 * f(t);
    }
    
    return (integral_sum * h / 3.0) * (2.0 / manual_sqrt(pi_val));
}

int main() {
    std::clock_t start = std::clock();
    double pi = calculate_pi_bbp();
    double root2 = manual_sqrt(2.0);

    // Note: double only has about 15 to 17 significant decimal digits
    std::cout << std::fixed << std::setprecision(15);
    std::cout << "Calculated Pi: " << pi << "\n\n";
    std::cout << "Sigma Verification Table:\n";
    std::cout << "--------------------------------------------------------\n";
    for (int sigma = 1; sigma <= 3; sigma++) {
        double limit = static_cast<double>(sigma) / root2;
        double result = integrate_erf(limit, pi);

        std::cout << sigma << "-Sigma (Two-Tail):   " << result * 100.0 << " %" << std::endl;
        std::cout << sigma << "-Sigma (Single-Tail): " << (result / 2.0) * 100.0 << " %" << std::endl;
        std::cout << "--------------------------------------------------------\n";
    }

    std::clock_t end = std::clock();
    double elapsed = static_cast<double>(end - start) / CLOCKS_PER_SEC;
    
    std::cout << std::setprecision(6);
    std::cout << "Total computation time: " << elapsed << " seconds" << std::endl;

    return 0;
}