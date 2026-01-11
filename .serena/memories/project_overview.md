# Project Overview: SAMM AI Frontend

## Purpose
SAMM AI is a production-ready, LLM-agnostic SaaS platform providing **24/7 AI-powered phone answering for restaurants**. This is the **React Admin Dashboard** for restaurant management.

## Features Handled by Dashboard
- **Call Management** - View call logs, transcripts, recordings
- **Order Management** - Track takeout orders, update status
- **Reservation Management** - View/manage table reservations
- **Menu Management** - CRUD operations on menu items
- **Settings** - Restaurant config, hours, escalation numbers
- **AI Settings** - LLM provider configuration
- **Tenant Management** - Multi-tenant admin (super_admin only)

## Multi-Repository Architecture
| Repository | Purpose |
|------------|---------|
| `infra/` | Infrastructure orchestration |
| `api-python/` | Python FastAPI backend |
| `frontend/` | **This repo** - React Admin Dashboard |
| `backend/` | Rust real-time call gateway |

## Key Features
- **Multi-tenant SaaS** - Complete data isolation per restaurant
- **RBAC** - SuperAdmin, RestaurantAdmin, StaffViewer roles
- **i18n/RTL Support** - Full Arabic and English with RTL layout
- **Brand**: Samm AI
