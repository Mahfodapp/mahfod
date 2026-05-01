module.exports = {
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'mock-notification-id'),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
};
