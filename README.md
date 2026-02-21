# FleetFlow

FleetFlow is a modular Fleet & Logistics Management System designed to digitize fleet operations. It centralizes vehicle management, trip dispatching, driver safety tracking, and financial monitoring into one structured platform.

## Features

- Authentication & RBAC - Secure login with role-based access (Manager, Dispatcher, Safety Officer, Financial Analyst).
- Command Center Dashboard â€“ Active fleet, maintenance alerts, utilization rate, pending cargo.
- Vehicle Management â€“ Add, edit, track vehicles (capacity, odometer, status).
- Trip Dispatching â€“ Assign driver + vehicle with validation (cargo â‰¤ max capacity).
- Maintenance Logs â€“ Logging service automatically moves vehicle to â€œIn Shopâ€.
- Fuel & Expenses â€“ Track fuel usage and operational costs per vehicle.
- Driver Safety â€“ License expiry validation, safety score, availability status.
- Analytics â€“ Fuel efficiency and vehicle ROI calculation.

## Tech Stack

- Frontend: Next.js 14, React, TypeScript, Tailwind CSS
- Backend: Next.js API Routes
- ORM: Prisma
- Database: SQLite
- Auth: JWT-based session with role-based access control

| Role              | Email                                                       | Password      |
| ----------------- | ----------------------------------------------------------- | ------------- |
| Manager           | [manager@fleetflow.com](mailto:manager@fleetflow.com)       | manager123    |
| Dispatcher        | [dispatcher@fleetflow.com](mailto:dispatcher@fleetflow.com) | dispatcher123 |
| Safety Officer    | [safety@fleetflow.com](mailto:safety@fleetflow.com)         | safety123     |
| Financial Analyst | [finance@fleetflow.com](mailto:finance@fleetflow.com)       | finance123    |

`src/app` - Pages and layouts  
`src/app/api` - API routes  
`src/components` - Reusable UI components  
`src/lib` - Prisma and auth logic  
`prisma` - Schema and seed files  

## License

MIT
