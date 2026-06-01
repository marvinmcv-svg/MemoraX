import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Settings, Bell, Users, CreditCard, LogOut, ChevronRight, HelpCircle } from '@expo/vector-icons';

const menuItems = [
  { icon: Users, label: 'Account', description: 'Manage your account details', action: 'account' },
  { icon: Bell, label: 'Notifications', description: 'Configure reminder preferences', action: 'notifications' },
  { icon: CreditCard, label: 'Billing', description: 'View your plan and usage', action: 'billing' },
  { icon: Settings, label: 'Settings', description: 'App configuration', action: 'settings' },
  { icon: HelpCircle, label: 'Help & Support', description: 'Get help or send feedback', action: 'help' },
];

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const handleMenuPress = (action: string) => {
    const messages: Record<string, string> = {
      account: 'Account settings coming soon',
      notifications: 'Notification preferences coming soon',
      billing: 'Billing dashboard coming soon',
      settings: 'App settings coming soon',
      help: 'Help center coming soon',
    };
    Alert.alert(menuItems.find((m) => m.action === action)?.label || 'Action', messages[action] || 'Coming soon');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const userInitial = user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase() || 'U';
  const userName = user?.fullName || 'User';
  const userEmail = user?.emailAddresses[0]?.emailAddress || '';

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-6">
        <Text className="text-2xl font-bold text-text-primary">Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border items-center">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
            <Text className="text-primary text-3xl font-bold">{userInitial}</Text>
          </View>
          <Text className="text-xl font-bold text-text-primary">{userName}</Text>
          {userEmail && <Text className="text-text-secondary mt-1">{userEmail}</Text>}
          <View className="bg-primary/10 px-4 py-1 rounded-full mt-3">
            <Text className="text-primary text-sm font-medium">Free Plan</Text>
          </View>
        </View>

        <View className="mb-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => handleMenuPress(item.action)}
              activeOpacity={0.7}
              className={`bg-surface flex-row items-center border border-border ${
                index === 0 ? 'rounded-t-2xl' : ''
              } ${index === menuItems.length - 1 ? 'rounded-b-2xl' : ''} ${index > 0 ? 'border-t-0' : ''}`}
              style={{ padding: 16 }}
            >
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                <item.icon size={20} color="#6366F1" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-text-primary font-medium">{item.label}</Text>
                <Text className="text-text-muted text-sm">{item.description}</Text>
              </View>
              <ChevronRight size={20} color="#64748B" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.7}
          className="bg-surface rounded-2xl p-4 flex-row items-center justify-center border border-border mb-6"
        >
          <LogOut size={20} color="#EF4444" />
          <Text className="text-red-500 font-medium ml-2">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
