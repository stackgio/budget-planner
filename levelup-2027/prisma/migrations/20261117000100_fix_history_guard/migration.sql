-- Fix: the history-delete guard read OLD.status on tables without that column.
-- Same behaviour (block deletes of financial history; allow deleting PLANNED draft lines), clearer error.
CREATE OR REPLACE FUNCTION levelup_block_history_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'AllocationLine' THEN
    IF OLD.status = 'PLANNED' THEN RETURN OLD; END IF;
  END IF;
  RAISE EXCEPTION 'LEVELUP_LEDGER: % rows are permanent history and cannot be deleted', TG_TABLE_NAME;
END $$;
