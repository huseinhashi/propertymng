// lib/main.dart (Updated)
import 'package:flutter/material.dart';
import 'package:app/screens/auth/login_screen.dart';
import 'package:provider/provider.dart';
import 'package:app/providers/auth_provider.dart';
import 'package:app/screens/auth/register_screen.dart';
import 'package:app/screens/splash_screen.dart';
import 'package:app/screens/customer/customer_dashboard.dart';
import 'package:app/screens/expert/expert_dashboard.dart';
import 'package:app/screens/customer/repair_request_screen.dart';
import 'package:app/services/api_client.dart';
import 'package:app/services/repair_service.dart';
import 'package:flutter/foundation.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize services
  await _initializeServices();

  runApp(const MyApp());
}

Future<void> _initializeServices() async {
  try {
    // Initialize API client and services
    final apiClient = ApiClient();
    await apiClient.initialize();

    final repairService = RepairService();
    await repairService.initialize();

    if (kDebugMode) {
      print('🚀 Services initialized successfully');
    }
  } catch (e) {
    if (kDebugMode) {
      print('❌ Error initializing services: $e');
    }
  }
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
              '/repair_request': (context) => const RepairRequestScreen(),
            },
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
