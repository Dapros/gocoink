import React, { useEffect } from 'react'
import { withLayoutContext } from 'expo-router'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/theme'
import { GlobalSheet } from '@/components/GlobalSheet'
import { OnboardingSetup } from '@/components/OnboardingSetup'
import { CycleEvaluator } from '@/components/CycleEvaluator'
import { useSettingsStore } from '@/store/useSettingsStore'

// Configuracion del motor de Material Tob Tabs
const { Navigator } = createMaterialTopTabNavigator()
const SwipeableTabs = withLayoutContext(Navigator)


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
            tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={24} 
                color={color} 
              />
            ),
          }}
        />
        <SwipeableTabs.Screen
          name="plan"
          options={{
            title: 'Mi Plan',
            tabBarIcon: ({ focused, color }: { focused: boolean; color: string }) => (
              <Ionicons 
                name={focused ? "wallet" : "wallet-outline"} 
                size={24} 
                color={color} 
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
