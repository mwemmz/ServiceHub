import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RegField } from '@/components/registration/RegControls';
import { RegColors } from '@/constants/registrationTheme';
import { pickFromGallery } from '@/services/mediaPicker';
import type { ProviderPortfolioItem, ProviderRegistrationService } from '@/types/providerRegistration';

const MIN_PHOTOS = 2;

interface Props {
  groups: {
    title: string;
    items: { id: string; label: string }[];
  }[];
  serviceDetails: Record<string, ProviderRegistrationService>;
  errors: Record<string, string>;
  onAddPortfolioItem: (serviceId: string, uri: string) => void;
  onRemovePortfolioItem: (serviceId: string, itemId: string) => void;
  onUpdatePortfolioItem: (
    serviceId: string,
    itemId: string,
    patch: Partial<ProviderPortfolioItem>,
  ) => void;
  onReplacePortfolioPhoto: (serviceId: string, itemId: string, uri: string) => void;
}

export function ProviderPortfolioStep({
  groups,
  serviceDetails,
  errors,
  onAddPortfolioItem,
  onRemovePortfolioItem,
  onUpdatePortfolioItem,
  onReplacePortfolioPhoto,
}: Props) {
  async function pickPhoto(serviceId: string) {
    const picked = await pickFromGallery({ allowsEditing: false });
    if (picked) onAddPortfolioItem(serviceId, picked.uri);
  }

  return (
    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          {group.items.map((item) => {
            const detail = serviceDetails[item.id];
            if (!detail) return null;
            const portfolioKey = `portfolio:${item.id}`;
            const photoCount = detail.portfolioItems.length;
            const photosNeeded = Math.max(0, MIN_PHOTOS - photoCount);
            const requirementMet = photoCount >= MIN_PHOTOS;

            return (
              <View key={item.id} style={styles.card}>
                <View style={styles.serviceHeader}>
                  <Text style={styles.serviceLabel}>Service</Text>
                  <Text style={styles.serviceName}>{detail.serviceName}</Text>
                </View>

                <View style={styles.uploadSection}>
                  <Text style={styles.uploadTitle}>Upload Your Latest Work</Text>
                  <Text style={styles.uploadHint}>
                    Show customers your latest work by uploading photos of your services.
                  </Text>

                  <View
                    style={[
                      styles.requirementBadge,
                      requirementMet ? styles.requirementBadgeMet : null,
                    ]}>
                    <Ionicons
                      name={requirementMet ? 'checkmark-circle' : 'images-outline'}
                      size={18}
                      color={requirementMet ? RegColors.success : RegColors.goldSoft}
                    />
                    <Text
                      style={[
                        styles.requirementText,
                        requirementMet ? styles.requirementTextMet : null,
                      ]}>
                      {requirementMet
                        ? `${photoCount} photos added`
                        : `At least ${MIN_PHOTOS} photos required · ${photoCount} of ${MIN_PHOTOS} added`}
                      {!requirementMet && photosNeeded > 0
                        ? ` · ${photosNeeded} more needed`
                        : ''}
                    </Text>
                  </View>
                </View>

                {errors[portfolioKey] ? (
                  <Text style={styles.err}>{errors[portfolioKey]}</Text>
                ) : null}

                {detail.portfolioItems.length > 0 ? (
                  <View style={styles.workList}>
                    {detail.portfolioItems.map((work, index) => {
                      const captionKey = `portfolioCaption:${item.id}:${work.id}`;
                      const priceKey = `portfolioPrice:${item.id}:${work.id}`;
                      return (
                        <View key={work.id} style={styles.workCard}>
                          <Text style={styles.workCardLabel}>Photo {index + 1}</Text>

                          <View style={styles.workPhotoWrap}>
                            <Image source={{ uri: work.uri }} style={styles.workPhoto} />
                            <View style={styles.workPhotoActions}>
                              <Pressable
                                style={styles.workActionBtn}
                                onPress={async () => {
                                  const picked = await pickFromGallery({ allowsEditing: false });
                                  if (picked) onReplacePortfolioPhoto(item.id, work.id, picked.uri);
                                }}
                                accessibilityLabel="Replace photo">
                                <Ionicons name="swap-horizontal" size={15} color="#fff" />
                                <Text style={styles.workActionText}>Replace</Text>
                              </Pressable>
                              <Pressable
                                style={[styles.workActionBtn, styles.workActionRemove]}
                                onPress={() => onRemovePortfolioItem(item.id, work.id)}
                                accessibilityLabel="Remove photo">
                                <Ionicons name="trash-outline" size={15} color="#fff" />
                                <Text style={styles.workActionText}>Remove</Text>
                              </Pressable>
                            </View>
                          </View>

                          <RegField
                            fieldKey={captionKey}
                            label="Caption"
                            value={work.caption}
                            onChangeText={(caption) =>
                              onUpdatePortfolioItem(item.id, work.id, { caption })
                            }
                            autoCapitalize="sentences"
                            error={errors[captionKey]}
                            variant="glass"
                          />
                          <RegField
                            fieldKey={priceKey}
                            label="Price"
                            value={work.price}
                            onChangeText={(price) =>
                              onUpdatePortfolioItem(item.id, work.id, { price })
                            }
                            keyboardType="decimal-pad"
                            error={errors[priceKey]}
                            returnKeyType="done"
                            variant="glass"
                          />
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                <Pressable
                  style={styles.uploadArea}
                  onPress={() => pickPhoto(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Add work photo">
                  <Ionicons name="add-circle-outline" size={32} color={RegColors.goldSoft} />
                  <Text style={styles.uploadAreaTitle}>
                    {photoCount > 0 ? 'Add Another Photo' : 'Add Photo'}
                  </Text>
                  <Text style={styles.uploadAreaHint}>Tap to upload from your gallery</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  group: { gap: 14, marginBottom: 18 },
  groupTitle: {
    color: RegColors.goldSoft,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RegColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    gap: 18,
  },
  serviceHeader: { gap: 6 },
  serviceLabel: {
    color: RegColors.whiteMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  serviceName: { color: RegColors.white, fontWeight: '800', fontSize: 20, lineHeight: 26 },
  uploadSection: { gap: 10 },
  uploadTitle: { color: RegColors.white, fontWeight: '800', fontSize: 19, lineHeight: 26 },
  uploadHint: { color: RegColors.whiteSoft, fontSize: 15, lineHeight: 22 },
  requirementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232, 196, 160, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  requirementBadgeMet: {
    borderColor: 'rgba(125, 219, 176, 0.35)',
    backgroundColor: 'rgba(125, 219, 176, 0.08)',
  },
  requirementText: {
    flex: 1,
    color: RegColors.goldSoft,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  requirementTextMet: { color: RegColors.success },
  uploadArea: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(210, 218, 228, 0.45)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(118, 108, 98, 0.12)',
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 8,
  },
  uploadAreaTitle: { color: RegColors.white, fontWeight: '700', fontSize: 16 },
  uploadAreaHint: { color: RegColors.whiteMuted, fontSize: 14, lineHeight: 20 },
  workList: { gap: 20 },
  workCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(210, 218, 228, 0.35)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    gap: 14,
  },
  workCardLabel: {
    color: RegColors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  workPhotoWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  workPhoto: {
    width: '100%',
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  workPhotoActions: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  workActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  workActionRemove: {
    backgroundColor: 'rgba(120,40,40,0.75)',
  },
  workActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  err: { color: RegColors.error, fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
