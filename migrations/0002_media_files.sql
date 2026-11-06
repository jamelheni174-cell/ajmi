-- Optional D1-backed uploads when the Worker has no R2 MEDIA binding.
-- Image payloads are bounded to 1 MiB by the Worker, below D1's row limit.
create table if not exists media_files (
  name text primary key,
  content_type text not null,
  base64 text not null
);
