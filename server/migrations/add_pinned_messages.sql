-- Add pinned messages table for pinning messages in channels
CREATE TABLE IF NOT EXISTS pinned_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NULL,
    direct_message_id INT NULL,
    message_id INT NULL,
    direct_message_id_ref INT NULL,
    pinned_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    FOREIGN KEY (direct_message_id) REFERENCES direct_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (direct_message_id_ref) REFERENCES direct_message_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (pinned_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_channel_pin (channel_id, message_id),
    UNIQUE KEY unique_dm_pin (direct_message_id, direct_message_id_ref),
    INDEX idx_channel_id (channel_id),
    INDEX idx_direct_message_id (direct_message_id),
    INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

