# Postman API Testing

Base URL locally: `http://localhost:5000`

Use Header `Content-Type: application/json` for POST requests. Enable cookie capture or keep Postman cookies for the admin unlock/session tests.

## 1. Get current article

GET `/api/article`

Expected: `200 OK`, with `currentRevision`, `lastEditor`, `lastUpdated`, and `version`.

## 2. Get revision history

GET `/api/article/revisions`

Expected: `200 OK`, ordered newest to oldest.

## 3. Get one revision

GET `/api/article/revisions/1`

Expected: `200 OK`. Change `1` to an existing ID. Unknown IDs return `404`.

## 4. Create a new revision

POST `/api/article/revisions`

```json
{
  "editorName": "Test Editor",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [{ "type": "text", "text": "Testing a revision." }]
      }
    ]
  },
  "expectedCurrentVersion": 1
}
```

Expected: `201 Created`. Using an outdated version returns `409` with the reload message.

## 5. Admin unlock

POST `/api/admin/unlock`

```json
{ "accessCode": "<your private ADMIN_ACCESS_CODE>" }
```

Do not place the real code in screenshots or source files. Correct codes return `200` and set an HttpOnly cookie. Incorrect codes return `401`; repeated attempts may return `429`.

## 6. Admin session

GET `/api/admin/session`

Send the cookie from unlock. Expected `200`; missing/invalid auth returns `401`.

## 7. Restore a previous revision

POST `/api/admin/revisions/1/restore`

No body. Expected `201` and a newly numbered restoration revision. Missing authorization returns `401`; unknown revision returns `404`.

## 8. Restore default

POST `/api/admin/restore-default`

No body. Expected `201` with a new revision whose content matches the original and whose `restoredFromRevisionId` points to the original revision.

## 9. Admin logout

POST `/api/admin/logout`

No body. Expected `200` and a cleared session cookie.

## Screenshots

For final-project evidence, capture status code, response JSON, relevant request body, and the application history after successful save/restore tests. Crop or redact administrator codes and database credentials.
