set search_path to lci, api, public;

CREATE TABLE IF NOT EXISTS lci.selection_queue (
  selection_queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT,
  item JSONB NOT NULL,
  item_type TEXT NOT NULL,
  reviewed BOOLEAN NOT NULL DEFAULT false,
  selected BOOLEAN NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER selection_queue_updated_at
  BEFORE UPDATE ON lci.selection_queue
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS selection_queue_type_id_idx
ON lci.selection_queue (item_type, item_id);

CREATE OR REPLACE VIEW api.selection_queue AS
  SELECT *
  FROM lci.selection_queue;

CREATE OR REPLACE FUNCTION api.add_to_selection_queue_if_new(payload JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  payload_item_type TEXT;
  payload_item_id TEXT;
  existing_record_count INT;
  BEGIN
    -- Extract item type and id from the payload
    payload_item_type := payload #>> '{type}';
    payload_item_id := payload #>> '{id}';

    -- Check if a record with the same item_type and item_id already exists
    SELECT COUNT(*) INTO existing_record_count
    FROM lci.selection_queue
    WHERE item_type = payload_item_type AND item_id = payload_item_id;

    -- If no existing record is found, insert the new item into the selection queue
    IF existing_record_count = 0 THEN
        INSERT INTO lci.selection_queue (item_id, item, item_type)
        VALUES (payload_item_id, payload, payload_item_type);

        return TRUE;
    END IF;
    return FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION api.select_queue_item(payload JSONB)
  RETURNS VOID AS $$
  DECLARE
    payload_selection_queue_id UUID;
  BEGIN
    -- Extract selection_queue_id from the payload
    payload_selection_queue_id := (payload #>> '{selection_queue_id}')::UUID;
    -- Update the selection queue item to mark it as selected
    UPDATE lci.selection_queue
    SET selected = TRUE, reviewed = TRUE
    WHERE selection_queue_id = payload_selection_queue_id;

    RETURN;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION api.reject_queue_item(payload JSONB)
  RETURNS VOID AS $$
  DECLARE
    payload_selection_queue_id UUID;
  BEGIN
    -- Extract selection_queue_id from the payload
    payload_selection_queue_id := (payload #>> '{selection_queue_id}')::UUID;
    -- Update the selection queue item to mark it as reviewed
    UPDATE lci.selection_queue
    SET reviewed = TRUE
    WHERE selection_queue_id = payload_selection_queue_id;

    RETURN;
  END;
$$ LANGUAGE plpgsql;
