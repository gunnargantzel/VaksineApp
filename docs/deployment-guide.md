# Deployment Guide for VaksineApp

## Prerequisites

### 1. Microsoft Power Platform Environment
- Power Apps Premium license
- Power Automate license (if using workflows)
- DataVerse database capacity
- Entra ID tenant with appropriate permissions

### 2. Required Permissions
- Power Platform Administrator
- Entra ID Global Administrator (for app registration)
- DataVerse System Administrator
- Power Apps Environment Maker

### 3. Tools and Software
- Power Apps Studio
- Power Platform CLI
- Visual Studio Code (optional)
- Postman (for API testing)

## Step-by-Step Deployment

### Phase 1: Environment Setup

#### 1.1 Create Power Platform Environment
```powershell
# Using Power Platform CLI
pac org create --name "VaksineApp Production" --region "Europe" --type "Production"
pac org create --name "VaksineApp Development" --region "Europe" --type "Sandbox"
```

#### 1.2 Configure Environment Settings
1. Navigate to Power Platform Admin Center
2. Select your environment
3. Configure the following settings:
   - **Security**: Enable security roles
   - **Data Loss Prevention**: Configure DLP policies
   - **Backup**: Set up automated backups
   - **Monitoring**: Enable audit logs

### Phase 2: Entra ID Configuration

#### 2.1 Create App Registration
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
  ]
}
```

#### 2.2 Configure Authentication
1. Go to Entra ID → App registrations
2. Select your app registration
3. Configure:
   - **Redirect URIs**: Add Power Apps URLs
   - **API permissions**: Grant necessary permissions
   - **Certificates & secrets**: Create client secret
   - **Authentication**: Configure supported account types

#### 2.3 Create Security Groups
```powershell
# Using Microsoft Graph PowerShell
New-MgGroup -DisplayName "VaksineApp-Patients" -Description "Patients group"
New-MgGroup -DisplayName "VaksineApp-Providers" -Description "Healthcare providers group"
New-MgGroup -DisplayName "VaksineApp-Admins" -Description "Administrators group"
```

### Phase 3: DataVerse Setup

#### 3.1 Create Custom Tables
```powershell
# Using Power Platform CLI
pac solution create --name "VaksineApp-Core"
pac solution add-reference --path "dataverse/table-definitions"
pac solution export --name "VaksineApp-Core" --path "solution-export"
```

#### 3.2 Configure Table Relationships
1. Open Power Apps Maker Portal
2. Navigate to Data → Tables
3. For each table:
   - Create relationships
   - Configure cascading rules
   - Set up indexes
   - Configure business rules

#### 3.3 Set Up Security Roles
```json
{
  "roles": [
    {
      "name": "Patient",
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
        }
      ]
    },
    {
      "name": "Healthcare Provider",
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
        }
      ]
    }
  ]
}
```

### Phase 4: PowerApps Application

#### 4.1 Create Canvas App
1. Open Power Apps Studio
2. Create new canvas app
3. Configure app settings:
   - **Name**: VaksineApp
   - **Description**: Vaccine Information System
   - **Icon**: Upload custom icon
   - **Theme**: Configure colors and fonts

#### 4.2 Add Data Connections
```javascript
// App OnStart formula
Set(
  CurrentUser,
  {
    Email: User().Email,
    FullName: User().FullName,
    Roles: User().Roles
  }
);

// Data source connections
Set(
  DataSources,
  {
    Patients: cr_patients,
    VaccinationRecords: cr_vaccinerecords,
    VaccineTypes: cr_vaccinetypes,
    HealthcareProviders: cr_healthcareproviders,
    Appointments: cr_appointments
  }
);
```

#### 4.3 Build Application Screens
1. **Login Screen**: Entra ID authentication
2. **Patient Dashboard**: View vaccination history
3. **Provider Dashboard**: Manage patient records
4. **Admin Dashboard**: System administration
5. **Forms**: Create/edit vaccination records

#### 4.4 Configure Security
```javascript
// User permission checks
Set(
  UserPermissions,
  {
    IsPatient: User().Email in cr_patients.cr_email,
    IsProvider: User().Email in cr_healthcareproviders.cr_email,
    IsAdmin: User().Email in cr_admins.cr_email
  }
);

// Data filtering based on permissions
Set(
  FilteredData,
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
      )
  )
);
```

### Phase 5: Testing and Validation

#### 5.1 Unit Testing
```javascript
// Test user authentication
Test(
  "User Authentication",
  User().Email <> "",
  "User should be authenticated"
);

// Test data access
Test(
  "Data Access",
  CountRows(FilteredData) >= 0,
  "User should have access to appropriate data"
);
```

#### 5.2 Integration Testing
1. **Authentication Flow**: Test Entra ID login
2. **Data Access**: Verify role-based permissions
3. **CRUD Operations**: Test create, read, update, delete
4. **Business Rules**: Validate data constraints

#### 5.3 User Acceptance Testing
1. **Patient Testing**: Verify patient can view own records
2. **Provider Testing**: Verify provider can manage patients
3. **Admin Testing**: Verify admin has full access
4. **Security Testing**: Verify data isolation

### Phase 6: Production Deployment

#### 6.1 Solution Export
```powershell
# Export solution for deployment
pac solution export --name "VaksineApp-Core" --path "production-solution"
```

#### 6.2 Production Import
```powershell
# Import to production environment
pac solution import --path "production-solution/VaksineApp-Core.zip"
```

#### 6.3 App Deployment
1. Export app from development
2. Import to production environment
3. Configure production data connections
4. Update app settings for production

#### 6.4 User Provisioning
```powershell
# Add users to security groups
Add-MgGroupMember -GroupId "group-id" -DirectoryObjectId "user-id"
```

### Phase 7: Monitoring and Maintenance

#### 7.1 Set Up Monitoring
1. **Power Platform Analytics**: Monitor app usage
2. **DataVerse Analytics**: Track data operations
3. **Entra ID Sign-ins**: Monitor authentication
4. **Custom Dashboards**: Create monitoring views

#### 7.2 Backup Strategy
```powershell
# Automated backup script
$backupDate = Get-Date -Format "yyyy-MM-dd"
pac solution export --name "VaksineApp-Core" --path "backups/$backupDate"
```

#### 7.3 Update Procedures
1. **Development**: Make changes in dev environment
2. **Testing**: Validate changes in test environment
3. **Production**: Deploy to production environment
4. **Rollback**: Plan for rollback procedures

## Troubleshooting

### Common Issues

#### 1. Authentication Problems
- **Issue**: Users cannot log in
- **Solution**: Check Entra ID app registration configuration
- **Prevention**: Test authentication in development first

#### 2. Data Access Issues
- **Issue**: Users cannot see expected data
- **Solution**: Verify security roles and row-level security
- **Prevention**: Test with different user roles

#### 3. Performance Issues
- **Issue**: App is slow to load
- **Solution**: Optimize data queries and add indexes
- **Prevention**: Monitor performance metrics

### Support Contacts
- **Power Platform Support**: Microsoft Support
- **Entra ID Support**: Azure Support
- **DataVerse Support**: Power Platform Support

## Security Checklist

- [ ] Entra ID app registration configured
- [ ] Security groups created and populated
- [ ] DataVerse security roles configured
- [ ] Row-level security implemented
- [ ] Field-level security configured
- [ ] Audit logging enabled
- [ ] Data encryption at rest
- [ ] Data encryption in transit
- [ ] Access controls tested
- [ ] Compliance requirements met

## Performance Optimization

### 1. Data Model Optimization
- Create appropriate indexes
- Optimize table relationships
- Use computed columns for frequently accessed data

### 2. App Performance
- Minimize data queries
- Use collections for frequently accessed data
- Implement lazy loading for large datasets

### 3. Network Optimization
- Use CDN for static assets
- Optimize API calls
- Implement caching strategies
