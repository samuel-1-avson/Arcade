import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { getFirebaseDb } from '../config';

const SHOP_ITEMS_COLLECTION = 'shopItems';
const USER_INVENTORY_COLLECTION = 'userInventory';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  price: number;
  category: 'avatar' | 'theme' | 'badge' | 'powerup';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  active: boolean;
}

export interface UserInventory {
  items: string[]; // Array of item IDs
  equipped: {
    avatar?: string;
    theme?: string;
    badge?: string;
    powerup?: string;
  };
}

// Default shop items
const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  // Avatars
  {
    id: 'avatar-cyber',
    name: 'Cyber Avatar',
    description: 'A futuristic cyberpunk avatar',
    icon: 'UserCircle',
    price: 100,
    category: 'avatar',
    rarity: 'rare',
    active: true,
  },
  {
    id: 'avatar-ninja',
    name: 'Ninja Avatar',
    description: 'Stealthy ninja avatar',
    icon: 'UserCircle',
    price: 150,
    category: 'avatar',
    rarity: 'epic',
    active: true,
  },
  {
    id: 'avatar-robot',
    name: 'Robot Avatar',
    description: 'Cute robot avatar',
    icon: 'Bot',
    price: 200,
    category: 'avatar',
    rarity: 'legendary',
    active: true,
  },
  
  // Themes
  {
    id: 'theme-neon',
    name: 'Neon Theme',
    description: 'Cyberpunk neon color scheme',
    icon: 'Palette',
    price: 150,
    category: 'theme',
    rarity: 'rare',
    active: true,
  },
  {
    id: 'theme-retro',
    name: 'Retro Theme',
    description: 'Classic arcade colors',
    icon: 'Palette',
    price: 100,
    category: 'theme',
    rarity: 'common',
    active: true,
  },
  {
    id: 'theme-ocean',
    name: 'Ocean Theme',
    description: 'Deep blue ocean colors',
    icon: 'Palette',
    price: 150,
    category: 'theme',
    rarity: 'rare',
    active: true,
  },
  
  // Badges
  {
    id: 'badge-star',
    name: 'Star Badge',
    description: 'Show off your star status',
    icon: 'Star',
    price: 50,
    category: 'badge',
    rarity: 'common',
    active: true,
  },
  {
    id: 'badge-fire',
    name: 'Fire Badge',
    description: 'You\'re on fire!',
    icon: 'Flame',
    price: 75,
    category: 'badge',
    rarity: 'rare',
    active: true,
  },
  {
    id: 'badge-crown',
    name: 'Crown Badge',
    description: 'Royalty status',
    icon: 'Crown',
    price: 150,
    category: 'badge',
    rarity: 'epic',
    active: true,
  },
  
  // Power-ups
  {
    id: 'powerup-double-xp',
    name: 'Double XP (1 Day)',
    description: 'Earn 2x XP for 24 hours',
    icon: 'Zap',
    price: 100,
    category: 'powerup',
    rarity: 'rare',
    active: true,
  },
  {
    id: 'powerup-lucky',
    name: 'Lucky Charm',
    description: '50% bonus coins for 1 day',
    icon: 'Clover',
    price: 80,
    category: 'powerup',
    rarity: 'common',
    active: true,
  },
];

export const shopService = {
  // Initialize shop items
  initializeShop: async (): Promise<void> => {
    try {
      const db = await getFirebaseDb();
      if (!db) return;

      const shopRef = collection(db, SHOP_ITEMS_COLLECTION);
      
      for (const item of DEFAULT_SHOP_ITEMS) {
        try {
          const itemDoc = doc(shopRef, item.id);
          const snapshot = await getDoc(itemDoc);
          
          if (!snapshot.exists()) {
            await setDoc(itemDoc, item);
          }
        } catch (e) {
          // Skip if cannot write
        }
      }
    } catch (e) {
      // Initialization failed
    }
  },

  // Get all shop items
  getShopItems: async (): Promise<ShopItem[]> => {
    try {
      const db = await getFirebaseDb();
      if (!db) {
        return DEFAULT_SHOP_ITEMS.filter(item => item.active);
      }

      await shopService.initializeShop();
      
      const shopRef = collection(db, SHOP_ITEMS_COLLECTION);
      const q = query(shopRef);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return DEFAULT_SHOP_ITEMS.filter(item => item.active);
      }

      return snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            icon: data.icon,
            price: data.price,
            category: data.category,
            rarity: data.rarity,
            active: data.active,
          } as ShopItem;
        })
        .filter(item => item.active);
    } catch (error) {
      // Return defaults on any error
      return DEFAULT_SHOP_ITEMS.filter(item => item.active);
    }
  },

  // Get items by category
  getItemsByCategory: async (category: ShopItem['category']): Promise<ShopItem[]> => {
    const items = await shopService.getShopItems();
    return items.filter(item => item.category === category);
  },

  // Get user's inventory
  getUserInventory: async (userId: string): Promise<UserInventory> => {
    try {
      const db = await getFirebaseDb();
      
      // Try localStorage first
      const localKey = `shop_inventory_${userId}`;
      const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
      
      if (!db) {
        return localData ? JSON.parse(localData) : { items: [], equipped: {} };
      }

      const inventoryRef = doc(db, USER_INVENTORY_COLLECTION, userId);
      const snapshot = await getDoc(inventoryRef);

      let inventory: UserInventory;
      
      if (snapshot.exists()) {
        inventory = snapshot.data() as UserInventory;
      } else {
        // Initialize empty inventory
        inventory = { items: [], equipped: {} };
        await setDoc(inventoryRef, inventory);
      }
      
      // Cache to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(localKey, JSON.stringify(inventory));
      }
      
      return inventory;
    } catch (error) {
      // Fallback to localStorage
      const localKey = `shop_inventory_${userId}`;
      const localData = typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;
      return localData ? JSON.parse(localData) : { items: [], equipped: {} };
    }
  },

  // Purchase item with atomic transaction
  purchaseItem: async (userId: string, itemId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get item details first
      const items = await shopService.getShopItems();
      const item = items.find(i => i.id === itemId);
      
      if (!item) {
        return { success: false, error: 'Item not found' };
      }
      
      if (!item.active) {
        return { success: false, error: 'Item not available' };
      }
      
      // Get current inventory from localStorage
      const localInvKey = `shop_inventory_${userId}`;
      const localData = typeof window !== 'undefined' ? localStorage.getItem(localInvKey) : null;
      const inventory: UserInventory = localData ? JSON.parse(localData) : { items: [], equipped: {} };
      
      // Check if already owned
      if (inventory.items.includes(itemId)) {
        return { success: false, error: 'Item already owned' };
      }
      
      // Get current coins from localStorage
      const localCoinsKey = `user_coins_${userId}`;
      const localCoins = typeof window !== 'undefined' ? localStorage.getItem(localCoinsKey) : null;
      let currentCoins = localCoins ? parseInt(localCoins, 10) : 0;
      
      // Try to get coins from Firebase
      const db = await getFirebaseDb();
      if (db) {
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            currentCoins = userSnap.data().coins || 0;
          }
        } catch (e) {
          // Use localStorage coins
        }
      }
      
      // Check coin balance
      if (currentCoins < item.price) {
        return { success: false, error: 'Not enough coins' };
      }
      
      // Update inventory in localStorage
      inventory.items.push(itemId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(localInvKey, JSON.stringify(inventory));
        localStorage.setItem(localCoinsKey, (currentCoins - item.price).toString());
      }
      
      // Try Firebase transaction
      if (db) {
        try {
          const itemRef = doc(db, SHOP_ITEMS_COLLECTION, itemId);
          const userRef = doc(db, 'users', userId);
          const inventoryRef = doc(db, USER_INVENTORY_COLLECTION, userId);
          
          await runTransaction(db, async (transaction) => {
            const itemSnap = await transaction.get(itemRef);
            const userSnap = await transaction.get(userRef);
            const inventorySnap = await transaction.get(inventoryRef);
            
            if (!itemSnap.exists()) {
              throw new Error('Item not found');
            }
            
            const item = itemSnap.data() as ShopItem;
            const userData = userSnap.exists() ? userSnap.data() : {};
            const currentCoins = userData.coins || 0;
            
            transaction.update(userRef, {
              coins: currentCoins - item.price,
              updatedAt: serverTimestamp(),
            });
            
            if (inventorySnap.exists()) {
              transaction.update(inventoryRef, {
                items: arrayUnion(itemId),
                updatedAt: serverTimestamp(),
              });
            } else {
              transaction.set(inventoryRef, {
                items: [itemId],
                equipped: {},
                updatedAt: serverTimestamp(),
              });
            }
          });
        } catch (firebaseError) {
          // Firebase failed but localStorage succeeded
        }
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Purchase failed' };
    }
  },

  // Equip item
  equipItem: async (
    userId: string, 
    itemId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Get item details
      const items = await shopService.getShopItems();
      const item = items.find(i => i.id === itemId);
      
      if (!item) {
        return { success: false, error: 'Item not found' };
      }

      // Get inventory
      const inventory = await shopService.getUserInventory(userId);
      if (!inventory.items.includes(itemId)) {
        return { success: false, error: 'Item not owned' };
      }

      // Update equipped in localStorage
      inventory.equipped[item.category] = itemId;
      const localInvKey = `shop_inventory_${userId}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(localInvKey, JSON.stringify(inventory));
      }

      // Try Firebase update
      const db = await getFirebaseDb();
      if (db) {
        try {
          const inventoryRef = doc(db, USER_INVENTORY_COLLECTION, userId);
          await updateDoc(inventoryRef, {
            [`equipped.${item.category}`]: itemId,
            updatedAt: serverTimestamp(),
          });
        } catch (firebaseError) {
          // Firebase failed but localStorage succeeded
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Equip failed' };
    }
  },

  // Unequip item
  unequipItem: async (
    userId: string, 
    category: ShopItem['category']
  ): Promise<void> => {
    const db = await getFirebaseDb();
    if (!db) return;

    const inventoryRef = doc(db, USER_INVENTORY_COLLECTION, userId);
    await updateDoc(inventoryRef, {
      [`equipped.${category}`]: null,
      updatedAt: serverTimestamp(),
    });
  },
};
