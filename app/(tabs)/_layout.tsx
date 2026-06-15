import React, { useEffect } from 'react'
import { Tabs } from 'expo-router'
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
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            height: 65,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plan"
          options={{
            title: 'Mi Plan',
            tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} />,
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
