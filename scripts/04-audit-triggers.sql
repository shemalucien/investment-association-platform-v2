-- Added audit triggers for financial transparency
CREATE OR REPLACE FUNCTION audit_financial_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, details)
  VALUES (
    current_setting('app.current_user_id', true)::uuid,
    'FINANCIAL_UPDATE',
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'new_data', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_shares_change
AFTER INSERT OR UPDATE ON shares
FOR EACH ROW EXECUTE PROCEDURE audit_financial_change();

CREATE TRIGGER audit_loans_change
AFTER INSERT OR UPDATE ON loans
FOR EACH ROW EXECUTE PROCEDURE audit_financial_change();
