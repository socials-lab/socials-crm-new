-- Seed portfolio_items from uploaded assets in Downloads zips (2026-04-01).

WITH assets(path, type, title, sort_order) AS (
  VALUES
    ('import-20260401/images/20_+armband - 2 (1080x1350 px).png', 'image', '20+ armband', 1),
    ('import-20260401/images/banner1.jpg', 'image', 'Banner 1', 2),
    ('import-20260401/images/cbdway_bestsellery_1080x1350_2.jpg', 'image', 'CBDway bestsellery', 3),
    ('import-20260401/images/cyber monday 4 (1080x1350 px).png', 'image', 'Cyber Monday', 4),
    ('import-20260401/images/CZ - Carousel - _No-Stress_ Gift - 3.png', 'image', 'Carousel No-Stress Gift', 5),
    ('import-20260401/images/CZ - duo Magnesium.png', 'image', 'Duo Magnesium', 6),
    ('import-20260401/images/CZ - Halloween 1 (1080x1350 px).png', 'image', 'Halloween', 7),
    ('import-20260401/images/CZ-kesu-deluxe1.png', 'image', 'Kesu Deluxe', 8),
    ('import-20260401/images/darky vanoce - vesta (1080x1350 px).png', 'image', 'Darky Vanoce Vesta', 9),
    ('import-20260401/images/dmania_listopadova_sleva_11_25_1200x1200_2.jpg', 'image', 'Dmania listopadova sleva', 10),
    ('import-20260401/images/doprava zdarma1.png', 'image', 'Doprava zdarma', 11),
    ('import-20260401/images/naturapura_11_25_essentials_1080x1350_2.jpg', 'image', 'Naturapura essentials', 12),
    ('import-20260401/images/onlinemedical_longevity_10_25_1200x1200_1.jpg', 'image', 'OnlineMedical longevity', 13),
    ('import-20260401/images/sleepking_ryan_luna_1200x1200_2.jpg', 'image', 'Sleepking Ryan Luna', 14),

    ('import-20260401/videos/AdobeFirefly-video-export-2025-09-23T10-09-18.211Z.mp4', 'video', 'Adobe Firefly', 15),
    ('import-20260401/videos/Antistress.mp4', 'video', 'Antistress', 16),
    ('import-20260401/videos/bookport_socials.mp4', 'video', 'Bookport Socials', 17),
    ('import-20260401/videos/bussines_penezenka_compressed.mp4', 'video', 'Business penezenka', 18),
    ('import-20260401/videos/CBDWAY_SLEEP_compressed.mp4', 'video', 'CBDway Sleep', 19),
    ('import-20260401/videos/final_final-video-export-2025-10-10T11-36-52.034Z.mp4', 'video', 'Final final', 20),
    ('import-20260401/videos/HYUNDAI_FINA_FINAL_FINAL.mp4', 'video', 'Hyundai', 21),
    ('import-20260401/videos/ioniq_oprava_jina_hudba.mp4', 'video', 'Ioniq', 22),
    ('import-20260401/videos/motogaraz_compressed.mp4', 'video', 'Motogaraz', 23),
    ('import-20260401/videos/NATIMA_Dvojita_sila_horciku_2.mp4', 'video', 'Natima dvojita sila', 24),
    ('import-20260401/videos/NATIMA_KLIENTSKE_VIDEO-video-export-2025-08-15T09-45-42.494Z.mp4', 'video', 'Natima klientske video', 25),
    ('import-20260401/videos/NUTWORLD_CZ_VERZE.mp4', 'video', 'Nutworld CZ', 26),
    ('import-20260401/videos/SCL_zamilovanoSK_Verze2.mp4', 'video', 'SCL zamilovano SK', 27),
    ('import-20260401/videos/TEENWEAR_OPRAVA_compressed.mp4', 'video', 'Teenwear oprava', 28),
    ('import-20260401/videos/teenwear_raw.mp4', 'video', 'Teenwear raw', 29),
    ('import-20260401/videos/TT-C-HR_Lifeestyletech_compressed.mp4', 'video', 'TT C-HR lifestyletech', 30),
    ('import-20260401/videos/TT_R4V4_1_compressed.mp4', 'video', 'TT R4V4', 31),
    ('import-20260401/videos/Verze3-video-export-2025-09-17T17-39-20.550Z.mp4', 'video', 'Verze 3', 32)
)
INSERT INTO public.portfolio_items (title, file_url, type, sort_order, is_active)
SELECT
  a.title,
  'https://bkemtvqmbpxopuasgxcq.supabase.co/storage/v1/object/public/portfolio/' || replace(a.path, ' ', '%20'),
  a.type,
  a.sort_order,
  true
FROM assets a
WHERE NOT EXISTS (
  SELECT 1
  FROM public.portfolio_items p
  WHERE p.file_url = 'https://bkemtvqmbpxopuasgxcq.supabase.co/storage/v1/object/public/portfolio/' || replace(a.path, ' ', '%20')
);
