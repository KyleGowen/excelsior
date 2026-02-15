-- Create checklist_erb_world_legends table
-- Mirrors the "Edgar Rice Burroughs and the World Legends" tab from the OverPower Check List spreadsheet
CREATE TABLE checklist_erb_world_legends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "Set" TEXT,
    "#" TEXT,
    "Card Name" TEXT,
    "Card Special" TEXT,
    "Rarity" TEXT,
    "Location" TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger for updated_at
CREATE TRIGGER update_checklist_erb_world_legends_updated_at BEFORE UPDATE ON checklist_erb_world_legends
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
