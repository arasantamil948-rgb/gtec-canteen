class ApiConfig {
  static const String baseUrl = 'https://gtec-canteen-rnlu.onrender.com/api/v1';
  static const String socketUrl = 'https://gtec-canteen-rnlu.onrender.com';

  // Auth
  static const String login   = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String logout  = '/auth/logout';
  static const String me      = '/auth/me';
  static const String fcmToken = '/auth/fcm-token';
  static const String profile = '/auth/me';

  // Canteen
  static const String canteenStatus = '/canteen/status';

  // Menu
  static const String menu           = '/menu';
  static const String menuCategories = '/menu/categories';

  // Favourites / Orders / Reviews / Notifications
  static const String favourites    = '/favourites';
  static const String orders        = '/orders';
  static const String reviews       = '/reviews';
  static const String notifications = '/notifications';

  // Pre-Order
  static const String preOrder            = '/pre-order';
  static const String preOrderAvailable   = '/pre-order/available';
  static const String preOrderSlotStatus  = '/pre-order/slot-status';
  static const String preOrderMyTokens    = '/pre-order/my-tokens';
  static String preOrderCancel(String id)  => '/pre-order/cancel/$id';
  static String tokenReceipt(String id)    => '/pre-order/$id/token-receipt';
}
