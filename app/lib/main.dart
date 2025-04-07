// lib/main.dart (Updated)
import 'package:flutter/material.dart';
import 'package:app/screens/auth/login_screen.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/auth_provider.dart';
import 'package:app/screens/auth/register_screen.dart';
import 'package:app/screens/splash_screen.dart';
import 'package:app/screens/customer/customer_dashboard.dart';
import 'package:app/screens/expert/expert_dashboard.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp(
            title: 'Service Booking',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
              useMaterial3: true,
            ),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/customer_dashboard': (context) =>
                  const CustomerDashboardScreen(),
              '/expert_dashboard': (context) => const ExpertDashboardScreen(),
            },
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
