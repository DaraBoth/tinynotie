# Australian Dollar (AUD) Currency Implementation Test

This document outlines the steps to test the implementation of the Australian Dollar (AUD) currency in the TinyNotie application.

## Changes Made

1. Added "Australian Dollar" as a new currency option with the symbol "A$" in:
   - Client-side CreateGroupPage.jsx
   - NextJS AddGroupPage.tsx
   - Currency suggestions in EditTrip.jsx
   - Currency suggestions in EditMember.jsx

## Testing Steps

### 1. Create a New Group with AUD Currency

1. Navigate to the Create Group page
2. Enter a group name
3. Select "Australian Dollar" from the currency dropdown
4. Add at least one member
5. Create the group
6. Verify that the group is created with the AUD currency symbol

### 2. Test Trip Creation with AUD Currency

1. Open the group created with AUD currency
2. Add a new trip
3. Verify that the currency chips show "A$" values
4. Add a trip with a specific amount
5. Verify that the amount is displayed with the "A$" symbol in the trip list

### 3. Test Member Addition with AUD Currency

1. In the same group, add a new member
2. Verify that the currency chips show "A$" values
3. Add a member with a specific paid amount
4. Verify that the amount is displayed with the "A$" symbol in the member list

### 4. Test Calculations

1. Add multiple trips with different members
2. Verify that the calculations in the summary table use the "A$" symbol
3. Check that the per-member amounts are correctly calculated and displayed

## Expected Results

- The "A$" symbol should be displayed consistently throughout the application
- All calculations should work correctly with the AUD currency
- The user experience should be the same as with other currencies

## Notes

- The server-side code doesn't need changes as it accepts any string value for the currency field
- The database schema is flexible enough to handle the new "A$" currency symbol
