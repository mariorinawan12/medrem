import { useEffect, useState, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, Text, Pressable, TextInput } from 'react-native';
import { useRouter, useFocusEffect} from 'expo-router';
import { getDependents } from '@/lib/dependent';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { deleteDependent } from '@/lib/dependent';


interface Dependent {
  userId: number;
  email: string;
  fullName: string;
  createdAt: string;
}

export default function DependentManagementPage() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [filteredDependents, setFilteredDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisibleId, setMenuVisibleId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // useEffect(() => {
  //   const fetchDependents = async () => {
  //     try {
  //       const data = await getDependents();
  //       setDependents(data);
  //       setFilteredDependents(data);
  //     } catch (error) {
  //       console.error('Error fetching dependents:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchDependents();
  // }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchDependents = async () => {
        try {
          setLoading(true); // Opsional, supaya user tahu ada proses loading
          const data = await getDependents();
          setDependents(data);
          setFilteredDependents(data);
        } catch (error) {
          console.error('Error fetching dependents:', error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchDependents();
      
      // Cleanup function (jika perlu)
      return () => {
        setMenuVisibleId(null); // Reset menu state saat meninggalkan page
      };
    }, [])
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDependents(dependents);
    } else {
      const filtered = dependents.filter(dep =>
        dep.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDependents(filtered);
    }
  }, [searchQuery, dependents]);

  const handleDelete = (userId: number) => {
    // Implement your delete logic here
    console.log('Deleting user with ID:', userId);
    deleteDependent(userId)
      .then(() => {
        setDependents(prev => prev.filter(dep => dep.userId !== userId));
        setFilteredDependents(prev => prev.filter(dep => dep.userId !== userId));
      })
      .catch(error => {
        console.error('Error deleting dependent:', error);
      });
    setMenuVisibleId(null);

  };

  const renderDependent = ({ item }: { item: Dependent }) => {
    const isMenuVisible = menuVisibleId === item.userId;
  
    return (
      <View key={item.userId} style={styles.dependentCardWrapper}>
        {isMenuVisible && (
          <Pressable 
            style={styles.menuOverlay}
            onPress={() => setMenuVisibleId(null)}
          />
        )}
        
        <View style={styles.dependentCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardText}>
              <Text style={{ color: '#000', fontWeight: '600', fontSize: 16 }}>{item.fullName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setMenuVisibleId(isMenuVisible ? null : item.userId)}
            >
              <Text style={styles.menuIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
  
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push({
              pathname: '/dependents/[userId]/medications',
              params: { 
                userId: item.userId.toString(), 
                fullName: item.fullName.toString()
              },
            })}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Manage</Text>
          </TouchableOpacity>
        </View>
  
        {isMenuVisible && (
  <View style={styles.menu}>
    <TouchableOpacity
      onPress={() => {
        setMenuVisibleId(null);
        // Add your edit functionality here
        router.push({
          pathname: '/dependents/[userId]/edit-dependent',
          params: { 
            userId: item.userId.toString(), 
            fullName: item.fullName.toString()
          },
        });
      }}
    >
      <Text style={styles.menuItem}>Edit</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => {
        setMenuVisibleId(null);
        handleDelete(item.userId);
      }}
    >
      <Text style={styles.menuItem}>Delete</Text>
    </TouchableOpacity>
  </View>
)}
      </View>
    );
  };

  if (loading) {
    return <ActivityIndicator style={styles.loading} size="large" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={styles.container}>
        <LinearGradient
          style={styles.headerGradient}
          colors={['#1a8e2d', '#146922']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: 'white', fontWeight: '700' }]}>Dependents</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInnerContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dependents..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => setSearchQuery('')}
                style={styles.clearIcon}
              >
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.innerContainer}>
          <View style={styles.listContainer}>
            <FlatList
              data={filteredDependents}
              keyExtractor={(item) => item.userId.toString()}
              renderItem={renderDependent}
              ListEmptyComponent={
                <View style={styles.noDependentsContainer}>
                  <Text style={[styles.noDependentsText, { color: '#888' }]}>
                    {searchQuery.trim() === '' 
                      ? 'No dependents found.' 
                      : 'No dependents match your search.'}
                  </Text>
                </View>
              }
              contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
            />
          </View>
          
          <View style={styles.buttonOuterContainer}>
            <TouchableOpacity 
              style={styles.button}
              onPress={() => router.push({ pathname: '/dependents/add-dependent' })}
            >
              <Text style={[styles.buttonText, { color: 'white', fontWeight: 'bold' }]}>Add Dependent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 1,
  },
  headerTitle: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  listContainer: {
    flex: 1,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  dependentCardWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  dependentCard: {
    backgroundColor: '#E6F4EA',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardText: {
    flex: 1,
  },
  email: {
    fontSize: 16,
    marginBottom: 5,
  },
  menuIcon: {
    fontSize: 24,
    paddingHorizontal: 10,
    color: '#000',
  },
  menu: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  menuItem: {
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  manageButton: {
    marginTop: 10,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonOuterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 5,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    marginTop: 30,
  },
  noDependentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDependentsText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  // Search styles
  searchContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  searchInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
    paddingVertical: 0,
  },
  searchIcon: {
    marginRight: 5,
  },
  clearIcon: {
    marginLeft: 10,
    padding: 5,
  },
});