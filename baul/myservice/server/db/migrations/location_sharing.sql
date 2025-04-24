-- Create location_sharing table
CREATE TABLE IF NOT EXISTS location_sharing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    is_shared BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- Add location visibility to service_requests
ALTER TABLE service_requests ADD COLUMN location_visible BOOLEAN DEFAULT 0;

-- Index for faster queries
CREATE INDEX idx_location_sharing_user ON location_sharing(user_id);
CREATE INDEX idx_location_sharing_provider ON location_sharing(provider_id);
