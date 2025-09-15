# Security Setup for VaksineApp

## Entra ID Configuration

### 1. App Registration
Create an Entra ID app registration for the PowerApps application:

```json
{
  "displayName": "VaksineApp",
  "signInAudience": "AzureADMyOrg",
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        {
          "id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d",
          "type": "Scope"
        }
      ]
    }
  ],
  "web": {
    "redirectUris": [
      "https://apps.powerapps.com/play/your-app-id"
    ]
  }
}
```

### 2. Security Groups
Create Entra ID security groups for role-based access:

#### Patient Group
- **Name**: `VaksineApp-Patients`
- **Description**: Patients who can view their own vaccination records
- **Members**: Individual patients

#### Healthcare Provider Group
- **Name**: `VaksineApp-Providers`
- **Description**: Healthcare providers who can manage patient records
- **Members**: Doctors, nurses, clinic staff

#### Administrator Group
- **Name**: `VaksineApp-Admins`
- **Description**: System administrators with full access
- **Members**: IT administrators, system managers

### 3. Conditional Access Policies
Configure conditional access for enhanced security:

```json
{
  "displayName": "VaksineApp Conditional Access",
  "state": "enabled",
  "conditions": {
    "applications": {
      "includeApplications": ["your-app-id"]
    },
    "users": {
      "includeGroups": [
        "VaksineApp-Patients",
        "VaksineApp-Providers", 
        "VaksineApp-Admins"
      ]
    },
    "locations": {
      "includeLocations": ["All"]
    }
  },
  "grantControls": {
    "operator": "AND",
    "builtInControls": ["mfa", "compliantDevice"]
  }
}
```

## DataVerse Security Configuration

### 1. Security Roles

#### Patient Role
```json
{
  "name": "Patient",
  "description": "Patients can view their own vaccination records",
  "privileges": [
    {
      "entity": "cr_patients",
      "privilege": "Read",
      "scope": "User"
    },
    {
      "entity": "cr_vaccinerecords", 
      "privilege": "Read",
      "scope": "User"
    },
    {
      "entity": "cr_vaccinetypes",
      "privilege": "Read", 
      "scope": "Organization"
    }
  ]
}
```

#### Healthcare Provider Role
```json
{
  "name": "Healthcare Provider",
  "description": "Providers can manage patient records",
  "privileges": [
    {
      "entity": "cr_patients",
      "privilege": "Create, Read, Update",
      "scope": "Business Unit"
    },
    {
      "entity": "cr_vaccinerecords",
      "privilege": "Create, Read, Update", 
      "scope": "Business Unit"
    },
    {
      "entity": "cr_appointments",
      "privilege": "Create, Read, Update, Delete",
      "scope": "Business Unit"
    },
    {
      "entity": "cr_healthcareproviders",
      "privilege": "Read",
      "scope": "Organization"
    },
    {
      "entity": "cr_vaccinetypes",
      "privilege": "Read",
      "scope": "Organization"
    }
  ]
}
```

#### Administrator Role
```json
{
  "name": "System Administrator",
  "description": "Full system access",
  "privileges": [
    {
      "entity": "*",
      "privilege": "Create, Read, Update, Delete",
      "scope": "Organization"
    }
  ]
}
```

### 2. Row-Level Security

#### Patient Data Access Rule
```javascript
// PowerApps Formula for Patient Data Access
If(
  User().Email = ThisRecord.cr_patientemail ||
  User().Email in cr_healthcareproviders.cr_email,
  true,
  false
)
```

#### Healthcare Provider Access Rule
```javascript
// PowerApps Formula for Provider Access
If(
  User().Email in cr_healthcareproviders.cr_email ||
  User().Email in cr_admins.cr_email,
  true,
  false
)
```

### 3. Field-Level Security

#### Sensitive Data Protection
- **Personnummer**: Encrypted at rest, masked in UI
- **Medical Conditions**: Restricted to healthcare providers
- **Allergies**: Visible to providers and patients
- **Contact Information**: Visible to assigned providers

## PowerApps Security Implementation

### 1. Authentication Setup
```javascript
// PowerApps App Settings
{
  "authentication": {
    "provider": "EntraID",
    "tenantId": "your-tenant-id",
    "clientId": "your-app-id"
  }
}
```

### 2. User Context
```javascript
// Get current user information
Set(
  CurrentUser,
  {
    Email: User().Email,
    FullName: User().FullName,
    Roles: User().Roles
  }
);
```

### 3. Access Control Logic
```javascript
// Check user permissions
Set(
  UserPermissions,
  {
    IsPatient: User().Email in cr_patients.cr_email,
    IsProvider: User().Email in cr_healthcareproviders.cr_email,
    IsAdmin: User().Email in cr_admins.cr_email
  }
);
```

### 4. Data Filtering
```javascript
// Filter data based on user role
Switch(
  true,
  UserPermissions.IsAdmin,
    // Show all data
    cr_vaccinerecords,
  UserPermissions.IsProvider,
    // Show provider's patients
    Filter(
      cr_vaccinerecords,
      cr_healthcareproviderid in Filter(
        cr_healthcareproviders,
        cr_email = User().Email
      ).cr_healthcareproviderid
    ),
  UserPermissions.IsPatient,
    // Show patient's own records
    Filter(
      cr_vaccinerecords,
      cr_patientid in Filter(
        cr_patients,
        cr_email = User().Email
      ).cr_patientid
    ),
  // Default: no access
  []
)
```

## Compliance and Audit

### 1. Audit Logging
- All data access is logged
- User actions are tracked
- Data modifications are recorded with timestamps

### 2. GDPR Compliance
- Data minimization principles
- Right to be forgotten implementation
- Data portability features
- Consent management

### 3. Norwegian Healthcare Regulations
- Compliance with Norwegian data protection laws
- Integration with national health registries
- Secure handling of personal health information

## Testing Security

### 1. Penetration Testing
- Regular security assessments
- Vulnerability scanning
- Access control testing

### 2. User Acceptance Testing
- Role-based access verification
- Data isolation testing
- Authentication flow testing

### 3. Compliance Auditing
- Regular compliance reviews
- Documentation updates
- Policy adherence verification
