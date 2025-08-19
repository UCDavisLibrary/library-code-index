set search_path to lci, api, public;

CREATE TABLE IF NOT EXISTS lci.gh_rate_limits (
  api_key_id TEXT NOT NULL,
  rate_limit_limit INTEGER NOT NULL,
  rate_limit_remaining INTEGER NOT NULL,
  rate_limit_used INTEGER NOT NULL,
  rate_limit_reset INTEGER NOT NULL,
  rate_limit_resource TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  PRIMARY KEY (api_key_id, rate_limit_resource)
);

CREATE OR REPLACE TRIGGER gh_rate_limits_updated_at
  BEFORE UPDATE ON lci.gh_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


CREATE OR REPLACE FUNCTION api.set_gh_rate_limit( payload JSONB )
RETURNS VOID AS $$
DECLARE
  v_api_key_id TEXT;
  v_rate_limit_limit INTEGER;
  v_rate_limit_remaining INTEGER;
  v_rate_limit_used INTEGER;
  v_rate_limit_reset INTEGER;
  v_rate_limit_resource TEXT;
BEGIN
  -- Extract values from the payload
  v_api_key_id := payload #>> '{api_key_id}';
  v_rate_limit_limit := (payload #>> '{headers, x-ratelimit-limit}')::INTEGER;
  v_rate_limit_remaining := (payload #>> '{headers, x-ratelimit-remaining}')::INTEGER;
  v_rate_limit_used := (payload #>> '{headers, x-ratelimit-used}')::INTEGER;
  v_rate_limit_reset := (payload #>> '{headers, x-ratelimit-reset}')::INTEGER;
  v_rate_limit_resource := (payload #>> '{headers, x-ratelimit-resource}')::TEXT;

  -- Upsert the rate limit data into the table
  INSERT INTO lci.gh_rate_limits (
    api_key_id,
    rate_limit_limit,
    rate_limit_remaining,
    rate_limit_used,
    rate_limit_reset,
    rate_limit_resource
  ) VALUES (
    v_api_key_id,
    v_rate_limit_limit,
    v_rate_limit_remaining,
    v_rate_limit_used,
    v_rate_limit_reset,
    v_rate_limit_resource
  )
  ON CONFLICT (api_key_id, rate_limit_resource) DO UPDATE
  SET
    rate_limit_limit = EXCLUDED.rate_limit_limit,
    rate_limit_remaining = EXCLUDED.rate_limit_remaining,
    rate_limit_used = EXCLUDED.rate_limit_used,
    rate_limit_reset = EXCLUDED.rate_limit_reset;

  RETURN;
END;
$$ LANGUAGE plpgsql;
