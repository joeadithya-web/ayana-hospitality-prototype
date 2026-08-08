# AYANA MASTER BUILD PROMPT

## PART 3 OF 4 --- Hotel Dashboard, Kiosk & Simulation Control Centre

> Continue from Parts 1 and 2. Build these applications using the same
> Simulation Engine and shared state.

# OBJECTIVE

Create three synchronized web applications:

1.  Hotel Operations Dashboard
2.  Self-Service Kiosk
3.  Hidden Simulation Control Centre

Every event in one application must immediately reflect in the others.

------------------------------------------------------------------------

# HOTEL DASHBOARD

Design for multiple hotel staff roles.

Roles:

-   Front Office
-   Duty Manager
-   Housekeeping
-   Concierge
-   Bell Desk
-   Finance
-   Administrator

Provide role-based navigation and permissions.

------------------------------------------------------------------------

# DASHBOARD HOME

Display:

-   Today's Arrivals
-   Today's Departures
-   Occupancy
-   Room Readiness
-   Rooms Under Cleaning
-   Pending Check-ins
-   Pending Check-outs
-   Revenue Today
-   Guest Requests
-   AI Alerts

Refresh automatically using the Simulation Engine.

------------------------------------------------------------------------

# FRONT OFFICE

Functions:

-   View arrivals
-   Verify identity
-   Check-in guest
-   Assign room
-   Change room
-   Upgrade room
-   Manual check-in
-   Manual checkout
-   Print receipt
-   Override payment
-   Issue replacement key

Every override must be logged.

------------------------------------------------------------------------

# HOUSEKEEPING

Display room status:

-   Ready
-   Occupied
-   Dirty
-   Cleaning
-   Out of Service
-   Maintenance

Changing a room to READY must immediately update:

-   Traveller App
-   Kiosk
-   Dashboard

------------------------------------------------------------------------

# CONCIERGE

Manage:

-   Airport Pickup
-   Taxi
-   Restaurant Booking
-   Local Recommendations
-   Wake-up Calls
-   Special Requests

Updates must appear in the Traveller App.

------------------------------------------------------------------------

# BELL DESK

Manage:

-   Baggage Pickup
-   Baggage Delivery
-   Luggage Storage
-   VIP Arrival Assistance

------------------------------------------------------------------------

# FINANCE

Display:

-   Payments
-   Refunds
-   Pending Balances
-   Settlement Summary
-   Commission Summary
-   Daily Revenue

Use mock transactions only.

------------------------------------------------------------------------

# ROOM MANAGEMENT

Maintain a live room inventory.

Each room stores:

-   Room Number
-   Floor
-   Section
-   View
-   Category
-   Occupancy
-   Cleaning Status
-   AI Score

Allow drag-and-drop room reassignment.

------------------------------------------------------------------------

# AI OPERATIONS PANEL

Display AI recommendations such as:

-   Suggested Upgrade
-   VIP Guest
-   Late Arrival
-   Overbooking Warning
-   Housekeeping Delay
-   Repeat Guest
-   Upsell Opportunity

Recommendations must change dynamically.

------------------------------------------------------------------------

# SELF-SERVICE KIOSK

Design a touch-friendly interface.

Flow:

Welcome → Scan QR → Booking Validation → Identity Verification
(Simulated) → Room Ready → Key Issued → Room Directions → Thank You

If verification fails, redirect to Front Office.

------------------------------------------------------------------------

# KIOSK FAILURE SCENARIOS

Support:

-   QR Invalid
-   Payment Pending
-   Room Not Ready
-   Identity Failed
-   Network Offline
-   PMS Offline
-   Duplicate Check-in Attempt

Each failure must provide a graceful recovery path.

------------------------------------------------------------------------

# SIMULATION CONTROL CENTRE

Hidden application.

Visible only to the presenter.

Purpose:

Control the entire demonstration.

Provide one-click scenario buttons.

------------------------------------------------------------------------

# DEMO SCENARIOS

Normal Guest

VIP Guest

Corporate Traveller

Family Stay

Repeat Guest

Airport Pickup

Late Night Arrival

Group Booking

Long Stay

------------------------------------------------------------------------

# FAILURE SCENARIOS

Payment Failure

OTP Failure

Identity Failure

Room Occupied

Room Under Cleaning

Housekeeping Delay

PMS Offline

Kiosk Offline

Network Failure

Guest Lost Phone

QR Code Expired

Booking Cancelled

Refund Required

Each scenario must update every application automatically.

------------------------------------------------------------------------

# MANUAL OVERRIDES

Allow hotel staff to:

-   Force Check-in
-   Force Checkout
-   Allocate Alternate Room
-   Approve Late Checkout
-   Waive Charges
-   Override Verification
-   Replace QR
-   Reissue Key

Every override must appear in the activity log.

------------------------------------------------------------------------

# LIVE ACTIVITY TIMELINE

Maintain a unified timeline.

Example:

08:00 Booking Created

08:01 Payment Received

08:03 Identity Verified

08:05 Room Allocated

08:20 Room Ready

09:10 Guest Arrived

09:12 QR Scanned

09:13 Key Issued

09:15 Guest Entered Room

Timeline visible in Traveller App and Dashboard.

------------------------------------------------------------------------

# ACCEPTANCE CRITERIA

-   Dashboard updates instantly.
-   Kiosk reacts to live state.
-   Control Centre changes all applications.
-   Every scenario is demonstrable.
-   Luxury visual design maintained.

END OF PART 3
