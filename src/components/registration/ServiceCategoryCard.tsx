import { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  CATEGORY_REF,
  scaled,
} from '@/constants/serviceCategoryStep';
import type { ServiceCategoryVisual } from '@/constants/serviceCategories';
import { RegColors } from '@/constants/registrationTheme';

interface Props {
  category: ServiceCategoryVisual;
  selected: boolean;
  onPress: () => void;
  /** checkbox = multi-select toggle; radio = single select */
  selectionMode?: 'checkbox' | 'radio';
}

/** Content width inside the glass panel (matches reference proportions). */
function contentWidth(screenWidth: number) {
  const scrollPad = 14 * 2;
  const glassPad = 20 * 2;
  return screenWidth - scrollPad - glassPad;
}

function Sparkles({
  color,
  dots,
  cw,
}: {
  color: string;
  dots: NonNullable<ServiceCategoryVisual['sparkles']>;
  cw: number;
}) {
  return (
    <>
      {dots.map((d, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            styles.sparkle,
            {
              top: scaled(d.top, cw),
              right: scaled(d.right, cw),
              width: scaled(d.size, cw),
              height: scaled(d.size, cw),
              opacity: d.opacity,
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      ))}
    </>
  );
}

export function ServiceCategoryCard({
  category,
  selected,
  onPress,
  selectionMode = 'radio',
}: Props) {
  const { width } = useWindowDimensions();
  const cw = contentWidth(width);
  const narrow = cw < 300;
  const anim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  const cardH = scaled(CATEGORY_REF.cardHeight, cw);
  const radius = scaled(CATEGORY_REF.cardRadius, cw);
  const innerRadius = scaled(CATEGORY_REF.cardInnerRadius, cw);
  const padH = scaled(CATEGORY_REF.cardPadH, cw);
  const padV = scaled(CATEGORY_REF.cardPadV, cw);
  const radio = scaled(CATEGORY_REF.radioSize, cw);
  const artW = Math.round(cw * (narrow ? 0.5 : CATEGORY_REF.artWidthRatio));
  const artH = scaled(narrow ? 152 : CATEGORY_REF.artHeight, cw);
  const textMax = Math.round(cw * (narrow ? 0.58 : CATEGORY_REF.textMaxRatio));
  const titleSize = scaled(narrow ? 18 : CATEGORY_REF.titleSize, cw);
  const descSize = scaled(narrow ? 13 : CATEGORY_REF.descSize, cw);
  const artScale = (category.artScale ?? 1) * (narrow ? 0.9 : 1);
  const artRight = scaled(category.artRight ?? CATEGORY_REF.artRight, cw);
  const artBottom = scaled(category.artBottom ?? CATEGORY_REF.artBottom, cw);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [anim, selected]);

  const glow = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const cardInner = (
    <View
      style={[
        styles.card,
        {
          minHeight: cardH,
          borderRadius: innerRadius,
        },
        Platform.select({
          web: {
            backdropFilter: 'blur(22px) saturate(160%)',
            WebkitBackdropFilter: 'blur(22px) saturate(160%)',
            boxShadow: selected
              ? '0 14px 36px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.22)'
              : '0 10px 26px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.16)',
          } as object,
          default: {},
        }),
      ]}>
      {/* Glass base */}
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
        pointerEvents="none"
      />

      {/* Category tint */}
      <LinearGradient
        colors={[...category.cardFill]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Radial bloom behind artwork (reference: glow from right) */}
      <View
        pointerEvents="none"
        style={[
          styles.radialBloom,
          {
            backgroundColor: category.radialGlow,
            width: scaled(200, cw),
            height: scaled(200, cw),
            right: scaled(-30, cw),
            bottom: scaled(-40, cw),
          },
        ]}
      />

      {/* Top-left glass sheen */}
      <LinearGradient
        colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0.05)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.45, y: 1 }}
        style={styles.gloss}
        pointerEvents="none"
      />

      {selected ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.selectedBloom,
            {
              backgroundColor: category.radialGlow,
              opacity: glow,
              width: scaled(190, cw),
              height: scaled(190, cw),
              right: scaled(-24, cw),
              bottom: scaled(-36, cw),
            },
          ]}
        />
      ) : null}

      {category.sparkleColor && category.sparkles ? (
        <Sparkles color={category.sparkleColor} dots={category.sparkles} cw={cw} />
      ) : null}

      <View
        pointerEvents="none"
        style={[
          styles.artClip,
          {
            width: artW,
            height: artH,
            right: artRight,
            bottom: artBottom,
            transform: [{ scale: artScale }],
          },
        ]}>
        <Image
          source={category.image}
          style={styles.art}
          contentFit="contain"
          contentPosition="bottom right"
          transition={0}
          allowDownscaling={false}
          cachePolicy="memory-disk"
        />
      </View>

      <View
        style={[
          styles.body,
          {
            paddingTop: padV,
            paddingBottom: padV,
            paddingLeft: padH,
            paddingRight: Math.max(padH + radio + 12, Math.round(cw * (narrow ? 0.34 : 0.4))),
          },
        ]}>
        <View style={[styles.textCol, { maxWidth: textMax }]}>
          <Text
            style={[
              styles.title,
              {
                fontSize: titleSize,
                lineHeight: scaled(narrow ? 24 : CATEGORY_REF.titleLineHeight, cw),
              },
            ]}>
            {category.label}
          </Text>
          <Text
            style={[
              styles.description,
              {
                fontSize: descSize,
                lineHeight: scaled(narrow ? 19 : CATEGORY_REF.descLineHeight, cw),
              },
            ]}>
            {category.description}
          </Text>
        </View>
      </View>

      <View style={[styles.radio, { top: padV, right: padH }]} pointerEvents="none">
        {selected ? (
          <View
            style={[
              styles.radioOn,
              { width: radio, height: radio, borderRadius: radio / 2 },
            ]}>
            <Ionicons name="checkmark" size={radio * 0.48} color="#2C2420" />
          </View>
        ) : (
          <View
            style={[
              styles.radioOff,
              { width: radio, height: radio, borderRadius: radio / 2 },
            ]}
          />
        )}
      </View>
    </View>
  );

  const borderW = scaled(
    selected ? CATEGORY_REF.selectedBorderWidth : CATEGORY_REF.idleBorderWidth,
    cw,
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={selectionMode === 'checkbox' ? 'checkbox' : 'radio'}
      accessibilityState={{ selected, checked: selected }}
      style={styles.wrap}>
      {selected ? (
        <View
          style={[
            styles.selectedFrame,
            {
              borderRadius: radius,
              ...Platform.select({
                web: {
                  boxShadow: `0 0 32px ${category.selectedGlow}, 0 0 8px ${category.selectedGlow}`,
                } as object,
                ios: {
                  shadowColor: category.accent,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.95,
                  shadowRadius: 18,
                },
                android: { elevation: 10 },
                default: {},
              }),
            },
          ]}>
          <LinearGradient
            colors={[category.selectedBorder, category.accent, category.selectedBorder]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.selectedBorder, { borderRadius: radius, padding: borderW }]}>
            {cardInner}
          </LinearGradient>
        </View>
      ) : (
        <View
          style={[
            styles.idleFrame,
            {
              borderRadius: radius,
              borderWidth: borderW,
              ...Platform.select({
                web: {
                  boxShadow: '0 8px 24px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12)',
                } as object,
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.22,
                  shadowRadius: 12,
                },
                android: { elevation: 3 },
                default: {},
              }),
            },
          ]}>
          {cardInner}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignSelf: 'stretch' },
  selectedFrame: {
    width: '100%',
    marginVertical: 3,
    ...Platform.select({
      default: {},
    }),
  },
  selectedBorder: {
    overflow: 'hidden',
    width: '100%',
  },
  idleFrame: {
    width: '100%',
    borderColor: 'rgba(255,255,255,0.40)',
    overflow: 'hidden',
  },
  card: {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  gloss: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  radialBloom: {
    position: 'absolute',
    borderRadius: 999,
    zIndex: 0,
  },
  selectedBloom: {
    position: 'absolute',
    borderRadius: 999,
    zIndex: 0,
  },
  sparkle: {
    position: 'absolute',
    borderRadius: 99,
    zIndex: 2,
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.95, shadowRadius: 8 },
      web: { boxShadow: '0 0 10px currentColor' } as object,
      default: {},
    }),
  },
  artClip: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  art: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  body: {
    zIndex: 4,
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  textCol: {
    gap: 8,
    zIndex: 5,
  },
  title: {
    color: RegColors.white,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  description: {
    color: 'rgba(255,255,255,0.86)',
    fontWeight: '500',
  },
  radio: {
    position: 'absolute',
    zIndex: 6,
  },
  radioOff: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.82)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  radioOn: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#FFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.95,
        shadowRadius: 10,
      },
      web: { boxShadow: '0 0 16px rgba(255,255,255,0.85)' } as object,
      android: { elevation: 4 },
      default: {},
    }),
  },
});
