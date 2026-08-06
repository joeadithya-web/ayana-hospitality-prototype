# AYANA MASTER BUILD PROMPT

## PART 4 OF 4 --- Simulation Engine, AI, Mock Data, Deployment & Delivery

> Complete the AYANA prototype using Parts 1--3 as the foundation.

# SIMULATION ENGINE

The Simulation Engine is the heart of AYANA.

It must own all application state.

No application should maintain independent business data.

The engine manages:

-   Guests
-   Hotels
-   Rooms
-   Bookings
-   Check-ins
-   Check-outs
-   Payments
-   Housekeeping
-   Notifications
-   Concierge Requests
-   AI Decisions
-   Failures
-   Manual Overrides

Implement a publish/subscribe architecture so every application reflects
changes immediately.

------------------------------------------------------------------------

# MOCK DATA

Automatically generate realistic datasets.

Hotels: - 15 hotels - Bengaluru and Hyderabad - 3★, 4★ and 5★ categories

Rooms: - Minimum 500 rooms - Categories - Views - Floors - Sections -
Occupancy

Guests: - Minimum 100 - Business travellers - Families - International
guests - VIP guests - Returning guests

Bookings: - Historical - Today's arrivals - Future reservations

Restaurant bills

Airport transfers

Invoices

Payments

Everything must appear realistic.

------------------------------------------------------------------------

# AI DECISION RULES

Create deterministic AI logic.

Inputs:

-   AYANA Memory
-   Hotel Occupancy
-   Room Readiness
-   Housekeeping Status
-   Guest Category
-   Loyalty
-   Business Rules

Outputs:

-   Best Room
-   Upgrade Suggestion
-   Preferred Floor
-   View Recommendation
-   Dining Suggestions
-   Concierge Suggestions
-   Airport Pickup
-   Late Checkout Offer

No external AI services.

------------------------------------------------------------------------

# DEMO AUTOMATION

Provide a Demo Mode.

Presenter selects:

-   Normal Journey
-   VIP
-   Business Traveller
-   Family
-   Repeat Guest
-   Payment Failure
-   PMS Offline
-   Room Not Ready
-   Manual Override
-   Checkout

The prototype automatically performs the scenario with realistic timing
and animations.

------------------------------------------------------------------------

# REGRESSION MODE

Include a dedicated Regression Demonstration mode.

Every major workflow should have:

Happy Path

Failure Path

Recovery Path

Demonstrate resilience.

------------------------------------------------------------------------

# REPORTS

Dashboard reports:

-   Occupancy
-   Revenue
-   Check-in Time
-   Checkout Time
-   Guest Satisfaction
-   Repeat Guests
-   Upsell Revenue
-   Outstanding Balances
-   Housekeeping Performance

Use charts with mock data.

------------------------------------------------------------------------

# NOTIFICATIONS

Support simulated:

-   Push Notifications
-   SMS
-   Email
-   In-App Alerts

Never use real services.

------------------------------------------------------------------------

# PERFORMANCE

Applications should feel instantaneous.

Lazy-load large modules.

Use reusable components.

Avoid duplicated logic.

------------------------------------------------------------------------

# DEPLOYMENT

Prepare for deployment on:

-   Vercel
-   Netlify

Provide separate URLs (or routes) for:

Traveller App

Hotel Dashboard

Kiosk

Control Centre

Allow all four to run simultaneously in different browser windows.

------------------------------------------------------------------------

# CODE QUALITY

Produce production-grade code.

Requirements:

-   Modular
-   Typed
-   Documented
-   Reusable
-   Clean architecture
-   Consistent naming
-   Responsive UI

Avoid technical debt.

------------------------------------------------------------------------

# DOCUMENTATION

Generate:

README.md

Architecture.md

Folder Structure

Setup Guide

Demo Guide

Future Production Roadmap

------------------------------------------------------------------------

# FINAL DEMONSTRATION

When complete, the prototype must support the following end-to-end
journey:

Traveller searches hotel

↓

Books room

↓

AI recommends room using AYANA Memory

↓

Payment simulation

↓

Hotel Dashboard receives booking

↓

Housekeeping marks room ready

↓

Traveller receives Ready-To-Room

↓

Guest arrives

↓

Kiosk validates QR

↓

Key issued

↓

Guest enters room

↓

Daily in-stay billing visible

↓

Guest pays outstanding balance

↓

Checkout completed

↓

Invoice generated

↓

Feedback collected

↓

Rebooking offered

All updates must occur in real time across all applications.

------------------------------------------------------------------------

# FINAL DELIVERABLE

Deliver a polished, production-quality interactive prototype.

This is not a mock-up.

This is not a slideshow.

This is not a UI demo.

It is a synchronized simulation platform capable of convincing hotel
owners that AYANA is ready for pilot deployment.

Continue building until every module described in Parts 1--4 is
implemented.

If context limits are reached, generate a handoff summary for the next
development session without changing architecture or code standards.

END OF MASTER BUILD PROMPT
