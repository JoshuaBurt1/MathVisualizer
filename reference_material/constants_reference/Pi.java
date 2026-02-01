package com.example.mathematicalconstants;

public class Pi {
    public static void main(String[] args) {
        // Standard double precision (64-bit limit)
        // Note: double only holds ~15-17 digits, so the digits after 46 are lost here.
        double standard = 3.14159265358979323846;

        runMadhava(standard);
        runNilakantha(standard);
        runWallis(standard);
        runWallisSquares(standard);
        runBrouncker(standard);
        runBBP(standard);
        runGaussLegendre(standard);
        runChudnovsky(standard);
    }

    private static void runMadhava(double standard) {
        long start = System.nanoTime();
        double pi = 0;
        for (int i = 0; i <= 10000; i++) {
            pi += (2.0 / ((4.0 * i + 1.0) * (4.0 * i + 3.0)));
        }
        pi *= 4.0;
        printResult("Madhava-Leibniz Sum", pi, standard, System.nanoTime() - start);
    }

    private static void runNilakantha(double standard) {
        long start = System.nanoTime();
        double pi = 3.0;
        int sign = 1;
        for (int i = 2; i <= 1476; i += 2) {
            pi += sign * (4.0 / ( (double)i * (i + 1) * (i + 2) ));
            sign *= -1;
        }
        printResult("Nilakantha Series", pi, standard, System.nanoTime() - start);
    }

    private static void runWallis(double standard) {
        long start = System.nanoTime();
        double pi = 1.0;
        for (int i = 1; i <= 10000; i++) {
            pi *= ((4.0 * i * i) / ((4.0 * i * i) - 1.0));
        }
        pi *= 2.0;
        printResult("Wallis Product", pi, standard, System.nanoTime() - start);
    }

    private static void runWallisSquares(double standard) {
        long start = System.nanoTime();
        double piCalc5 = 1.0;
        double piCalc6 = 1.0;
        for (int i = 2; i <= 20000; i += 2) {
            double iPlus1Sq = Math.pow(i + 1.0, 2);
            piCalc5 *= (iPlus1Sq - 1.0) / iPlus1Sq;
            piCalc6 *= (i * i) / (i * i - 1.0);
        }
        double pi = 2.0 * piCalc5 + piCalc6;
        printResult("Wallis Product Squares", pi, standard, System.nanoTime() - start);
    }

    private static void runBrouncker(double standard) {
        long start = System.nanoTime();
        double pi = 1.0;
        for (int i = 20001; i >= 1; i -= 2) {
            pi = (i * i) / (2.0 + pi);
        }
        pi = 4.0 * (1.0 / (1.0 + pi));
        printResult("Brouncker Formula", pi, standard, System.nanoTime() - start);
    }

    private static void runBBP(double standard) {
        long start = System.nanoTime();
        double pi = 0.0;
        for (int k = 0; k < 10; k++) {
            double term = (4.0 / (8 * k + 1) - 2.0 / (8 * k + 4) - 1.0 / (8 * k + 5) - 1.0 / (8 * k + 6));
            pi += term * Math.pow(1.0 / 16.0, k);
        }
        printResult("BBP Algorithm", pi, standard, System.nanoTime() - start);
    }

    private static void runGaussLegendre(double standard) {
        long start = System.nanoTime();
        double a = 1.0;
        double b = 1.0 / Math.sqrt(2.0);
        double t = 0.25;
        double p = 1.0;

        for (int i = 0; i < 4; i++) {
            double aNext = (a + b) / 2.0;
            b = Math.sqrt(a * b);
            t -= p * Math.pow(a - aNext, 2);
            a = aNext;
            p = 2.0 * p;
        }
        double pi = Math.pow(a + b, 2) / (4.0 * t);
        printResult("Gauss-Legendre Iterative", pi, standard, System.nanoTime() - start);
    }

    private static void runChudnovsky(double standard) {
        long start = System.nanoTime();
        double num = 12.0 * 13591409.0;
        double den = Math.pow(640320.0, 1.5);
        double pi = den / num;
        printResult("Chudnovsky (1-term)", pi, standard, System.nanoTime() - start);
    }

    private static void printResult(String label, double value, double standard, long time) {
        System.out.println(label);
        System.out.println("Pi:        " + value);
        // Using printf for clean scientific notation (1 whole number before the dot)
        System.out.printf("Deviation: %.5e\n", (value - standard));
        System.out.println("Time:      " + time + " ns\n");
    }
}