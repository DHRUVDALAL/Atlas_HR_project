# Migration Document 01: Project Analysis

## 1. Executive Summary
This document outlines the migration of the Atlas HR Recruitment Management System from the old legacy React frontend (`/frontend`) to the new, modernized TanStack Start + React 19 target frontend (`/frontend-new`).

## 2. Migration Objectives
*   **Zero Backend Regressions**: Under no circumstances should backend API routers, models, schemas, or migrations be modified.
*   **Complete Feature Parity**: Ensure every page, modal, workflow state, filter option, and validation check in the reference frontend is correctly translated into the new frontend.
*   **Visual Redesign Integration**: Use the modern visual design guidelines (shadcn/ui-inspired component structures) provided in the new frontend while wiring them to real, dynamic APIs.

## 3. Technology Stack Comparison

| Component | Old Frontend (`/frontend`) | New Frontend (`/frontend-new`) |
| :--- | :--- | :--- |
| **Framework** | React 19 (Vite Single Page App) | React 19 (TanStack Start + SSR / Nitro) |
| **Routing** | React Router DOM v6 | TanStack Router (File-based routing) |
| **Styling** | Material-UI v9 (MUI) | Tailwind CSS v4 + Radix UI primitives |
| **State Management** | React Context (Auth, Notifications) | React Context + TanStack Query (v5) |
| **Form Handling** | React Hook Form + Yup | React Hook Form + Zod |
| **Query Client** | Axios Instance | Native fetch-based api wrapper |
