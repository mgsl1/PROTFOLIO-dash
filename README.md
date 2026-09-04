# Portfolio Admin Dashboard

A full admin dashboard for the Supabase backend: manage projects, hero/about
sections, services, technologies, testimonials, messages, site settings —
everything defined in the SQL schema — styled to match the public portfolio
site (dark background, gold accents).

## 1. Configure your Supabase connection

Open `config.js` and fill in your project's values (**Project Settings → API**):

```js
const SUPABASE_URL = "https://YOUR-PROJECT-ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY";
```

The anon key is safe here — every request still goes through the RLS
policies from your SQL file, so the dashboard can only do what an
`editor`/`admin` profile is allowed to do.

## 2. Run the SQL file (if you haven't already)

Run the SQL script you shared in the Supabase SQL editor. It creates all
tables, RLS policies, storage buckets (`portfolio`, `documents`), and a
trigger that automatically creates a `profiles` row (with role `editor`)
whenever someone signs up.

## 3. Create your first admin account

1. In Supabase: **Authentication → Users → Add user**, create yourself an
   account with an email + password (or sign up from a small test page using
   `supabase.auth.signUp`).
2. The trigger in the SQL file automatically creates a matching row in
   `public.profiles` with `role = 'editor'`.
3. Promote yourself to `admin` by running this once in the SQL editor
   (replace the email):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Only `admin` accounts can see the **Users** page and delete contact
messages; `editor` accounts can manage everything else.

## 4. Open the dashboard

Just open `index.html` in a browser, or upload the whole `admin-dashboard`
folder to any static host (or a subfolder like `/admin` next to your
portfolio site). Log in with the account you created above.

## What's inside

- **Dashboard** — quick stats (projects, published count, new messages).
- **Hero / About / Contact Info / Site Settings** — single-record forms
  with English / French / Arabic tabs for every translatable field.
- **Projects** — full create/edit/delete, category + technology tagging,
  a media gallery (upload images/video, set captions, mark a cover image),
  status (draft/published/archived), SEO fields.
- **Statistics, Services, Technologies (+ categories), Project Categories,
  Experience, Education, Certificates, Testimonials, FAQs, Custom Sections,
  Pages, Downloads, External Links, Navigation, Social Links, SEO,
  Translations** — full CRUD, each with the fields from your schema.
- **Messages** — inbox for contact form submissions, filter by status,
  mark read/replied/archived/spam, delete (admin only).
- **Users** — (admin only) promote/demote editors and admins, deactivate
  accounts.

## Notes

- Image/file fields upload straight to your Supabase Storage buckets
  (`portfolio` for images, `documents` for CV/downloads) and store the
  public URL on the record.
- New user sign-ups aren't created from inside the dashboard (that needs a
  service-role key, which should never live in client code) — create users
  in the Supabase Auth dashboard, then manage their role/status here.
