import React, { useEffect } from 'react'
// Layout de Material Top Tabs ya integrado con Expo Router (SDK 58)
import SwipeableTabs from 'expo-router/js-top-tabs'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { GlobalSheet } from '@/components/GlobalSheet'
import { OnboardingSetup } from '@/components/OnboardingSetup'
import { CycleEvaluator } from '@/components/CycleEvaluator'
import { useSettingsStore } from '@/store/useSettingsStore'

export default function TabLayout() {
  const { loadSettings, isLoaded, cycleMode } = useSettingsStore()

  useEffect(() => {
    loadSettings()
  }, [])

  if (!isLoaded) return null

  return (
    <>
      <SwipeableTabs
        tabBarPosition="bottom"
        screenOptions={{
          swipeEnabled: true,
          
          tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopWidth: 0.5,
            borderTopColor: COLORS.surfaceLight,
            height: 85,
            justifyContent: 'center',
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: 'bold',
            textTransform: 'capitalize',
            marginTop: 4,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          
          tabBarIndicatorStyle: {
            backgroundColor: COLORS.primary,
            height: 3,
            borderTopLeftRadius: 3,
            borderTopRightRadius: 3,
            top: 0,
          },
          
          tabBarPressColor: 'transparent', 
        }}
      >
        <SwipeableTabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24} 
                color={color as string}
              />
            ),
          }}
        />
        <SwipeableTabs.Screen
          name="plan"
          options={{
            title: 'Mi Plan',
            tabBarIcon: ({ focused, color }) => (
              <Ionicons
                name={focused ? "wallet" : "wallet-outline"}
                size={24} 
                color={color as string}
              />
            ),
          }}
        />
      </SwipeableTabs>

      <GlobalSheet />
      
      {!cycleMode && <OnboardingSetup />}
      {cycleMode && <CycleEvaluator />}
    </>
  );
}
