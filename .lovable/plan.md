

# Make Google Account Admin with Full Permissions

## Overview
Execute SQL updates to elevate your Google account (`pranavkp.2021@smu.edu.sg`) to admin status with full permissions across all dashboard sections.

## Current State
- **User ID**: `849e1f78-8361-4417-876e-0f7188ed821e`
- **Email**: `pranavkp.2021@smu.edu.sg`
- **Current Status**: Pending approval, no permissions, user role

## Changes to Execute

### 1. Approve Profile
Update the profile to mark it as approved:
- Set `approval_status` to `'approved'`
- Set `approved_at` to current timestamp

### 2. Grant Admin Role
Update the user role from `'user'` to `'admin'`

### 3. Enable All Permissions
Grant access to all dashboard sections:
- Financial data access
- Operations data access
- Sandbox/testing access

## Result After Execution
Once complete, you will be able to:
- Access the Admin dashboard via the header link
- View and manage all pending user approvals
- Toggle permissions for other users
- Access all tabs: Financials, Operations, and Sandbox

## Technical Details

```text
Database Updates:
┌─────────────────────────────────────────────────────────────┐
│ Table: profiles                                             │
│ ├─ approval_status: 'pending' → 'approved'                  │
│ └─ approved_at: null → now()                                │
├─────────────────────────────────────────────────────────────┤
│ Table: user_roles                                           │
│ └─ role: 'user' → 'admin'                                   │
├─────────────────────────────────────────────────────────────┤
│ Table: user_permissions                                     │
│ ├─ can_access_financials: false → true                      │
│ ├─ can_access_operations: false → true                      │
│ └─ can_access_sandbox: false → true                         │
└─────────────────────────────────────────────────────────────┘
```

