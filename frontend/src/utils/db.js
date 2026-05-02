import Dexie from 'dexie';

export const db = new Dexie('orbx_nexus');

db.version(1).stores({
  products: '++id, sku, barcode, name, category, price',
  inventory: '++id, branch_id, product_id, quantity, last_updated',
  sales: '++id, offline_id, customer_name, total_amount, synced',
  customers: '++id, phone, name, email',
  transfers: '++id, from_branch_id, to_branch_id, status',
  syncQueue: '++id, type, data, status, timestamp'
});

// Helper to add to sync queue
export const queueForSync = async (type, data) => {
  await db.syncQueue.add({
    type,
    data,
    status: 'pending',
    timestamp: new Date().toISOString()
  });
};

// Background Sync Logic
export const startSyncEngine = (branchId, apiUrl) => {
  const sync = async () => {
    try {
      const pending = await db.syncQueue.where('status').equals('pending').toArray();
      if (pending.length === 0) return;

      console.log(`Sync Engine: Sending ${pending.length} records to server...`);
      
      const response = await fetch(`${apiUrl}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_id: branchId, records: pending })
      });

      if (response.ok) {
        const result = await response.json();
        const successIds = result.results.success;
        
        await db.syncQueue.where('id').anyOf(successIds).modify({ status: 'synced' });
        console.log(`Sync Engine: Successfully synced ${successIds.length} records.`);
      }
    } catch (error) {
      console.error('Sync Engine Error:', error);
    }
  };

  // Run every 30 seconds
  setInterval(sync, 30000);
  
  // Also run once immediately
  sync();
};

// Fetch updates from server
export const fetchUpdates = async (branchId, apiUrl) => {
    const lastSyncRecord = await db.syncQueue.where('status').equals('synced').reverse().first();
    const lastSync = lastSyncRecord ? lastSyncRecord.timestamp : '1970-01-01T00:00:00Z';

    try {
        const res = await fetch(`${apiUrl}/api/sync/updates?branch_id=${branchId}&lastSync=${lastSync}`);
        if (res.ok) {
            const data = await res.json();
            if (data.products.length > 0) await db.products.bulkPut(data.products);
            if (data.inventory.length > 0) await db.inventory.bulkPut(data.inventory);
            return data.timestamp;
        }
    } catch (err) {
        console.error('Fetch updates failed', err);
    }
    return null;
};
