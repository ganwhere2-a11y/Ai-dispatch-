# SOP Training Library

This folder contains structured training materials for the AI Dispatch operating system.
All files here are reference SOPs that can be uploaded to the dashboard's Knowledge Base
or referenced directly by agents.

## Files

| File | Description |
|---|---|
| `dispatching_fundamentals.md` | Complete freight dispatch training — Ditch Batching course by Dmitri Demichev. Covers industry overview, equipment, documentation, 9-step workflow, HOS regulations, market analysis, negotiation, load boards, sales/cold calling, and pricing. |

## How to Add New Training Materials

1. Save your course notes or training content as a `.md` file in this folder
2. Upload the file to the dashboard → Knowledge Base tab
3. The content will be auto-injected into all agent chat sessions

## How Agents Use This Content

All files uploaded through the dashboard's Knowledge Base are automatically prepended
to every agent conversation via the `/api/chat` endpoint in `server.js`.

This means Maya, Erin, Compliance, Sales, and all other agents have access to this
training content when making decisions.
