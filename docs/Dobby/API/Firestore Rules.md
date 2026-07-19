---
title: Firestore Rules
type: module-doc
tags: [security, firestore, rules]
status: active
date: 2026-06-23
---

# Firestore Rules

**Location:** `firestore.rules`

## Users Collection

```
match /users/{userId}:
  read:  auth != null && auth.uid == userId
  create: auth != null && auth.uid == userId && tier == 'free'
  update: auth != null && auth.uid == userId
          && !('tier' in diff)
          && keys().hasOnly(['email', 'displayName', 'photoURL', 'usage', 'updatedAt'])
  delete: false
```

## Designs Collection (Top-Level)

```
match /designs/{designId}:
  read:   auth != null && auth.uid == resource.data.userId
  create: auth != null && auth.uid == request.resource.data.userId
  update: auth != null && auth.uid == resource.data.userId
  delete: auth != null && auth.uid == resource.data.userId
```

## Key Design Decisions

1. **Top-level designs** — Not sub-collection under users. Allows querying across all users (future sharing features).
2. **Tier immutability** — Client cannot set or change `tier` field. Must go through payment verification.
3. **Safe update fields** — Only `email`, `displayName`, `photoURL`, `usage`, `updatedAt` can be updated by client.
4. **Ownership by userId field** — Each design document contains `userId` field matching the owner's Firebase uid.
