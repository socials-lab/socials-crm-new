UPDATE public.colleagues
SET email_signature = replace(
  email_signature,
  '🎙️ Poslechněte si Socials Podcast (link: https://www.youtube.com/@socials_cz/videos)',
  '🎙️ Poslechněte si [Socials Podcast](https://www.youtube.com/@socials_cz/videos)'
)
WHERE email_signature LIKE '%🎙️ Poslechněte si Socials Podcast (link: https://www.youtube.com/@socials_cz/videos)%';

UPDATE public.colleagues
SET email_signature = replace(
  email_signature,
  '🎙️ Poslechněte si Socials Podcast: https://www.youtube.com/@socials_cz/videos',
  '🎙️ Poslechněte si [Socials Podcast](https://www.youtube.com/@socials_cz/videos)'
)
WHERE email_signature LIKE '%🎙️ Poslechněte si Socials Podcast: https://www.youtube.com/@socials_cz/videos%';
