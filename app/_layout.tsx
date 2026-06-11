import 'react-native-gesture-handler'
import React from 'react'
import { Stack, useRouter } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'

export default function RootLayout() {
  const router = useRouter()

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.text,
            headerShadowVisible: false,
            headerTitleStyle: { fontWeight: 'bold', fontSize: 22 },
          }}
        >
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              title: 'GoCoink',
              headerLeft: () => (
                <Ionicons name="wallet" size={28} color={COLORS.primary} style={{ marginRight: 10 }} />   
              ),
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => console.log('Ir a Configuracion')}
                  style={{ padding: 8}}
                >
                  <Ionicons name="settings-outline" size={24} color={COLORS.textMuted} />
                </TouchableOpacity>
              )
            }}
          />
          {/* <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} /> */ }
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
