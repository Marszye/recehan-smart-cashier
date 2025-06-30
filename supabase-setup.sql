-- Setup database untuk aplikasi Recehan
-- Salin dan jalankan kode SQL ini di Supabase SQL Editor

-- 1. Buat tabel untuk sinkronisasi data Recehan
CREATE TABLE IF NOT EXISTS recehan_sync (
  id BIGSERIAL PRIMARY KEY,
  sync_id TEXT UNIQUE NOT NULL,
  data JSONB NOT NULL,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat index untuk performa yang lebih baik
CREATE INDEX IF NOT EXISTS idx_recehan_sync_sync_id ON recehan_sync(sync_id);
CREATE INDEX IF NOT EXISTS idx_recehan_sync_updated_at ON recehan_sync(updated_at);
CREATE INDEX IF NOT EXISTS idx_recehan_sync_created_at ON recehan_sync(created_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE recehan_sync ENABLE ROW LEVEL SECURITY;

-- 4. Buat policy untuk memungkinkan semua operasi
-- Karena menggunakan anon key, policy ini memungkinkan akses penuh
-- Dalam production yang lebih aman, bisa dibuat policy yang lebih ketat
CREATE POLICY "Allow all operations on recehan_sync" ON recehan_sync
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Buat function untuk auto-update kolom updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Buat trigger untuk auto-update updated_at setiap kali data diupdate
CREATE TRIGGER update_recehan_sync_updated_at 
  BEFORE UPDATE ON recehan_sync 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Buat tabel untuk log aktivitas sync (opsional, untuk monitoring)
CREATE TABLE IF NOT EXISTS recehan_sync_logs (
  id BIGSERIAL PRIMARY KEY,
  sync_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'upload', 'download', 'create'
  device_info JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Index untuk tabel log
CREATE INDEX IF NOT EXISTS idx_recehan_sync_logs_sync_id ON recehan_sync_logs(sync_id);
CREATE INDEX IF NOT EXISTS idx_recehan_sync_logs_created_at ON recehan_sync_logs(created_at);

-- 9. RLS untuk tabel log
ALTER TABLE recehan_sync_logs ENABLE ROW LEVEL SECURITY;

-- 10. Policy untuk tabel log
CREATE POLICY "Allow all operations on recehan_sync_logs" ON recehan_sync_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 11. Function untuk membersihkan data lama (opsional)
-- Menghapus data sync yang lebih dari 90 hari
CREATE OR REPLACE FUNCTION cleanup_old_sync_data()
RETURNS void AS $$
BEGIN
    DELETE FROM recehan_sync_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Hanya hapus data sync jika tidak ada aktivitas dalam 90 hari
    DELETE FROM recehan_sync 
    WHERE updated_at < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- 12. Buat view untuk statistik sync (opsional)
CREATE OR REPLACE VIEW recehan_sync_stats AS
SELECT 
    COUNT(*) as total_syncs,
    COUNT(DISTINCT sync_id) as unique_devices,
    MAX(updated_at) as last_sync,
    MIN(created_at) as first_sync
FROM recehan_sync;

-- Selesai! Database Recehan siap digunakan.
-- 
-- Struktur data yang akan disimpan dalam kolom 'data':
-- {
--   "settings": { ... },      // Data pengaturan aplikasi
--   "products": { ... },      // Data produk
--   "transactions": { ... },  // Data transaksi
--   "customers": { ... },     // Data pelanggan
--   "debts": { ... },        // Data hutang
--   "auth": { ... },         // Data autentikasi
--   "timestamp": 1234567890  // Waktu backup
-- }