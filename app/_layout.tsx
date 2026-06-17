import 'react-native-gesture-handler'
import React from 'react'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
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
              <Image 
                source={require('./../assets/images/GoCoink.avif')} 
                contentFit="contain" // resizeMode='contain' <-- descontinuado ahora se usa Image de expo
                transition={500}
                style={{ 
                  marginRight: 10,
                  width: 32,
                  height: 32,
                }} 
              /> 
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
        
        <Stack.Screen name="+not-found" options={{ title: 'Ups!' }} />
      </Stack>
    </GestureHandlerRootView>
  )
}
