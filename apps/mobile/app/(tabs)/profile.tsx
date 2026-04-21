import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Settings, Bell, Users, CreditCard, LogOut, ChevronRight } from '@expo/vector-icons';

const menuItems = [
  { icon: Users, label: 'Account', description: 'Manage your account details' },
  { icon: Bell, label: 'Notifications', description: 'Configure reminder preferences' },
  { icon: CreditCard, label: 'Billing', description: 'View your plan and usage' },
  { icon: Settings, label: 'Settings', description: 'App configuration' },
];

export default function ProfileScreen() {
  const { user } = useUser();

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-6">
        <Text className="text-2xl font-bold text-text-primary">Profile</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="bg-surface rounded-2xl p-6 mb-6 border border-border items-center">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
            <Text className="text-primary text-3xl font-bold">
              {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0].toUpperCase() || 'U'}
            </Text>
          </View>
          <Text className="text-xl font-bold text-text-primary">
            {user?.fullName || 'User'}
          </Text>
          <Text className="text-text-secondary mt-1">
            {user?.emailAddresses[0]?.emailAddress}
          </Text>
          <View className="bg-primary/10 px-4 py-1 rounded-full mt-3">
            <Text className="text-primary text-sm font-medium">Free Plan</Text>
          </View>
        </View>

        <View className="space-y-3 mb-6">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="bg-surface rounded-xl p-4 flex-row items-center border border-border"
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

        <TouchableOpacity className="bg-surface rounded-xl p-4 flex-row items-center justify-center border border-border mb-6">
          <LogOut size={20} color="#EF4444" />
          <Text className="text-red-500 font-medium ml-2">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
