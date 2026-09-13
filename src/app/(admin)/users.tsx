import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { ErrorState } from '@/components/ErrorState';
import { GlassPanel } from '@/components/GlassPanel';
import { LoadingState } from '@/components/LoadingState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SearchBar } from '@/components/SearchBar';
import { Pills, RolePill, formatDate } from '@/components/admin/AdminBits';
import { Colors, FontSize } from '@/constants/theme';
import { useResponsive } from '@/hooks/useResponsive';
import { getUsers, type AdminUser } from '@/services/adminService';

const PAGE_SIZE = 20;

const ROLE_OPTIONS: { key: string; label: string; value: string | undefined }[] = [
  { key: 'all', label: 'All', value: undefined },
  { key: 'customer', label: 'Customers', value: 'customer' },
  { key: 'provider', label: 'Providers', value: 'provider' },
  { key: 'admin', label: 'Admins', value: 'admin' },
];

export default function UsersScreen() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string | undefined>(undefined);
  const { columns } = useResponsive();
  const cols = columns([1, 2, 2, 3]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getUsers({ role, search: search || undefined, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!mounted) return;
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setHasMore(res.items.length >= PAGE_SIZE);
        setError('');
      })
      .catch((e) => {
        if (mounted) setError(e?.message ?? 'Failed to load users.');
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setRefreshing(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [page, role, search]);

  function reset() {
    setPage(1);
    setItems([]);
  }

  function onSearchSubmit() {
    setSearch(query.trim());
    reset();
  }

  function onRole(v?: string) {
    setRole(v);
    reset();
  }

  function onRefresh() {
    setRefreshing(true);
    reset();
  }

  function onEndReached() {
    if (hasMore && !loading) setPage((p) => p + 1);
  }

  const header = (
    <View style={styles.header}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or email..."
        onSubmit={onSearchSubmit}
      />
      <Pills options={ROLE_OPTIONS} value={role} onChange={onRole} />
    </View>
  );

  return (
    <Screen scroll={false}>
      <ScreenHeader title="Users" subtitle="All registered accounts" showBack={false} />
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(u) => u.id}
        numColumns={cols}
        columnWrapperStyle={cols > 1 ? { gap: 12 } : undefined}
        renderItem={({ item }) => <UserRow user={item} />}
        ListHeaderComponent={header}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} />
          ) : (
            <Text style={styles.empty}>No users found.</Text>
          )
        }
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <GlassPanel borderRadius={14} contentStyle={styles.card}>
      <View style={styles.row}>
        <Avatar name={user.name} size={42} />
        <View style={styles.rowText}>
          <Text style={styles.title} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.muted} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
        <RolePill role={user.role} />
      </View>
      <Text style={styles.mutedSmall}>Joined {formatDate(user.createdAt)}</Text>
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  header: { gap: 10, paddingBottom: 8 },
  content: { gap: 8, paddingBottom: 24 },
  card: { padding: 12, gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { flex: 1, gap: 2 },
  title: { color: Colors.charcoal, fontWeight: '700' },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm },
  mutedSmall: { color: Colors.textLight, fontSize: FontSize.xs },
  empty: { color: Colors.textMuted, textAlign: 'center', paddingTop: 24 },
});