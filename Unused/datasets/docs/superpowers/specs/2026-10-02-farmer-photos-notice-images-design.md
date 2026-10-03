# Farmer Profile Photos & Notice Images — Design

Date: 2026-10-02
Status: approved by user (design presented in chat, approved as a whole)

## Goal

Farmers get a profile picture; notices (news feed) can carry picture galleries,
including two new notice categories for product and medicine announcements.

## Scope decisions (approved)

| Question | Decision |
|---|---|
| Products/medicines | **Notices only.** No catalog, no new tables for products, no new screen. New *categories*: `new_product`, `medicine`. |
| Images per notice | **Multiple (gallery), max 6**, upload order. |
| Storage | **BLOBs in SQLite** — the backend runs on the owner's PC behind a cloudflare tunnel, so the database doubles as the image store. Same lifetime as the rest of the data; no external service, no new dependency. |
| Profile photo transport | base64 **data-URI inside the `user` object** (`/auth/register`, `/auth/login`, `GET /auth/me`, `PUT /auth/me`, `POST/DELETE /auth/me/photo`). `_resolve_session` stays blob-free so the photo is not loaded on every request. |
| Notice image transport | dedicated **public route** `GET /notices/{id}/images/{index}` (index = 0-based upload order, `LIMIT 1 OFFSET`), `Cache-Control: public, max-age=86400`. Keeps the feed JSON light. |
| Admin access to images | index-based too: `DELETE /admin/notices/{id}/images/{index}` — the panel never needs image ids. |

## Data model

```sql
users        (+ photo BLOB)                       -- added by db._migrate, also in SCHEMA
notice_images (id PK, notice_id FK notices CASCADE, data BLOB, mime TEXT, created_at)
NOTICE_CATEGORIES += ('new_product', 'medicine')
```

## API contract (additive — nothing existing changes shape)

| Endpoint | Method | Auth | Behaviour |
|---|---|---|---|
| `/auth/me/photo` | POST | bearer | multipart `file` → user dict with `photo` data-URI. 400 bad type/corrupt, 422 >5 MB. |
| `/auth/me/photo` | DELETE | bearer | user dict with `photo: null`. |
| `/notices` | GET | public | items gain `image_count`. |
| `/notices/{id}/images/{index}` | GET | public | image bytes (`image/jpeg`), 404 plain-string when missing or the notice is a draft. |
| `/admin/notices/{id}/images` | POST | superadmin | multipart `file` → notice row with `image_count`. 404 unknown notice, 422 beyond 6 images. |
| `/admin/notices/{id}/images/{index}` | GET | superadmin | image bytes for **any** status — the panel previews drafts (`<img>` can't send headers, so it fetches with the token → blob URL). |
| `/admin/notices/{id}/images/{index}` | DELETE | superadmin | 204, 404 when the position does not exist. |

`media.py` normalises every upload (Pillow only): 5 MB cap, jpeg/png/webp,
EXIF-transposed, re-encoded to JPEG — that strips EXIF/location and bounds
database growth.

## Mobile plan

- `useApi.uploadAuthed(uri, endpoint, token)` — native `expo-file-system`
  multipart with an `Authorization` header and **no** `?model_id=`; non-2xx is
  thrown as an axios-shaped error so `authErrorMessage()` keeps working.
- `useAuth` gains `uploadPhoto(uri)` / `removePhoto()`; `App.js` passes them to
  `ProfileScreen`.
- `ProfileScreen`: card avatar shows `user.photo` (initials fallback); the
  details sheet gains Camera / Gallery / Remove buttons (expo-image-picker,
  `allowsEditing`, 1:1).
- `HomeScreen`: header avatar shows the photo.
- `NewsScreen`: horizontal image gallery per notice + filter chips
  "New products" / "Medicines"; `i18n` Nepali entries for every new string.

## Superadmin panel plan

Category select gains New product / Medicine; the composer gains a
`<input type="file" multiple>` (uploaded right after save via `FormData`) and a
thumbnail editor while editing; the notice list shows thumbnails.

## Error handling

Plain-string `detail` everywhere (401/403/404/400/422), rendered verbatim by
the mobile app and the panel toast.

## Testing

- `test_media.py` (new), `test_db.py` (new), `test_auth.py::PhotoTest`,
  `test_notices.py::NoticeImageFeedTest`, `test_admin.py::NoticeImageTest`.
- Mobile: `npm test` stays green; babel JSX parse of touched files.
- Live smoke via curl against `127.0.0.1:8010`.

## Out of scope

Product/medicine catalog, external image hosting, multiple photos per farmer,
photo in the superadmin user list, image editing beyond the picker's crop.
