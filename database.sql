-- Tabel Products
CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    price text NOT NULL,
    image_url text,
    badge text,
    badge_color text DEFAULT 'bg-amber-500',
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel Settings (Kontak)
CREATE TABLE public.settings (
    id text PRIMARY KEY,
    value text NOT NULL
);

-- Masukkan data awal Settings
INSERT INTO public.settings (id, value) VALUES
('whatsapp_number', '6281224251104'),
('instagram_link', 'https://instagram.com/soul_coffee'),
('email_address', 'hello@soulcoffee.com')
ON CONFLICT (id) DO NOTHING;

-- Policies untuk memberikan akses public read
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-only access on products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow public read-only access on settings" ON public.settings
    FOR SELECT USING (true);

-- (Untuk insert/update/delete akan dilakukan lewat server API menggunakan ANON_KEY / Service Role Key yang melewati RLS, atau matikan RLS jika hanya diakses via server aman)
