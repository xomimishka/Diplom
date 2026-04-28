-- USERS
CREATE TABLE IF NOT EXISTS public.users
(
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    auth_provider VARCHAR(255)
);

-- LINKS
CREATE TABLE IF NOT EXISTS public.links
(
    id SERIAL PRIMARY KEY,
    "long" TEXT NOT NULL,
    short VARCHAR(6) NOT NULL,
    type BOOLEAN DEFAULT false,
    qr TEXT,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    has_end_date BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_checked TIMESTAMPTZ,
    check_status VARCHAR(50) DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_short
    ON public.links(short);

-- UNSAFE LINKS
CREATE TABLE IF NOT EXISTS public.unsafe_links
(
    "long" TEXT NOT NULL UNIQUE
);

-- USER_LINKS
CREATE TABLE IF NOT EXISTS public.user_links
(
    user_id INTEGER NOT NULL,
    link_id INTEGER NOT NULL,
    title VARCHAR(255),
    is_favorite BOOLEAN DEFAULT false,
    PRIMARY KEY (user_id, link_id),
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE CASCADE
);

-- CLICK_STATS
CREATE TABLE IF NOT EXISTS public.click_stats
(
    link_id INTEGER,
    country VARCHAR(255),
    city VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE CASCADE
);