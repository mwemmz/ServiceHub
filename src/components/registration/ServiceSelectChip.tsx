import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Premium grey/silver glass chip — service selection step only. */
export function ServiceSelectChip({ label, selected, onPress }: Props) {
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [anim, selected]);

  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(88, 94, 104, 0.42)', 'rgba(168, 176, 188, 0.55)'],
  });

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(186, 192, 202, 0.45)', 'rgba(242, 246, 252, 0.92)'],
  });

  const shadowOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.55],
  });

  const shadowRadius = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [5, 14],
  });

  const textOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor,
            borderColor,
            shadowOpacity,
            shadowRadius,
          },
          selected && styles.chipSelectedLift,
        ]}>
        <Animated.Text style={[styles.label, { opacity: textOpacity }, selected && styles.labelSelected]}>
          {label}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#E2E8F0',
    shadowOffset: { width: 0, height: 0 },
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px) saturate(140%)',
        WebkitBackdropFilter: 'blur(10px) saturate(140%)',
      } as object,
      default: {},
    }),
  },
  chipSelectedLift: Platform.select({
    android: { elevation: 10 },
    default: {},
  }),
  label: {
    color: 'rgba(248, 250, 252, 0.88)',
    fontSize: 12,
    fontWeight: '600',
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
