import React, { useEffect, useRef } from 'react'
import { View, Animated } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { GlobalSheet } from '@/components/GlobalSheet'
import { OnboardingSetup } from '@/components/OnboardingSetup'
import { CycleEvaluator } from '@/components/CycleEvaluator'
import { useSettingsStore } from '@/store/useSettingsStore'

// tipado para los nombres de los iconos
type IconName = React.ComponentProps<typeof Ionicons>['name']

interface AnimatedTabIconProps {
  focused: boolean
  icon: IconName
  activeIcon: IconName
  color: string
  size: number
}

const AnimatedTabIcon = ({ focused, icon, activeIcon, color, size }: AnimatedTabIconProps) => {
  // inicial en 1 para estar enfocado o 0 si no
  const animation = useRef(new Animated.Value(focused ? 1 : 0)).current

  useEffect(() => {
    Animated.spring(animation, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 6,
    }).start()
  }, [focused])

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  })

  const bgOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  })

  return (
    <View style={{ width: 65, height: 35, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: COLORS.primary,
          borderRadius: 16,
          opacity: bgOpacity,
          transform: [{ scale }]
        }}
      />
      <Animated.View style={{ transform: [{ scale }], zIndex: 1 }}>
        <Ionicons name={focused ? activeIcon : icon} size={size} color={color} />  
      </Animated.View>
    </View>
  )
}

export default function TabLayout() {
  const { loadSettings, isLoaded, cycleMode } = useSettingsStore()

  useEffect(() => {
    loadSettings()
  }, [])

  if (!isLoaded) return null

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopWidth: 0.5,
            borderTopColor: COLORS.surfaceLight,
            height: 85,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 15,
            fontWeight: 'bold',
            paddingTop: 5,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarHideOnKeyboard: true,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon 
                focused={focused}
                icon='home-outline'
                activeIcon='home'
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Mi Plan',
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon
                focused={focused}
                icon="wallet-outline"
                activeIcon="wallet"
                color={color}
                size={size}
              />
            ),
          }}
        />
        {/* Para agregar mas tabs.... */}
        
      </Tabs>

      <GlobalSheet />
      
      {!cycleMode && <OnboardingSetup />}
      {cycleMode && <CycleEvaluator />}
    </>
  );
}
