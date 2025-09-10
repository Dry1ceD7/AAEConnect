/**
 * AAE Corporate Theme Configuration
 * 
 * Implements Advanced ID Asia Engineering Co.,Ltd brand identity
 * with cyan-light blue modern theme for enterprise communication
 */

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// AAE Corporate Color Palette
class AAEColors {
  // Primary Brand Colors (Cyan-Light Blue Theme)
  static const Color primary = Color(0xFF00BCD4);        // Cyan - Main brand color
  static const Color primaryVariant = Color(0xFF0097A7);  // Dark Cyan - Accent
  static const Color secondary = Color(0xFF00E5FF);       // Light Cyan - Highlights
  
  // Professional Grays for Enterprise UI
  static const Color gray = Color(0xFF757575);
  static const Color lightGray = Color(0xFFBDBDBD);
  static const Color darkGray = Color(0xFF424242);
  
  // Background Colors
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F5F5);
  
  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  
  // Status Colors
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFF57C00);
  static const Color error = Color(0xFFF44336);
  static const Color info = Color(0xFF2196F3);
  
  // AAE Department Colors
  static const Color engineering = Color(0xFF00BCD4);     // Primary cyan
  static const Color manufacturing = Color(0xFF0097A7);   // Dark cyan
  static const Color qualityControl = Color(0xFF00E5FF);  // Light cyan
  static const Color management = Color(0xFF26C6DA);      // Medium cyan
  static const Color itSupport = Color(0xFF00ACC1);       // Deep cyan
}

/// AAE Corporate Typography
class AAETextStyles {
  static const String primaryFont = 'Inter';
  static const String thaiFont = 'NotoSansThai';
  
  // Display Text Styles
  static const TextStyle displayLarge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 32,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.25,
    color: AAEColors.textPrimary,
  );
  
  static const TextStyle displayMedium = TextStyle(
    fontFamily: primaryFont,
    fontSize: 28,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    color: AAEColors.textPrimary,
  );
  
  // Headline Text Styles
  static const TextStyle headlineLarge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    letterSpacing: 0,
    color: AAEColors.textPrimary,
  );
  
  static const TextStyle headlineMedium = TextStyle(
    fontFamily: primaryFont,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.15,
    color: AAEColors.textPrimary,
  );
  
  // Title Text Styles
  static const TextStyle titleLarge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    letterSpacing: 0.15,
    color: AAEColors.textPrimary,
  );
  
  static const TextStyle titleMedium = TextStyle(
    fontFamily: primaryFont,
    fontSize: 16,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    color: AAEColors.textPrimary,
  );
  
  // Body Text Styles
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.5,
    color: AAEColors.textPrimary,
  );
  
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.25,
    color: AAEColors.textPrimary,
  );
  
  // Label Text Styles
  static const TextStyle labelLarge = TextStyle(
    fontFamily: primaryFont,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.1,
    color: AAEColors.textPrimary,
  );
  
  static const TextStyle labelMedium = TextStyle(
    fontFamily: primaryFont,
    fontSize: 12,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    color: AAEColors.textPrimary,
  );
  
  // Thai Language Text Styles
  static const TextStyle thaiBodyLarge = TextStyle(
    fontFamily: thaiFont,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.5,
    color: AAEColors.textPrimary,
    height: 1.6, // Better line height for Thai text
  );
  
  static const TextStyle thaiBodyMedium = TextStyle(
    fontFamily: thaiFont,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.25,
    color: AAEColors.textPrimary,
    height: 1.6,
  );
}

/// AAE Theme Configuration
class AAETheme {
  /// Light Theme for AAE Corporate Identity
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      
      // Color Scheme
      colorScheme: const ColorScheme.light(
        primary: AAEColors.primary,
        primaryContainer: AAEColors.primaryVariant,
        secondary: AAEColors.secondary,
        background: AAEColors.background,
        surface: AAEColors.surface,
        surfaceVariant: AAEColors.surfaceVariant,
        onPrimary: AAEColors.textOnPrimary,
        onSecondary: AAEColors.textPrimary,
        onBackground: AAEColors.textPrimary,
        onSurface: AAEColors.textPrimary,
        error: AAEColors.error,
        onError: Colors.white,
      ),
      
      // App Bar Theme
      appBarTheme: const AppBarTheme(
        backgroundColor: AAEColors.primary,
        foregroundColor: AAEColors.textOnPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: AAETextStyles.primaryFont,
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: AAEColors.textOnPrimary,
        ),
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
        ),
      ),
      
      // Card Theme
      cardTheme: CardTheme(
        color: AAEColors.surface,
        shadowColor: AAEColors.primary.withOpacity(0.1),
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      
      // Elevated Button Theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AAEColors.primary,
          foregroundColor: AAEColors.textOnPrimary,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: AAETextStyles.labelLarge.copyWith(
            color: AAEColors.textOnPrimary,
          ),
        ),
      ),
      
      // Text Button Theme
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AAEColors.primary,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: AAETextStyles.labelLarge.copyWith(
            color: AAEColors.primary,
          ),
        ),
      ),
      
      // Input Decoration Theme
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AAEColors.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AAEColors.lightGray),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AAEColors.lightGray),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AAEColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AAEColors.error),
        ),
        labelStyle: AAETextStyles.bodyMedium.copyWith(
          color: AAEColors.textSecondary,
        ),
        hintStyle: AAETextStyles.bodyMedium.copyWith(
          color: AAEColors.textSecondary,
        ),
      ),
      
      // Floating Action Button Theme
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AAEColors.secondary,
        foregroundColor: AAEColors.textPrimary,
        elevation: 4,
      ),
      
      // Bottom Navigation Bar Theme
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AAEColors.surface,
        selectedItemColor: AAEColors.primary,
        unselectedItemColor: AAEColors.textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      
      // Divider Theme
      dividerTheme: const DividerThemeData(
        color: AAEColors.lightGray,
        thickness: 1,
        space: 1,
      ),
      
      // Text Theme
      textTheme: const TextTheme(
        displayLarge: AAETextStyles.displayLarge,
        displayMedium: AAETextStyles.displayMedium,
        headlineLarge: AAETextStyles.headlineLarge,
        headlineMedium: AAETextStyles.headlineMedium,
        titleLarge: AAETextStyles.titleLarge,
        titleMedium: AAETextStyles.titleMedium,
        bodyLarge: AAETextStyles.bodyLarge,
        bodyMedium: AAETextStyles.bodyMedium,
        labelLarge: AAETextStyles.labelLarge,
        labelMedium: AAETextStyles.labelMedium,
      ),
    );
  }
  
  /// Dark Theme for AAE Corporate Identity
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      
      // Color Scheme for Dark Mode
      colorScheme: const ColorScheme.dark(
        primary: AAEColors.primary,
        primaryContainer: AAEColors.primaryVariant,
        secondary: AAEColors.secondary,
        background: Color(0xFF121212),
        surface: Color(0xFF1E1E1E),
        surfaceVariant: Color(0xFF2C2C2C),
        onPrimary: AAEColors.textOnPrimary,
        onSecondary: Colors.black,
        onBackground: Colors.white,
        onSurface: Colors.white,
        error: AAEColors.error,
        onError: Colors.white,
      ),
      
      // Inherit most styling from light theme
      appBarTheme: lightTheme.appBarTheme.copyWith(
        backgroundColor: const Color(0xFF1E1E1E),
      ),
      
      cardTheme: lightTheme.cardTheme.copyWith(
        color: const Color(0xFF2C2C2C),
      ),
      
      inputDecorationTheme: lightTheme.inputDecorationTheme.copyWith(
        fillColor: const Color(0xFF2C2C2C),
      ),
    );
  }
}

/// AAE-specific UI Components Extensions
extension AAEWidgetExtensions on Widget {
  /// Add AAE corporate shadow
  Widget withAAEShadow() {
    return Container(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(
            color: AAEColors.primary.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: this,
    );
  }
  
  /// Add AAE corporate border
  Widget withAAEBorder() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: AAEColors.primary.withOpacity(0.3),
          width: 1,
        ),
        borderRadius: BorderRadius.circular(8),
      ),
      child: this,
    );
  }
}

/// AAE Department Color Utilities
class AAEDepartmentColors {
  static Color getColor(String department) {
    switch (department.toLowerCase()) {
      case 'engineering':
        return AAEColors.engineering;
      case 'manufacturing':
        return AAEColors.manufacturing;
      case 'quality-control':
      case 'quality_control':
        return AAEColors.qualityControl;
      case 'management':
        return AAEColors.management;
      case 'it-support':
      case 'it_support':
        return AAEColors.itSupport;
      default:
        return AAEColors.primary;
    }
  }
  
  static IconData getIcon(String department) {
    switch (department.toLowerCase()) {
      case 'engineering':
        return Icons.engineering;
      case 'manufacturing':
        return Icons.factory;
      case 'quality-control':
      case 'quality_control':
        return Icons.verified;
      case 'management':
        return Icons.business;
      case 'it-support':
      case 'it_support':
        return Icons.computer;
      default:
        return Icons.group;
    }
  }
}
