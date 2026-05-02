-- MES, IoT, Camera, Gamification jadvallarini yaratish/tuzatish

-- 1. employees ga yetishmagan ustunlar
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- 2. mes_maintenance_requests
CREATE TABLE IF NOT EXISTS mes_maintenance_requests (
  id SERIAL PRIMARY KEY,
  requested_by INTEGER,
  equipment_id INTEGER,
  title VARCHAR(200),
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. mes_maintenance_tasks
CREATE TABLE IF NOT EXISTS mes_maintenance_tasks (
  id SERIAL PRIMARY KEY,
  request_id INTEGER,
  assigned_to INTEGER,
  title VARCHAR(200),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. mes_downtime_reasons
CREATE TABLE IF NOT EXISTS mes_downtime_reasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  category VARCHAR(100),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. mes_production_sessions
CREATE TABLE IF NOT EXISTS mes_production_sessions (
  id SERIAL PRIMARY KEY,
  operator_id INTEGER,
  equipment_id INTEGER,
  order_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  produced_qty INTEGER DEFAULT 0,
  defect_qty INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. gamification_points
CREATE TABLE IF NOT EXISTS gamification_points (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  points INTEGER DEFAULT 0,
  reason VARCHAR(200),
  category VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. cameras
CREATE TABLE IF NOT EXISTS cameras (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  location VARCHAR(200),
  ip_address VARCHAR(50),
  rtsp_url TEXT,
  status VARCHAR(50) DEFAULT 'online',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. camera_events (camera_id text/varchar — backend ::text cast qiladi)
CREATE TABLE IF NOT EXISTS camera_events (
  id SERIAL PRIMARY KEY,
  camera_id VARCHAR(50),
  event_type VARCHAR(100),
  description TEXT,
  severity VARCHAR(20) DEFAULT 'low',
  status VARCHAR(50) DEFAULT 'new',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. camera_zones
CREATE TABLE IF NOT EXISTS camera_zones (
  id SERIAL PRIMARY KEY,
  camera_id INTEGER,
  zone_name VARCHAR(200),
  zone_type VARCHAR(100),
  coordinates TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. iot_sensors (agar yo'q bo'lsa)
CREATE TABLE IF NOT EXISTS iot_sensors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  sensor_type VARCHAR(100),
  equipment_id INTEGER,
  location VARCHAR(200),
  unit VARCHAR(50),
  min_value NUMERIC(18, 4),
  max_value NUMERIC(18, 4),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. iot_sensor_readings
CREATE TABLE IF NOT EXISTS iot_sensor_readings (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER,
  value NUMERIC(18, 4),
  recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. iot_alerts
CREATE TABLE IF NOT EXISTS iot_alerts (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER,
  alert_type VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'medium',
  message TEXT,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. equipment (agar yo'q bo'lsa)
CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200),
  code VARCHAR(100),
  type VARCHAR(100),
  location VARCHAR(200),
  status VARCHAR(50) DEFAULT 'active',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
