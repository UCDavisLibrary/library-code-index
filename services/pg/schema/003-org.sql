set search_path to lci, api, public;

CREATE TABLE IF NOT EXISTS lci.organization (
  organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  url TEXT,
  github_payload JSONB,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
)

CREATE OR REPLACE TRIGGER organization_updated_at
  BEFORE UPDATE ON lci.organization
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION lci.get_organization_id(name_or_id text)
  RETURNS UUID AS $$
  DECLARE
    oid UUID;
  BEGIN
    SELECT organization_id INTO oid FROM lci.organization
    WHERE name = name_or_id OR organization_id=try_cast_uuid(name_or_id);

    IF oid IS NULL THEN
      RAISE EXCEPTION 'Organization not found: %', name_or_id;
    END IF;

    RETURN oid;
  END;
$$ LANGUAGE plpgsql;
